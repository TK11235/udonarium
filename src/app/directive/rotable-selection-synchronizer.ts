import { TabletopObject } from '@udonarium/tabletop-object';
import { SelectionState, TabletopSelectionService } from 'service/tabletop-selection.service';

import { RotableDirective } from './rotable.directive';

export class RotableSelectionSynchronizer {
  private static readonly rotablesMap: Map<TabletopObject, Set<RotableDirective>> = new Map();

  private get selectedRotables(): Set<RotableDirective> {
    let selected: Set<RotableDirective> = new Set();
    for (let object of this.selection.objects) {
      RotableSelectionSynchronizer.rotablesMap.get(object)?.forEach(r => selected.add(r));
    }
    return selected;
  }

  private _isDestroyed: boolean = false;
  get isDestroyed(): boolean { return this._isDestroyed; }

  constructor(
    private rotable: RotableDirective,
    private selection: TabletopSelectionService,
  ) { }

  initialize() {
    this.register();
  }

  destroy() {
    this.unregister();
    this._isDestroyed = true;
    this.rotable = null;
  }

  prepareRotate() {
    if (1 < this.selection.size && this.rotable.state !== SelectionState.NONE) {
      for (let rotable of this.selectedRotables) {
        if (rotable === this.rotable) continue;
        if (!rotable.isDisable) rotable.setAnimatedTransition(false);
      }
    } else {
      this.selection.clear();
    }
  }

  updateRotate() {
    if (this.selection.size <= 1 || this.rotable.state === SelectionState.NONE) return;
    for (let rotable of this.selectedRotables) {
      if (rotable === this.rotable) continue;
      if (!rotable.isDisable
        && rotable.tabletopObject.aliasName === this.rotable.tabletopObject.aliasName
        && rotable.targetPropertyName === this.rotable.targetPropertyName) {
        rotable.rotate = this.rotable.rotate;
      }
    }
  }

  finishRotate() {
    if (this.selection.size <= 1 || this.rotable.state === SelectionState.NONE) return;
    for (let rotable of this.selectedRotables) {
      if (rotable === this.rotable) continue;
      if (!rotable.isDisable
        && rotable.tabletopObject.aliasName === this.rotable.tabletopObject.aliasName
        && rotable.targetPropertyName === this.rotable.targetPropertyName) {
        rotable.setAnimatedTransition(true);
        rotable.rotate = this.rotable.rotate;
      }
    }
  }

  register() {
    let rotableSet = RotableSelectionSynchronizer.rotablesMap.get(this.rotable.tabletopObject) ?? new Set();
    rotableSet.add(this.rotable);
    RotableSelectionSynchronizer.rotablesMap.set(this.rotable.tabletopObject, rotableSet);
  }

  unregister() {
    let objectSet = RotableSelectionSynchronizer.rotablesMap.get(this.rotable.tabletopObject);
    if (!objectSet) return;
    objectSet.delete(this.rotable);
    if (objectSet.size < 1) RotableSelectionSynchronizer.rotablesMap.delete(this.rotable.tabletopObject);
  }
}
