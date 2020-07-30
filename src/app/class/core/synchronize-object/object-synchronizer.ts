import { EventSystem, Network } from '../system';
import { GameObject, ObjectContext } from './game-object';
import { ObjectFactory } from './object-factory';
import { CatalogItem, ObjectStore } from './object-store';
import { SynchronizeRequest, SynchronizeTask } from './synchronize-task';

type PeerId = string;
type ObjectIdentifier = string;

export class ObjectSynchronizer {
  private static _instance: ObjectSynchronizer
  static get instance(): ObjectSynchronizer {
    if (!ObjectSynchronizer._instance) ObjectSynchronizer._instance = new ObjectSynchronizer();
    return ObjectSynchronizer._instance;
  }

  private requestMap: Map<ObjectIdentifier, SynchronizeRequest> = new Map();
  private peerMap: Map<PeerId, SynchronizeTask[]> = new Map();
  private tasks: SynchronizeTask[] = [];

  private constructor() { }

  initialize() {
    this.destroy();
    console.log('ObjectSynchronizer ready...');
    EventSystem.register(this)
      .on('CONNECT_PEER', 2, event => {
        if (!event.isSendFromSelf) return;
        console.log('CONNECT_PEER GameRoomService !!!', event.data.peer);
        this.sendCatalog(event.data.peer);
      })
      .on('DISCONNECT_PEER', event => {
        this.removePeerMap(event.data.peer);
      })
      .on<CatalogItem[]>('SYNCHRONIZE_GAME_OBJECT', event => {
        if (event.isSendFromSelf) return;
        console.log('SYNCHRONIZE_GAME_OBJECT ' + event.sendFrom);
        let catalog: CatalogItem[] = event.data;
        for (let item of catalog) {
          if (ObjectStore.instance.isDeleted(item.identifier)) {
            EventSystem.call('DELETE_GAME_OBJECT', { identifier: item.identifier }, event.sendFrom);
          } else {
            this.addRequestMap(item, event.sendFrom);
          }
        }
        this.synchronize();
      })
      .on('REQUEST_GAME_OBJECT', event => {
        if (event.isSendFromSelf) return;
        if (ObjectStore.instance.isDeleted(event.data)) {
          EventSystem.call('DELETE_GAME_OBJECT', { identifier: event.data }, event.sendFrom);
        } else {
          let object: GameObject = ObjectStore.instance.get(event.data);
          if (object) EventSystem.call('UPDATE_GAME_OBJECT', object.toContext(), event.sendFrom);
        }
      })
      .on('UPDATE_GAME_OBJECT', event => {
        let context: ObjectContext = event.data;
        let object: GameObject = ObjectStore.instance.get(context.identifier);
        if (object) {
          if (!event.isSendFromSelf) this.updateObject(object, context);
        } else if (ObjectStore.instance.isDeleted(context.identifier)) {
          EventSystem.call('DELETE_GAME_OBJECT', { identifier: context.identifier }, event.sendFrom);
        } else {
          this.createObject(context);
        }
      })
      .on('DELETE_GAME_OBJECT', event => {
        let context: ObjectContext = event.data;
        ObjectStore.instance.delete(context.identifier, false);
      });
  }

  destroy() {
    EventSystem.unregister(this);
  }

  private updateObject(object: GameObject, context: ObjectContext) {
    if (context.majorVersion + context.minorVersion > object.version) {
      object.apply(context);
    }
  }

  private createObject(context: ObjectContext) {
    let newObject: GameObject = ObjectFactory.instance.create(context.aliasName, context.identifier);
    if (!newObject) {
      console.warn(context.aliasName + ' is Unknown...?', context);
      return;
    }
    ObjectStore.instance.add(newObject, false);
    newObject.apply(context);
  }

  private sendCatalog(sendTo: PeerId) {
    let catalog = ObjectStore.instance.getCatalog();
    let interval = setInterval(() => {
      let count = catalog.length < 2048 ? catalog.length : 2048;
      EventSystem.call('SYNCHRONIZE_GAME_OBJECT', catalog.splice(0, count), sendTo);
      if (catalog.length < 1) clearInterval(interval);
    });
  }

  private addRequestMap(item: CatalogItem, sendFrom: PeerId) {
    let request = this.requestMap.get(item.identifier);
    if (request && request.version === item.version) {
      request.holderIds.push(sendFrom);
      this.addPeerMap(sendFrom);
    } else if (!request || request.version < item.version) {
      this.requestMap.set(item.identifier, { identifier: item.identifier, version: item.version, holderIds: [sendFrom], ttl: 2 });
      this.addPeerMap(sendFrom);
    }
  }

  private addPeerMap(targetPeerId: PeerId) {
    if (!this.peerMap.has(targetPeerId)) this.peerMap.set(targetPeerId, []);
  }

  private removePeerMap(targetPeerId: PeerId) {
    this.peerMap.delete(targetPeerId);
  }

  private synchronize() {
    while (0 < this.requestMap.size && this.tasks.length < 32) this.runSynchronizeTask();
  }

  private runSynchronizeTask() {
    let targetPeerId = this.getTargetPeerId();
    let requests: SynchronizeRequest[] = this.makeRequestList(targetPeerId);

    if (requests.length < 1) {
      this.removePeerMap(targetPeerId);
      return;
    }
    let task = SynchronizeTask.create(targetPeerId, requests);
    this.tasks.push(task);

    let targetPeerIdTasks = this.peerMap.get(targetPeerId);
    if (targetPeerIdTasks) targetPeerIdTasks.push(task);

    task.onfinish = task => {
      this.tasks.splice(this.tasks.indexOf(task), 1);
      let targetPeerIdTasks = this.peerMap.get(targetPeerId);
      if (targetPeerIdTasks) targetPeerIdTasks.splice(targetPeerIdTasks.indexOf(task), 1);
      this.synchronize();
    }

    task.ontimeout = (task, remainedRequests) => {
      console.log('GameObject synchronize タイムアウト');
      remainedRequests.forEach(request => this.requestMap.set(request.identifier, request));
    }
  }

  private makeRequestList(targetPeerId: PeerId, maxRequest: number = 32): SynchronizeRequest[] {
    let requests: SynchronizeRequest[] = [];

    for (let [identifier, request] of this.requestMap) {
      if (maxRequest <= requests.length) break;
      if (!request.holderIds.includes(targetPeerId)) continue;

      let gameObject = ObjectStore.instance.get(request.identifier);
      if (!gameObject || gameObject.version < request.version) requests.push(request);

      this.requestMap.delete(identifier);
    }
    return requests;
  }

  private getTargetPeerId(): PeerId {
    let min = 9999;
    let selectPeerId: PeerId = null;
    let peerContexts = Network.peerContexts;

    for (let i = peerContexts.length - 1; 0 <= i; i--) {
      let rand = Math.floor(Math.random() * (i + 1));
      [peerContexts[i], peerContexts[rand]] = [peerContexts[rand], peerContexts[i]];
    }

    for (let peerContext of peerContexts) {
      let tasks = this.peerMap.get(peerContext.fullstring);
      if (peerContext.isOpen && tasks && tasks.length < min) {
        min = tasks.length;
        selectPeerId = peerContext.fullstring;
      }
    }
    return selectPeerId;
  }
}
