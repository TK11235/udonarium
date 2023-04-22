import { Injectable } from '@angular/core';
import { EventSystem } from '@udonarium/core/system';
import { TabletopObject } from '@udonarium/tabletop-object';
import { MovableSelectionSynchronizer } from 'directive/movable-selection-synchronizer';

import { PointerCoordinate } from './pointer-device.service';

export enum SelectionState {
  NONE,
  SELECTED,
  MAGNETIC,
}

@Injectable({
  providedIn: 'root'
})
export class TabletopSelectionService {
  private readonly selectionMap: Map<TabletopObject, SelectionState> = new Map();
  private readonly previus: Set<TabletopObject> = new Set();

  get size(): number { return this.selectionMap.size; }
  get objects(): TabletopObject[] { return Array.from(this.selectionMap.keys()); }
  excludeElement: Element = null;

  private isUdpateCssBatching = false;

  constructor() { }

  state(object: TabletopObject): SelectionState {
    return this.selectionMap.get(object) ?? SelectionState.NONE;
  }

  add(object: TabletopObject, state: SelectionState = SelectionState.SELECTED) {
    if (state === SelectionState.NONE) return this.remove(object);
    let prevs = this.objects;
    this.selectionMap.set(object, state);
    this.updateHighlight(prevs);
  }

  remove(object: TabletopObject) {
    if (!this.selectionMap.has(object)) return;
    let prevs = this.objects;
    this.selectionMap.delete(object);
    this.updateHighlight(prevs);
  }

  clear() {
    let prevs = this.objects;
    this.selectionMap.clear();
    this.updateHighlight(prevs);
  }

  congregate(center: PointerCoordinate) {
    MovableSelectionSynchronizer.congregate(center, this.objects);
  }

  private updateHighlight(prevs: TabletopObject[] = []) {
    prevs.forEach(prev => this.previus.add(prev));
    if (this.isUdpateCssBatching) return;
    queueMicrotask(() => {
      this.isUdpateCssBatching = false;
      this.selectionMap.forEach((state, object) => this.previus.add(object));
      let targets = Array.from(this.previus);
      this.previus.clear();
      if (0 < targets.length) EventSystem.trigger('UPDATE_SELECTION', { changed: targets });
      for (let target of targets) {
        EventSystem.trigger(`UPDATE_SELECTION/identifier/${target.identifier}`, { changed: targets });
      }
    });
    this.isUdpateCssBatching = true;
  }
}
