import { GameObject } from './game-object';
import { ObjectFactory, Type } from './object-factory';
import { ObjectNode } from './object-node';

const syncVarsSymbol = Symbol('synchronize-variables');
const syncAttrsSymbol = Symbol('synchronize-attributes');

export function defineSyncObject(alias: string) {
  return <T extends Type<GameObject>>(constructor: T) => {
    const decoratedConstructor: T = class SyncObject extends constructor {
      constructor(...args: any[]) {
        super(...args);
        if (this.constructor === decoratedConstructor) applyDecorator(this);
      }
    }
    ObjectFactory.instance.register(decoratedConstructor, alias);
    return decoratedConstructor;
  }
}

export function defineSyncVariable() {
  return <T extends GameObject>(target: T, key: PropertyKey) => {
    storeDecorator(target, syncVarsSymbol, key);
  }
}

export function defineSyncAttribute() {
  return <T extends ObjectNode>(target: T, key: PropertyKey) => {
    storeDecorator(target, syncAttrsSymbol, key);
  }
}

function storeDecorator(target: GameObject, type: symbol, key: PropertyKey) {
  if (!target.hasOwnProperty(type)) {
    Object.defineProperty(target, type, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: new Set<PropertyKey>()
    });
  }
  target[type].add(key);
}

function applyDecorator(target: GameObject) {
  redefineProperties(
    target,
    syncVarsSymbol,
    key => function getter(this: any) {
      return this.context.syncData[key];
    },
    key => function setter(this: any, value: any) {
      this.context.syncData[key] = value;
      this.update();
    }
  );

  redefineProperties(
    target,
    syncAttrsSymbol,
    key => function getter(this: any) {
      return this.context.syncData.attributes[key];
    },
    key => function setter(this: any, value: any) {
      this.context.syncData.attributes[key] = value;
      this.update();
    }
  );
}

function redefineProperties(
  target: GameObject,
  keySymbol: symbol,
  getterFactory: (key: PropertyKey) => (this: any) => any,
  setterFactory: (key: PropertyKey) => (this: any, value: any) => void
) {
  const definedKeys = new Set<PropertyKey>();
  let source = target;
  while (source) {
    const keys = source[keySymbol] as Set<PropertyKey>;
    if (keys != null && source.hasOwnProperty(keySymbol)) {
      for (const key of keys) {
        if (definedKeys.has(key)) continue;
        definedKeys.add(key);

        const value = target[key];
        Object.defineProperty(target, key, {
          get: getterFactory(key),
          set: setterFactory(key),
          enumerable: true,
          configurable: true
        });
        target[key] = value;
      }
    }
    source = Object.getPrototypeOf(source);
  }
}
