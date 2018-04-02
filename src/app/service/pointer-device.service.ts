import { Injectable, ViewContainerRef, ComponentFactoryResolver, ReflectiveInjector, ComponentRef, NgZone, } from "@angular/core";
import { Transform } from '../class/transform/transform';

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

  _isAllowedToOpenContextMenu: boolean = false;
  get isAllowedToOpenContextMenu(): boolean { return this._isAllowedToOpenContextMenu; }
  isDragging: boolean = false; // todo
  _isPointerDown: boolean = false;
  get isPointerDown(): boolean { return this._isPointerDown; }
  pointers: PointerCoordinate[] = [{ x: 0, y: 0, z: 0 }];
  pointerType: PointerType = PointerType.UNKNOWN;

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
    //this._isDragging = false;
    this._isAllowedToOpenContextMenu = true;
    if (e.touches) {
      this.onTouchDown(e);
    } else {
      this.onMouseDown(e);
    }
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
  }

  private onMouseMove(e: MouseEvent) {
    if (1 < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, 1);
    let pointer: PointerCoordinate = { x: e.pageX, y: e.pageY, z: 0 };
    if (pointer.x !== this.pointers[0].x || pointer.y !== this.pointers[0].y || pointer.z !== this.pointers[0].z) {
      //this._isDragging = this._isPointerDown;
      this._isAllowedToOpenContextMenu = false;
    }
    this.pointers[0] = pointer;
    this.pointerType = PointerType.MOUSE;
  }

  private onTouchMove(e: TouchEvent) {
    let length = e.touches.length;
    for (let i = 0; i < length; i++) {
      let pointer: PointerCoordinate = { x: e.touches[i].pageX, y: e.touches[i].pageY, z: 0 };
      if (this.pointers[i] !== null && (pointer.x !== this.pointers[i].x || pointer.y !== this.pointers[i].y || pointer.z !== this.pointers[i].z)) {
        //this._isDragging = this._isPointerDown;
        this._isAllowedToOpenContextMenu = false;
      }
      this.pointers[i] = pointer;
    }
    this.pointerType = PointerType.TOUCH;
    if (length < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, length);
  }

  private onPointerUp(e: any) {
    if (e.touches) {
      this.onTouchMove(e);
    } else {
      this.onMouseMove(e);
    }
    this._isPointerDown = false;
    //this._isDragging = false;
  }

  private onContextMenu(e: any) {
    this.onPointerUp(e);
  }

  protected addEventListeners() {
    this.ngZone.runOutsideAngular(() => {
      document.body.addEventListener('mousedown', this.callbackOnPointerDown, true);
      document.body.addEventListener('touchdown', this.callbackOnPointerDown, true);
      document.body.addEventListener('mousemove', this.callbackOnPointerMove, true);
      document.body.addEventListener('touchmove', this.callbackOnPointerMove, true);
      document.body.addEventListener('mouseup', this.callbackOnPointerUp, true);
      document.body.addEventListener('touchup', this.callbackOnPointerUp, true);
      document.body.addEventListener('contextmenu', this.callbackOnContextMenu, true);
    });
  }

  protected removeEventListeners() {
    document.body.removeEventListener('mousedown', this.callbackOnPointerDown, true);
    document.body.removeEventListener('touchdown', this.callbackOnPointerDown, true);
    document.body.removeEventListener('mousemove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('touchmove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('mouseup', this.callbackOnPointerUp, true);
    document.body.removeEventListener('touchup', this.callbackOnPointerUp, true);
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