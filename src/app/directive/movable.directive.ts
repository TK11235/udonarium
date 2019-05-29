import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { EventSystem } from '@udonarium/core/system';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { TabletopObject } from '@udonarium/tabletop-object';
import { TableSelecter } from '@udonarium/table-selecter';

import { PointerCoordinate, PointerDeviceService } from 'service/pointer-device.service';
import { TabletopService } from 'service/tabletop.service';

import { Grabbable } from './grabbable';

export interface MovableOption {
  readonly tabletopObject?: TabletopObject;
  readonly layerName?: string;
  readonly colideLayers?: string[];
  readonly transformCssOffset?: string;
}

@Directive({
  selector: '[appMovable]'
})
export class MovableDirective extends Grabbable implements OnInit, OnDestroy, AfterViewInit {
  private static layerHash: { [layerName: string]: MovableDirective[] } = {};

  private layerName: string = '';
  private colideLayers: string[] = [];
  private transformCssOffset: string = '';
  @Input('movable.option') set option(option: MovableOption) {
    this.tabletopObject = option.tabletopObject != null ? option.tabletopObject : this.tabletopObject;
    this.layerName = option.layerName != null ? option.layerName : this.layerName;
    this.colideLayers = option.colideLayers != null ? option.colideLayers : this.colideLayers;
    this.transformCssOffset = option.transformCssOffset != null ? option.transformCssOffset : this.transformCssOffset;
  }
  @Input('movable.disable') isDisable: boolean = false;
  @Output('movable.onstart') onstart: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('movable.ondragstart') ondragstart: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('movable.ondrag') ondrag: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('movable.ondragend') ondragend: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('movable.onend') onend: EventEmitter<PointerEvent> = new EventEmitter();

  private _posX: number = 0;
  private _posY: number = 0;
  private _posZ: number = 0;

  get posX(): number { return this._posX; }
  set posX(posX: number) { this._posX = posX; this.setUpdateTimer(); }
  get posY(): number { return this._posY; }
  set posY(posY: number) { this._posY = posY; this.setUpdateTimer(); }
  get posZ(): number { return this._posZ; }
  set posZ(posZ: number) { this._posZ = posZ; this.setUpdateTimer(); }

  private pointer: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerOffset: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerStart: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerPrev: PointerCoordinate = { x: 0, y: 0, z: 0 };

  private height: number = 0;
  private width: number = 0;
  private ratio: number = 1.0;

  private updateTimer: NodeJS.Timer = null;

  private collidableElements: HTMLElement[] = [];
  private transformElement: HTMLElement;

  constructor(
    private elementRef: ElementRef,
    protected tabletopService: TabletopService,
  ) {
    super();
  }

  ngOnInit() { }

