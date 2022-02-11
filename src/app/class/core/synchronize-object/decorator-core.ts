import { GameObject } from './game-object';
import { ObjectFactory, Type } from './object-factory';
import { ObjectNode } from './object-node';

export function defineSyncObject(alias: string) {
  return <T extends GameObject>(constructor: Type<T>) => {
    ObjectFactory.instance.register(constructor, alias);
  }
}

export function defineSyncVariable() {
  return <T extends GameObject>(target: T, key: string | symbol) => {
    function getter(this: any) {
      return this.context.syncData[key];
    }

    function setter(this: any, value: any) {
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
}

export function defineSyncAttribute() {
  return <T extends ObjectNode>(target: T, key: string | symbol) => {
    function getter(this: any) {
      return this.getAttribute(key);
    }

    function setter(this: any, value: any) {
      this.setAttribute(key, value);
    }

    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  }
}
