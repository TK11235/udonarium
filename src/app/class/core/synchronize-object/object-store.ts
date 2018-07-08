import { GameObject, ObjectContext } from './game-object';
import { ObjectFactory, Type } from './object-factory';
import { EventSystem } from '../system/system';

interface DeletedObjectContext {
  aliasName: string;
  timeStamp: number;
}

export type CatalogItem = { identifier: string, version: number };

export class ObjectStore {
  private static _instance: ObjectStore
  static get instance(): ObjectStore {
    if (!ObjectStore._instance) ObjectStore._instance = new ObjectStore();
    return ObjectStore._instance;
  }

  private identifierHash: { [identifier: string]: GameObject } = {};
  private classHash: { [aliasName: string]: GameObject[] } = {};
  private garbageHash: { [identifier: string]: DeletedObjectContext } = {};

  private queue: { [identifier: string]: ObjectContext } = {};
  private updateInterval: NodeJS.Timer = null;
  private garbageCollectionInterval: NodeJS.Timer = null;
  private updateCallback = () => { this.updateQueue(); }

  private constructor() { console.log('ObjectStore ready...'); };

  add(object: GameObject) {
    if (this.identifierHash[object.identifier] != null) return;
    this.identifierHash[object.identifier] = object;
    let objects = this._getObjects(object.aliasName);
    objects.push(object);
  }

  remove(object: GameObject, shouldUnregister: boolean = true): GameObject {
    if (!this.identifierHash[object.identifier]) return null;

    let objects = this._getObjects(object.aliasName);
    let index = objects.indexOf(object);
    if (-1 < index) objects.splice(index, 1);
    delete this.identifierHash[object.identifier];

    if (shouldUnregister) EventSystem.unregister(object);

    return object;
  }

  delete(object: GameObject, shouldBroadcast: boolean = true): GameObject {
    if (this.remove(object) === null) return null;

    this.garbageCollection(10 * 60 * 1000);
    this.garbageHash[object.identifier] = { aliasName: object.aliasName, timeStamp: performance.now() };
    if (shouldBroadcast) EventSystem.call('DELETE_GAME_OBJECT', { identifier: object.identifier });

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

  getDeletedObject(identifier: string): DeletedObjectContext {
    this.garbageCollection(10 * 60 * 1000);
    let garbage = this.garbageHash[identifier];
    return garbage ? garbage : null;
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

  isDeleted(identifier: string) {
    let garbage = this.getDeletedObject(identifier);
    if (!garbage) return false;
    return true;
  }

  getCatalog(): CatalogItem[] {
    let catalog: CatalogItem[] = [];
    for (let identifier in this.identifierHash) {
      catalog.push({ identifier: identifier, version: this.identifierHash[identifier].version });
    }
    return catalog;
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
    let nowDate = performance.now();
    for (let identifier in this.garbageHash) {
      if (this.garbageHash[identifier].timeStamp + ms < nowDate) {
        delete this.garbageHash[identifier];
      }
    }
  }
}
