import { EventSystem } from '../system/system';
import { setZeroTimeout } from '../system/util/zero-timeout';
import { GameObject, ObjectContext } from './game-object';
import { Type } from './object-factory';

type ObjectIdentifier = string;
type TimeStamp = number;

export type CatalogItem = { identifier: string, version: number };

export class ObjectStore {
  private static _instance: ObjectStore
  static get instance(): ObjectStore {
    if (!ObjectStore._instance) ObjectStore._instance = new ObjectStore();
    return ObjectStore._instance;
  }

  private identifierHash: { [identifier: string]: GameObject } = {};
  private classHash: { [aliasName: string]: GameObject[] } = {};
  private garbageMap: Map<ObjectIdentifier, TimeStamp> = new Map();

  private queue: { [identifier: string]: ObjectContext } = {};
  private updateInterval: number = null;
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

  delete(object: GameObject, shouldBroadcast?: boolean): GameObject
  delete(identifier: string, shouldBroadcast?: boolean): GameObject
  delete(arg: any, shouldBroadcast: boolean = true) {
    let object: GameObject = null;
    let identifier: string = null;
    if (typeof arg === 'string') {
      object = this.get(arg);
      identifier = arg;
    } else {
      object = arg;
      identifier = arg.identifier;
    }
    this.markForDelete(identifier);
    return object == null ? null : this._delete(object, shouldBroadcast);
  }

  private _delete(object: GameObject, shouldBroadcast: boolean): GameObject {
    if (this.remove(object) === null) return null;
    if (shouldBroadcast) EventSystem.call('DELETE_GAME_OBJECT', { identifier: object.identifier });

    return object;
  }

  private markForDelete(identifier: string) {
    this.garbageMap.set(identifier, performance.now());
    this.garbageCollection(10 * 60 * 1000);
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
      this.updateInterval = setZeroTimeout(this.updateCallback);
    }
  }

  private updateQueue() {
    this.queue = {};
    this.updateInterval = null;
  }

  isDeleted(identifier: string) {
    let timeStamp = this.garbageMap.get(identifier);
    return timeStamp != null;
  }

  getCatalog(): CatalogItem[] {
    let catalog: CatalogItem[] = [];
    for (let identifier in this.identifierHash) {
      catalog.push({ identifier: identifier, version: this.identifierHash[identifier].version });
    }
    return catalog;
  }

  clearDeleteHistory() {
    this.garbageMap.clear();
  }

  private garbageCollection(garbage: ObjectContext)
  private garbageCollection(ms: number)
  private garbageCollection(arg: any) {
    if (typeof arg === 'number') {
      if (this.garbageCollectionInterval === null) {
        this.garbageCollectionInterval = setTimeout(() => { this.garbageCollectionInterval = null }, 1000);
        this._garbageCollection(arg);
      }
    } else {
      this.garbageMap.delete(arg.identifier);
    }
  }

  private _garbageCollection(ms: number) {
    let nowDate = performance.now();

    let checkLength = this.garbageMap.size - 100000;
    if (checkLength < 1) return;

    let entries = this.garbageMap.entries();
    while (checkLength < 1) {
      checkLength--;
      let item = entries.next();
      if (item.done) break;

      let identifier = item.value[0];
      let timeStamp = item.value[1];

      if (timeStamp + ms < nowDate) continue;
      this.garbageMap.delete(identifier);
    }
  }
}
