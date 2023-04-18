import { ObjectStore } from './core/synchronize-object/object-store';
import { TabletopObject } from './tabletop-object';

type AliasName = string;

export interface Stackable extends TabletopObject {
  zindex: number;
}

export function moveToTopmost(topmost: Stackable, otherRelatives: AliasName[] = []) {
  let objects: Stackable[] = findStackables(topmost.aliasName, otherRelatives);

  let maxZindex: number = -1;
  let hasConflict: boolean = false;
  for (let i = 0; i < objects.length; i++) {
    if (maxZindex === objects[i].zindex) {
      hasConflict = true;
    } else if (maxZindex < objects[i].zindex) {
      maxZindex = objects[i].zindex;
      hasConflict = false;
    }
  }

  if (maxZindex === topmost.zindex && !hasConflict) return;
  topmost.zindex = maxZindex + 1;

  if (topmost.zindex < objects.length + 256) return;
  objects.sort((a, b) => a.zindex - b.zindex);

  for (let i = 0; i < objects.length; i++) {
    objects[i].zindex = i;
  }
}

export function moveToBackmost(backmost: Stackable, otherRelatives: AliasName[] = []) {
  let objects: Stackable[] = findStackables(backmost.aliasName, otherRelatives);

  let minZindex: number = Number.MAX_SAFE_INTEGER;
  let hasConflict: boolean = false;
  for (let i = 0; i < objects.length; i++) {
    if (minZindex === objects[i].zindex) {
      hasConflict = true;
    } else if (objects[i].zindex < minZindex) {
      minZindex = objects[i].zindex;
      hasConflict = false;
    }
  }

  if (minZindex === backmost.zindex && !hasConflict) return;
  backmost.zindex = minZindex - 1;

  if (0 <= backmost.zindex) return;
  objects.sort((a, b) => a.zindex - b.zindex);

  for (let i = 0; i < objects.length; i++) {
    objects[i].zindex = i;
  }
}

function findStackables(relative: AliasName, otherRelatives: AliasName[]) {
  let objects: Stackable[] = ObjectStore.instance.getObjects(relative);
  otherRelatives.forEach(aliasName => objects = objects.concat(ObjectStore.instance.getObjects(aliasName)));
  objects = objects.filter(obj => obj.isVisibleOnTable);
  return objects;
}
