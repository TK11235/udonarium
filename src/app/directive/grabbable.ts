import { EventSystem } from '@udonarium/core/system/system';
import { TabletopObject } from '@udonarium/tabletop-object';

import { TabletopService } from 'service/tabletop.service';

export abstract class Grabbable {
  protected _isDragging: boolean = false;
  protected _isGrabbing: boolean = false;
  get isDragging(): boolean { return this._isDragging; }
  get isGrabbing(): boolean { return this._isGrabbing; }

  protected callbackOnMouseDown = (e) => this.onMouseDown(e);
  protected callbackOnMouseMove = (e) => this.onMouseMove(e);
  protected callbackOnMouseUp = (e) => this.onMouseUp(e);
  protected callbackOnContextMenu = (e) => this.onContextMenu(e);

  protected tabletopObject: TabletopObject;
  protected tabletopService: TabletopService;

  abstract cancel()

  protected onMouseDown(e: PointerEvent) { };
  protected onMouseMove(e: PointerEvent) { };
  protected onMouseUp(e: PointerEvent) { };
  protected onContextMenu(e: PointerEvent) { };

  protected addEventListeners() {
    this.tabletopService.ngZone.runOutsideAngular(() => {
      document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);
      document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
      document.body.addEventListener('contextmenu', this.callbackOnContextMenu, true);
    });
  }

  protected removeEventListeners() {
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);
    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('contextmenu', this.callbackOnContextMenu, true);
  }

  protected callSelectedEvent() {
    if (this.tabletopObject)
      EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.tabletopObject.identifier, className: this.tabletopObject.aliasName });
  }
}
