import { Injectable, NgZone } from '@angular/core';

import { Transform } from '@udonarium/transform/transform';

export var PointerDeviceProxy: PointerDeviceService = null;

export interface PointerCoordinate {
  x: number,
  y: number,
  z?: number,
}

export interface PointerType extends String { }
export namespace PointerType {
  export const MOUSE: PointerType = 'mouse';
  export const PEN: PointerType = 'pen';
  export const TOUCH: PointerType = 'touch';
  export const UNKNOWN: PointerType = 'unknown';
}

@Injectable()
export class PointerDeviceService {
  private callbackOnPointerDown = (e) => this.onPointerDown(e);
  private callbackOnPointerMove = (e) => this.onPointerMove(e);
  private callbackOnPointerUp = (e) => this.onPointerUp(e);
  private callbackOnContextMenu = (e) => this.onContextMenu(e);

  private _isAllowedToOpenContextMenu: boolean = false;
  get isAllowedToOpenContextMenu(): boolean { return this._isAllowedToOpenContextMenu; }
  isDragging: boolean = false; // todo
  private _isPointerDown: boolean = false;
  get isPointerDown(): boolean { return this._isPointerDown; }
  pointers: PointerCoordinate[] = [{ x: 0, y: 0, z: 0 }];
  pointerType: PointerType = PointerType.UNKNOWN;

  targetElement: HTMLElement;
  private contextMenuStartPostion: PointerCoordinate = { x: 0, y: 0, z: 0 };

  get pointerX(): number {
    return this.pointers[0].x;
  }

  get pointerY(): number {
    return this.pointers[0].y;
  }

  constructor(
    public ngZone: NgZone
  ) {
    if (PointerDeviceProxy === null) {
      PointerDeviceProxy = this;
    }
  }

  initialize() {
    this.addEventListeners();
  }

  destroy() {
    this.removeEventListeners();
  }

  private onPointerDown(e: any) {
    this._isPointerDown = true;
    this._isAllowedToOpenContextMenu = true;
    if (e.touches) {
      this.onTouchDown(e);
    } else {
      this.onMouseDown(e);
    }
    this.contextMenuStartPostion = this.pointers[0];
    this.targetElement = e.target;
  }

  private onMouseDown(e: MouseEvent) {
    if (1 < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, 1);
    this.pointers[0] = { x: e.pageX, y: e.pageY, z: 0 };
    this.pointerType = PointerType.MOUSE;
  }

  private onTouchDown(e: TouchEvent) {
    let length = e.touches.length;
    for (let i = 0; i < length; i++) {
      this.pointers[i] = { x: e.touches[i].pageX, y: e.touches[i].pageY, z: 0 };
    }
    this.pointerType = PointerType.TOUCH;
    if (length < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, length);
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

  private onMouseMove(e: MouseEvent) {
    if (1 < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, 1);
    let pointer: PointerCoordinate = { x: e.pageX, y: e.pageY, z: 0 };
    if (this._isAllowedToOpenContextMenu) this.preventContextMenuIfNeeded(pointer);
    this.pointers[0] = pointer;
    this.pointerType = PointerType.MOUSE;
  }

  private onTouchMove(e: TouchEvent) {
    let length = e.touches.length;
    for (let i = 0; i < length; i++) {
      let pointer: PointerCoordinate = { x: e.touches[i].pageX, y: e.touches[i].pageY, z: 0 };
      if (this._isAllowedToOpenContextMenu) this.preventContextMenuIfNeeded(pointer);
      this.pointers[i] = pointer;
    }
    this.pointerType = PointerType.TOUCH;
    if (length < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, length);
  }

  private onPointerUp(e: any) {
    this.onPointerMove(e);
    this._isPointerDown = false;
  }

  private onContextMenu(e: any) {
    this.onPointerUp(e);
    if (e.touches) this._isAllowedToOpenContextMenu = true;
  }

  private preventContextMenuIfNeeded(pointer: PointerCoordinate, threshold: number = 3) {
    let distance = (pointer.x - this.contextMenuStartPostion.x) ** 2
      + (pointer.y - this.contextMenuStartPostion.y) ** 2
      + (pointer.z - this.contextMenuStartPostion.z) ** 2;
    if (threshold ** 2 < distance) this._isAllowedToOpenContextMenu = false;
  }

  protected addEventListeners() {
    this.ngZone.runOutsideAngular(() => {
      document.body.addEventListener('mousedown', this.callbackOnPointerDown, true);
      document.body.addEventListener('touchstart', this.callbackOnPointerDown, true);
      document.body.addEventListener('mousemove', this.callbackOnPointerMove, true);
      document.body.addEventListener('touchmove', this.callbackOnPointerMove, true);
      document.body.addEventListener('mouseup', this.callbackOnPointerUp, true);
      document.body.addEventListener('touchend', this.callbackOnPointerUp, true);
      document.body.addEventListener('touchcancel', this.callbackOnPointerUp, true);
      document.body.addEventListener('drop', this.callbackOnPointerUp, true);
      document.body.addEventListener('contextmenu', this.callbackOnContextMenu, true);
    });
  }

  protected removeEventListeners() {
    document.body.removeEventListener('mousedown', this.callbackOnPointerDown, true);
    document.body.removeEventListener('touchstart', this.callbackOnPointerDown, true);
    document.body.removeEventListener('mousemove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('touchmove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('mouseup', this.callbackOnPointerUp, true);
    document.body.removeEventListener('touchend', this.callbackOnPointerUp, true);
    document.body.removeEventListener('touchcancel', this.callbackOnPointerUp, true);
    document.body.removeEventListener('drop', this.callbackOnPointerUp, true);
    document.body.removeEventListener('contextmenu', this.callbackOnContextMenu, true);
  }

  public static convertToLocal(pointer: PointerCoordinate, element: HTMLElement = document.body): PointerCoordinate {
    let transformer: Transform = new Transform(element);
    let ray = transformer.globalToLocal(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    transformer.clear();
    return { x: ray.x, y: ray.y, z: ray.z };
  }

  public static convertToGlobal(pointer: PointerCoordinate, element: HTMLElement = document.body): PointerCoordinate {
    let transformer: Transform = new Transform(element);
    let ray = transformer.localToGlobal(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    transformer.clear();
    return { x: ray.x, y: ray.y, z: ray.z };
  }

  public static convertLocalToLocal(pointer: PointerCoordinate, from: HTMLElement, to: HTMLElement): PointerCoordinate {
    let transformer: Transform = new Transform(from);
    let local = transformer.globalToLocal(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    let ray = transformer.localToLocal(local.x, local.y, 0, to);
    transformer.clear();
    return { x: ray.x, y: ray.y, z: ray.z };
  }
}