import { Injectable, ViewContainerRef, ComponentFactoryResolver, ReflectiveInjector, ComponentRef, } from "@angular/core";
import { Transform } from '../class/transform/transform';

export var PointerDeviceProxy: PointerDeviceService = null;

export interface PointerCoordinate {
  x: number,
  y: number
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
  private callbackOnPointerMove: any = null;

  pointers: PointerCoordinate[] = [{ x: 0, y: 0 }];
  pointerType: PointerType = PointerType.UNKNOWN;

  get pointerX(): number {
    return this.pointers[0].x;
  }

  get pointerY(): number {
    return this.pointers[0].y;
  }

  constructor() {
    if (PointerDeviceProxy === null) {
      PointerDeviceProxy = this;
    }
  }

  initialize() {
    this.callbackOnPointerMove = (e) => this.onPointerMove(e);
    document.body.addEventListener('mousedown', this.callbackOnPointerMove, true);
    document.body.addEventListener('touchdown', this.callbackOnPointerMove, true);
    document.body.addEventListener('mousemove', this.callbackOnPointerMove, true);
    document.body.addEventListener('touchmove', this.callbackOnPointerMove, true);
    document.body.addEventListener('mouseup', this.callbackOnPointerMove, true);
    document.body.addEventListener('touchup', this.callbackOnPointerMove, true);
  }

  destroy() {
    document.body.removeEventListener('mousedown', this.callbackOnPointerMove, true);
    document.body.removeEventListener('touchdown', this.callbackOnPointerMove, true);
    document.body.removeEventListener('mousemove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('touchmove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('mouseup', this.callbackOnPointerMove, true);
    document.body.removeEventListener('touchup', this.callbackOnPointerMove, true);
    this.callbackOnPointerMove = null;
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
    if (1 < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, 1);
    this.pointers[0] = {
      x: e.pageX,
      y: e.pageY
    };
    this.pointerType = PointerType.MOUSE;
  }

  private onTouchMove(e: TouchEvent) {
    let length = e.touches.length;
    for (let i; i < length; i++) {
      this.pointers[i] = {
        x: e.touches[i].pageX,
        y: e.touches[i].pageY
      };
    }
    this.pointerType = PointerType.TOUCH;
    if (length < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, length);
    if (length < this.pointers.length) Array.prototype.slice.call(this.pointers, 0, length);
  }

  public static convertToLocal(pointer: PointerCoordinate, element: HTMLElement = document.body): PointerCoordinate {
    let transformer: Transform = new Transform(element);
    let localRayFrom = transformer.globalToLocal(pointer.x, pointer.y);
    transformer.clear();
    return { x: localRayFrom.x, y: localRayFrom.y }
  }
}