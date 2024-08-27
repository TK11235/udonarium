import { Event, EventSystem, Network } from '../system';
import { GameObject } from './game-object';
import { ObjectNode } from './object-node';

const objectBatches = new Map<string, { object: GameObject, originFrom: string }>();
const nodeBatches = new Set<string>();

let isBatching = false;

export function markForChanged(object: GameObject, sendFrom: string = Network.peerId) {
  objectBatches.set(object.identifier, { object: object, originFrom: sendFrom });
  if (object instanceof ObjectNode) markForChildrenChanged(object.parent);

  startBatching();
}

export function markForChildrenChanged(node: ObjectNode) {
  let current = node;
  while (current) {
    if (nodeBatches.has(current.identifier)) break;
    nodeBatches.add(current.identifier);
    current = current.parent;
  }

  startBatching();
}

function startBatching() {
  if (!isBatching) {
    queueMicrotask(triggerEvent);
    isBatching = true;
  }
}

const triggerEvent = () => {
  isBatching = false;
  let objects = Array.from(objectBatches.values());
  let nodes = Array.from(nodeBatches.values());
  objectBatches.clear();
  nodeBatches.clear();

  for (let data of objects) {
    let context = {
      aliasName: data.object.aliasName,
      identifier: data.object.identifier,
    }
    EventSystem.trigger(new Event(`UPDATE_GAME_OBJECT/aliasName/${context.aliasName}`, context, data.originFrom));
    EventSystem.trigger(new Event(`UPDATE_GAME_OBJECT/identifier/${context.identifier}`, context, data.originFrom));
  }

  for (let identifier of nodes) {
    EventSystem.trigger(`UPDATE_OBJECT_CHILDREN/identifier/${identifier}`, { identifier: identifier });
  }
}
