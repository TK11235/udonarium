import { GameObject } from './game-object';
import { ObjectFactory, Type } from './object-factory';
import { ObjectNode } from './object-node';

export function SyncObject(alias: string) {
  return <T extends GameObject>(constructor: Type<T>) => {
    ObjectFactory.instance.register(constructor, alias);
  }
}

export function SyncVar() {
  return <T extends GameObject>(target: T, key: string | symbol) => {
    if (target instanceof ObjectNode) {
      defineSyncAttribute(target, key);
    } else {
      defineSyncVariable(target, key);
    }
  }
}

function defineSyncVariable(target: GameObject, key: string | symbol) {
  function getter() {
    return this.context.syncData[key];
  }

  function setter(value: any) {
    this.context.syncData[key] = value;
    this.update();
  }

  Object.defineProperty(target, key, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true
  });
}

function defineSyncAttribute(target: ObjectNode, key: string | symbol) {
  function getter() {
    return this.getAttribute(key);
  }

  function setter(value: any) {
    this.setAttribute(key, value);
  }

  Object.defineProperty(target, key, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true
  });
}