import { defineSyncAttribute, defineSyncObject, defineSyncVariable } from './decorator-core';
import { GameObject } from './game-object';
import { Type } from './object-factory';
import { ObjectNode } from './object-node';

export function SyncObject(alias: string) {
  return <T extends GameObject>(constructor: Type<T>) => {
    defineSyncObject(alias)(constructor);
  }
}

export function SyncVar() {
  return <T extends GameObject>(target: T, key: string | symbol) => {
    if (target instanceof ObjectNode) {
      defineSyncAttribute()(target, key);
    } else {
      defineSyncVariable()(target, key);
    }
  }
}
