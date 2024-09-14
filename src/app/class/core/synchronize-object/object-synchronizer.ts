import { EventSystem, Network } from '../system';
import { GameObject, ObjectContext } from './game-object';
import { markForChanged } from './object-event-extension';
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
        console.log('CONNECT_PEER GameRoomService !!!', event.data.peerId);
        this.sendCatalog(event.data.peerId);
      })
      .on('DISCONNECT_PEER', event => {
        this.removePeerMap(event.data.peerId);
      })
      .on<CatalogItem[]>('SYNCHRONIZE_GAME_OBJECT', event => {
        if (event.isSendFromSelf) return;
        console.log('SYNCHRONIZE_GAME_OBJECT ' + event.sendFrom);
        let catalog: CatalogItem[] = event.data;
        for (let item of catalog) {
          if (ObjectStore.instance.isDeleted(item.identifier)) {
            EventSystem.call('DELETE_GAME_OBJECT', { aliasName: '', identifier: item.identifier }, event.sendFrom);
          } else {
            this.addRequestMap(item, event.sendFrom);
          }
        }
        this.synchronize();
      })
      .on('REQUEST_GAME_OBJECT', event => {
        if (event.isSendFromSelf) return;
        if (ObjectStore.instance.isDeleted(event.data)) {
          EventSystem.call('DELETE_GAME_OBJECT', { aliasName: '', identifier: event.data }, event.sendFrom);
        } else {
          let object: GameObject = ObjectStore.instance.get(event.data);
          if (object) EventSystem.call('UPDATE_GAME_OBJECT', object.toContext(), event.sendFrom);
        }
      })
      .on('UPDATE_GAME_OBJECT', 1000, event => {
        let context: ObjectContext = event.data;
        let object: GameObject = ObjectStore.instance.get(context.identifier);
        if (object) {
          let updateObject = event.isSendFromSelf ? object : this.updateObject(object, context);
          if (updateObject) {
            markForChanged(updateObject, event.sendFrom);
          } else if (!event.isSendFromSelf) {
            EventSystem.call('UPDATE_GAME_OBJECT', object.toContext(), event.sendFrom);
          }
        } else if (ObjectStore.instance.isDeleted(context.identifier)) {
          EventSystem.call('DELETE_GAME_OBJECT', { aliasName: context.aliasName, identifier: context.identifier }, event.sendFrom);
        } else {
          let newObject = this.createObject(context);
          if (newObject) markForChanged(newObject, event.sendFrom);
        }
      })
      .on('DELETE_GAME_OBJECT', 1000, event => {
        let identifier: ObjectIdentifier = event.data.identifier;
        ObjectStore.instance.delete(identifier, false);
      });
  }

  destroy() {
    EventSystem.unregister(this);
  }

  private updateObject(object: GameObject, context: ObjectContext): GameObject {
    let version = context.majorVersion + context.minorVersion;
    if (object.version < version) {
      object.apply(context);
    } else if (version < object.version) {
      return null;
    }
    return object;
  }

  private createObject(context: ObjectContext): GameObject {
    let newObject: GameObject = ObjectFactory.instance.create(context.aliasName, context.identifier);
    if (!newObject) {
      console.warn(context.aliasName + ' is Unknown...?', context);
      return null;
    }
    ObjectStore.instance.add(newObject, false);
    newObject.apply(context);
    return newObject;
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
    let isContinue = true;
    while (0 < this.requestMap.size && this.tasks.length < 32 && isContinue) {
      isContinue = this.runSynchronizeTask();
    };
  }

  private runSynchronizeTask() {
    let targetPeerId = this.getTargetPeerId();
    if (targetPeerId.length < 1) return false;
    let requests: SynchronizeRequest[] = this.makeRequestList(targetPeerId);

    if (requests.length < 1) {
      this.removePeerMap(targetPeerId);
      return 0 < this.peerMap.size;
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

    return true;
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
    let selectPeerId: PeerId = '';
    let peers = Network.peers;

    for (let i = peers.length - 1; 0 <= i; i--) {
      let rand = Math.floor(Math.random() * (i + 1));
      [peers[i], peers[rand]] = [peers[rand], peers[i]];
    }

    for (let peer of peers) {
      let tasks = this.peerMap.get(peer.peerId);
      if (peer.isOpen && tasks && tasks.length < min) {
        min = tasks.length;
        selectPeerId = peer.peerId;
      }
    }
    return selectPeerId;
  }
}
