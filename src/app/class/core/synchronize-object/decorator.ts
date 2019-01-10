import { defineSyncAttribute, defineSyncObject, defineSyncVariable } from './decorator-core';
import { GameObject } from './game-object';
import { ObjectNode } from './object-node';

export function SyncObject(alias: string) {
  return defineSyncObject(alias);
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
