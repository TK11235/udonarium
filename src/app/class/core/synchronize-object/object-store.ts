import { GameObject, ObjectContext } from './game-object';
import { ObjectFactory, Type } from './object-factory';
import { EventSystem } from '../system/system';

export class ObjectStore {
  private static _instance: ObjectStore
  static get instance(): ObjectStore {
    if (!ObjectStore._instance) ObjectStore._instance = new ObjectStore();
    return ObjectStore._instance;
  }

  private identifierHash: { [identifier: string]: GameObject } = {};
  private classHash: { [aliasName: string]: GameObject[] } = {};
  //private garbageHash: { [identifier: string]: { context: ObjectContext, timeStamp: number } } = {};
  private garbageHash: { [identifier: string]: { aliasName: string, timeStamp: number } } = {};

  private queue: { [identifier: string]: ObjectContext } = {};
  private updateInterval: NodeJS.Timer = null;
  private garbageCollectionInterval: NodeJS.Timer = null;
  private updateCallback = () => { this.updateQueue(); }

  private constructor() { console.log('ObjectStore ready...'); };

  add(object: GameObject) {
    //console.log('addGameObject() ' + object.identifier);
    if (this.identifierHash[object.identifier] != null) return;
    this.identifierHash[object.identifier] = object;
    let objects = this._getObjects(object.aliasName);
    objects.push(object);
  }

  delete(object: GameObject, needCallEvent: boolean = true): GameObject {
    if (!this.identifierHash[object.identifier]) return null;
    //console.warn('deleteGameObject()', object.identifier);

    let objects = this._getObjects(object.aliasName);
    let index = objects.indexOf(object);
    if (-1 < index) objects.splice(index, 1);
    delete this.identifierHash[object.identifier];

    this.garbageCollection(10 * 60 * 1000);

    //let garbage: ObjectContext = object.destroy();
    /* */
    EventSystem.unregister(object);
    //let garbage = object.toContext();
    /* */
    if (needCallEvent) {
      this.garbageHash[object.identifier] = { aliasName: object.identifier, timeStamp: performance.now() };
      EventSystem.call('DELETE_GAME_OBJECT', { identifier: object.identifier });
    }
    return object;
  }

  get<T extends GameObject>(identifier: string): T {
    let object: T = <T>this.identifierHash[identifier];
    return object ? object : null;
  }

  getObjects<T extends GameObject>(constructor: Type<T>): T[]
  getObjects<T extends GameObject>(aliasName: string): T[]
  getObjects<T extends GameObject>(): T[]
  getObjects<T extends GameObject>(arg?: any): T[] {
    return this._getObjects<T>(arg).concat();
  }

  private _getObjects<T extends GameObject>(constructor: Type<T>): T[]
  private _getObjects<T extends GameObject>(aliasName: string): T[]
  private _getObjects<GameObject>(): GameObject[]
  private _getObjects<T extends GameObject>(arg?: any): T[] {
    if (arg == null) {
      let objects: T[] = [];
      for (let identifier in this.identifierHash) {
        objects.push(<T>this.identifierHash[identifier]);
      }
      return objects;
    }
    let aliasName = '';
    if (typeof arg === 'string') {
      aliasName = arg;
    } else {
      aliasName = arg.aliasName;
    }

    if (!(aliasName in this.classHash)) {
      this.classHash[aliasName] = [];
    }

    return <T[]>this.classHash[aliasName];
  }

  getDeletedObject(identifier: string): string {
    this.garbageCollection(10 * 60 * 1000);
    let garbage = this.garbageHash[identifier];
    return garbage ? garbage.aliasName : null;
  }

  update(identifier: string)
  update(context: ObjectContext)
  update(arg: any) {
    let context: ObjectContext = null;
    if (typeof arg === 'string') {
      let object: GameObject = this.get(arg);
      if (object) context = object.toContext();
    } else {
      context = arg;
    }
    if (!context) return;

    if (this.queue[context.identifier]) {
      let queue = this.queue[context.identifier];
      for (let key in context) {
        queue[key] = context[key];
      }
      return;
    }
    EventSystem.call('UPDATE_GAME_OBJECT', context);
    this.queue[context.identifier] = context;
    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(this.updateCallback, 0);
    }
  }

  private updateQueue() {
    this.queue = {};
    this.updateInterval = null;
  }

  synchronize() {
    for (let identifier in this.identifierHash) {
      this.identifierHash[identifier].update(false);
    }
  }

  isDeleted(identifier: string, compare?: ObjectContext) {
    let garbage = this.getDeletedObject(identifier);
    if (!garbage) return false;
    return true;
  }

  private garbageCollection(garbage: ObjectContext)
  private garbageCollection(ms: number)
  private garbageCollection(arg: any) {
    if (typeof arg === 'number') {
      if (this.garbageCollectionInterval === null) {
        this.garbageCollectionInterval = setTimeout(() => { this.garbageCollectionInterval = null }, 100);
        this._garbageCollection(arg);
      }
    } else {
      delete this.garbageHash[arg.identifier];
    }
  }

  private _garbageCollection(ms: number) {
    let nowDate = performance.now();//Date.now();
    for (let identifier in this.garbageHash) {
      if (this.garbageHash[identifier].timeStamp + ms < nowDate) {
        delete this.garbageHash[identifier];
      }
    }
  }
}
setTimeout(function () { ObjectStore.instance; }, 0);