  ngAfterViewInit() {
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if ((event.isSendFromSelf && this.isGrabbing) || event.data.identifier !== this.tabletopObject.identifier || !this.shouldTransition(this.tabletopObject)) return;
        this.tabletopService.addBatch(() => {
          if (this.isGrabbing) {
            this.cancel();
          } else {
            this.setAnimatedTransition(true);
          }
          this.stopTransition();
          this.setPosition(this.tabletopObject);
        }, this);
      });
    if (this.layerName.length < 1 && this.tabletopObject) this.layerName = this.tabletopObject.aliasName;
    this.transformElement = this.elementRef.nativeElement;
    this.register();
    this.findCollidableElements();
    this.setPosition(this.tabletopObject);
    this.tabletopService.ngZone.runOutsideAngular(() => {
      this.transformElement.addEventListener('mousedown', this.callbackOnMouseDown, false);
    });
  }

  ngOnDestroy() {
    this.cancel();
    this.unregister();
    EventSystem.unregister(this);
  }

  cancel() {
    this._isDragging = this._isGrabbing = false;
    this.removeEventListeners();
    this.setPointerEvents(true);
    this.setAnimatedTransition(true);
    this.setCollidableLayer(false);
  }

  protected onMouseDown(e: PointerEvent) {
    this.callSelectedEvent();
    if (this.collidableElements.length < 1) this.findCollidableElements(); // 稀にcollidableElementsの取得に失敗している

    if (this.isDisable || e.button === 1 || e.button === 2) return this.cancel();
    e.preventDefault();
    this.onstart.emit(e);

    this._isGrabbing = true;
    this._isDragging = false;
    this.addEventListeners();
    this.setPointerEvents(false);
    this.setAnimatedTransition(false);
    this.setCollidableLayer(true);

    let target = <HTMLElement>document.elementFromPoint(this.tabletopService.pointerDeviceService.pointerX, this.tabletopService.pointerDeviceService.pointerY);
    this.pointer = this.calcLocalCoordinate(target);

    this.pointerOffset.x = this.posX - this.pointer.x;
    this.pointerOffset.y = this.posY - this.pointer.y;
    this.pointerOffset.z = this.posZ - this.pointer.z;

    this.pointerStart.x = this.pointerPrev.x = this.pointer.x;
    this.pointerStart.y = this.pointerPrev.y = this.pointer.y;
    this.pointerStart.z = this.pointerPrev.z = this.pointer.z;

    this.ratio = 1.0;
    if (this.pointer.z !== this.posZ) {
      this.ratio /= Math.abs(this.pointer.z - this.posZ) / 2;
    }

    this.width = this.transformElement.clientWidth;
    this.height = this.transformElement.clientHeight;
  }

  protected onMouseMove(e: PointerEvent) {
    if (this.isDisable) return this.cancel();
    e.preventDefault();
    if (!this._isGrabbing) return this.cancel();

    this.pointer = this.calcLocalCoordinate(<HTMLElement>e.target);
    if (this.pointerPrev.x === this.pointer.x && this.pointerPrev.y === this.pointer.y && this.pointerPrev.z === this.pointer.z) return;

    if (!this.isDragging) this.ondragstart.emit(e);
    this._isDragging = true;
    this.ondrag.emit(e);

    let ratio = this.calcDistanceRatio(this.pointerStart, this.pointer);
    if (ratio < this.ratio) this.ratio = ratio;

    this.pointerPrev.x = this.pointer.x;
    this.pointerPrev.y = this.pointer.y;
    this.pointerPrev.z = this.pointer.z;

    this.posX = this.pointer.x + (this.pointerOffset.x * this.ratio) + (-(this.width / 2) * (1.0 - this.ratio));
    this.posY = this.pointer.y + (this.pointerOffset.y * this.ratio) + (-(this.height / 2) * (1.0 - this.ratio));
    this.posZ = this.pointer.z;
  }

  protected onMouseUp(e: PointerEvent) {
    let tableSelecter = ObjectStore.instance.get<TableSelecter>('tableSelecter');

    if (this.isDisable) return this.cancel();
    e.preventDefault();
    if (this.isDragging) this.ondragend.emit(e);
    this.cancel();
    if (tableSelecter.gridSnap) this.snapToGrid();
    this.onend.emit(e);
  }

  protected onContextMenu(e: PointerEvent) {
    let tableSelecter = ObjectStore.instance.get<TableSelecter>('tableSelecter');

    if (this.isDisable) return this.cancel();
    e.preventDefault();
    this.cancel();
    if (tableSelecter.gridSnap) this.snapToGrid();
  }

  private calcLocalCoordinate(target: HTMLElement): PointerCoordinate {
    let coordinate: PointerCoordinate = this.tabletopService.pointerDeviceService.pointers[0];
    if (target.contains(this.tabletopService.dragAreaElement)) {
      coordinate = PointerDeviceService.convertToLocal(coordinate, this.tabletopService.dragAreaElement);
      coordinate.z = 0;
    } else {
      coordinate = PointerDeviceService.convertLocalToLocal(coordinate, target, this.tabletopService.dragAreaElement);
    }
    return { x: coordinate.x, y: coordinate.y, z: 0 < coordinate.z ? coordinate.z : 0 };
  }

  private calcDistanceRatio(start: PointerCoordinate, now: PointerCoordinate): number {
    let width = this.collidableElements[0].clientWidth;
    let height = this.collidableElements[0].clientHeight;
    let ratio: number = Math.sqrt(width * width + height * height);
    ratio = ratio < 1 ? 1 : ratio * 3;

    let distanceY = start.y - now.y;
    let distanceX = start.x - now.x;
    let distanceZ = (start.z - now.z) * 100;
    let distance = Math.sqrt(distanceY ** 2 + distanceX ** 2 + distanceZ ** 2);

    return ratio / (distance + ratio);
  }

  snapToGrid(gridSize: number = 25) {
    this.posX = this.calcSnapNum(this.posX, gridSize);
    this.posY = this.calcSnapNum(this.posY, gridSize);
  }

  private calcSnapNum(num: number, interval: number): number {
    if (interval <= 0) return num;
    num = num < 0 ? num - interval / 2 : num + interval / 2;
    return num - (num % interval);
  }

  private setPosition(object: TabletopObject) {
    this._posX = object.location.x;
    this._posY = object.location.y;
    this._posZ = object.posZ;
    this.updateTransformCss();
  }

  private setUpdateTimer() {
    if (this.updateTimer === null && this.tabletopObject) {
      this.updateTimer = setTimeout(() => {
        this.tabletopObject.location.x = this.posX;
        this.tabletopObject.location.y = this.posY;
        this.tabletopObject.posZ = this.posZ;
        this.updateTimer = null;
      }, 66);
    }
    this.updateTransformCss();
  }

  private findCollidableElements() {
    this.collidableElements = [];
    if (getComputedStyle(this.transformElement).pointerEvents !== 'none') {
      this.collidableElements = [this.transformElement];
      return;
    }
    this.findNestedCollidableElements(this.transformElement);
  }

  private findNestedCollidableElements(element: HTMLElement) {
    // TODO:不完全
    let children = element.children;
    for (let i = 0; i < children.length; i++) {
      let child = children[i]
      if (!(child instanceof HTMLElement)) continue;
      if (getComputedStyle(child).pointerEvents !== 'none') {
        this.collidableElements.push(child);
      }
    }
    if (this.collidableElements.length < 1) {
      for (let i = 0; i < children.length; i++) {
        let child = children[i]
        if (!(child instanceof HTMLElement)) continue;
        this.findNestedCollidableElements(child);
      }
    }
  }

  private setPointerEvents(isEnable: boolean) {
    let css = isEnable ? 'auto' : 'none';
    this.collidableElements.forEach(element => element.style.pointerEvents = css);
  }

  private setAnimatedTransition(isEnable: boolean) {
    if (!this.transformElement) return;
    this.transformElement.style.transition = isEnable ? 'transform 132ms linear' : '';
  }

  private shouldTransition(object: TabletopObject): boolean {
    return object.location.x !== this.posX || object.location.y !== this.posY || object.posZ !== this.posZ;
  }

  private stopTransition() {
    this.transformElement.style.transform = window.getComputedStyle(this.transformElement).transform;
  }

  private updateTransformCss() {
    if (!this.transformElement) return;
    let css = this.transformCssOffset + ' translateX(' + this.posX + 'px) translateY(' + this.posY + 'px) translateZ(' + this.posZ + 'px)';
    this.transformElement.style.transform = css;
  }

  private setCollidableLayer(isCollidable: boolean) {
    // todo
    let isEnable = isCollidable;
    for (let layerName in MovableDirective.layerHash) {
      if (-1 < this.colideLayers.indexOf(layerName)) {
        isEnable = this.isGrabbing ? isCollidable : true;
      } else {
        isEnable = !isCollidable;
      }
      MovableDirective.layerHash[layerName].forEach(movable => {
        if (movable === this || movable.isGrabbing) return;
        movable.setPointerEvents(isEnable);
      });
    }
  }

  private register() {
    if (!(this.layerName in MovableDirective.layerHash)) MovableDirective.layerHash[this.layerName] = [];
    let index = MovableDirective.layerHash[this.layerName].indexOf(this);
    if (index < 0) MovableDirective.layerHash[this.layerName].push(this);
  }

  private unregister() {
    if (!(this.layerName in MovableDirective.layerHash)) return;
    let index = MovableDirective.layerHash[this.layerName].indexOf(this);
    if (-1 < index) MovableDirective.layerHash[this.layerName].splice(index, 1);
  }
}
