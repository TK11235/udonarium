import { Injectable, NgZone } from '@angular/core';

export interface PointerCoordinate {
  x: number;
  y: number;
  z: number;
}

export interface PointerData extends PointerCoordinate {
  identifier: number;
}

const MOUSE_IDENTIFIER = -9999;

@Injectable({
  providedIn: 'root'
})
export class PointerDeviceService {
  private callbackOnPointerDown = (e) => this.onPointerDown(e);
  private callbackOnPointerMove = (e) => this.onPointerMove(e);
  private callbackOnPointerUp = (e) => this.onPointerUp(e);
  private callbackOnContextMenu = (e) => this.onContextMenu(e);

  private _isAllowedToOpenContextMenu: boolean = false;
  get isAllowedToOpenContextMenu(): boolean { return this._isAllowedToOpenContextMenu; }

  targetElement: HTMLElement;

  pointers: PointerData[] = [{ x: 0, y: 0, z: 0, identifier: -1 }];
  private startPostion: PointerData = this.pointers[0];
  private primaryPointer: PointerData = this.pointers[0];
  get pointer(): PointerCoordinate { return this.primaryPointer; }
  get pointerX(): number { return this.primaryPointer.x; }
  get pointerY(): number { return this.primaryPointer.y; }

  isDragging: boolean = false; // todo

  constructor(private ngZone: NgZone) { }

  initialize() {
    this.addEventListeners();
  }

  destroy() {
    this.removeEventListeners();
  }

  private onPointerDown(e: any) {
    this.onPointerMove(e);
    this._isAllowedToOpenContextMenu = true;
    this.startPostion = this.pointers[0];
  }

  private onPointerMove(e: MouseEvent)
  private onPointerMove(e: TouchEvent)
  private onPointerMove(e: any) {
    if (e.touches) {
      this.onTouchMove(e);
    } else {
      this.onMouseMove(e);
    }
    this.targetElement = e.target;
  }

  private onPointerUp(e: any) {
    this.onPointerMove(e);
  }

  private onMouseMove(e: MouseEvent) {
    let mosuePointer: PointerData = { x: e.pageX, y: e.pageY, z: 0, identifier: MOUSE_IDENTIFIER };
    if (this.isSyntheticEvent(mosuePointer)) return;
    if (this._isAllowedToOpenContextMenu) this.preventContextMenuIfNeeded(mosuePointer);
    this.pointers = [mosuePointer];
    this.primaryPointer = mosuePointer;
  }

  private onTouchMove(e: TouchEvent) {
    let length = e.touches.length;
    if (length < 1) return;
    this.pointers = [];
    for (let i = 0; i < length; i++) {
      let touch = e.touches[i];
      let touchPointer: PointerData = { x: touch.pageX, y: touch.pageY, z: 0, identifier: touch.identifier };
      if (this._isAllowedToOpenContextMenu) this.preventContextMenuIfNeeded(touchPointer);
      this.pointers.push(touchPointer);
    }
    this.primaryPointer = this.pointers[0];
  }

  private onContextMenu(e: any) {
    this._isAllowedToOpenContextMenu = true;
    this.onPointerUp(e);
  }

  private preventContextMenuIfNeeded(pointer: PointerCoordinate, threshold: number = 3) {
    let distance = (pointer.x - this.startPostion.x) ** 2 + (pointer.y - this.startPostion.y) ** 2;
    if (threshold ** 2 < distance) this._isAllowedToOpenContextMenu = false;
  }

  private isSyntheticEvent(mosuePointer: PointerData, threshold: number = 15): boolean {
    for (let pointer of this.pointers) {
      if (pointer.identifier === mosuePointer.identifier) continue;
      let distance = (mosuePointer.x - pointer.x) ** 2 + (mosuePointer.y - pointer.y) ** 2;
      if (distance < threshold ** 2) return true;
    }
    return false;
  }

  private addEventListeners() {
    this.ngZone.runOutsideAngular(() => {
      document.body.addEventListener('mousedown', this.callbackOnPointerDown, true);
      document.body.addEventListener('mousemove', this.callbackOnPointerMove, true);
      document.body.addEventListener('mouseup', this.callbackOnPointerUp, true);
      document.body.addEventListener('touchstart', this.callbackOnPointerDown, true);
      document.body.addEventListener('touchmove', this.callbackOnPointerMove, true);
      document.body.addEventListener('touchend', this.callbackOnPointerUp, true);
      document.body.addEventListener('touchcancel', this.callbackOnPointerUp, true);
      document.body.addEventListener('drop', this.callbackOnPointerUp, true);
      document.body.addEventListener('contextmenu', this.callbackOnContextMenu, true);
    });
  }

  private removeEventListeners() {
    document.body.removeEventListener('mousedown', this.callbackOnPointerDown, true);
    document.body.removeEventListener('mousemove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('mouseup', this.callbackOnPointerUp, true);
    document.body.removeEventListener('touchstart', this.callbackOnPointerDown, true);
    document.body.removeEventListener('touchmove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('touchend', this.callbackOnPointerUp, true);
    document.body.removeEventListener('touchcancel', this.callbackOnPointerUp, true);
    document.body.removeEventListener('drop', this.callbackOnPointerUp, true);
    document.body.removeEventListener('contextmenu', this.callbackOnContextMenu, true);
  }
}
