import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output } from '@angular/core';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system';
import { TableSelecter } from '@udonarium/table-selecter';
import { TabletopObject } from '@udonarium/tabletop-object';
import { PointerCoordinate, PointerDeviceService } from 'service/pointer-device.service';
import { TabletopService } from 'service/tabletop.service';

import { InputHandler } from './input-handler';

export interface MovableOption {
  readonly tabletopObject?: TabletopObject;
  readonly layerName?: string;
  readonly colideLayers?: string[];
  readonly transformCssOffset?: string;
}

@Directive({
  selector: '[appMovable]'
})
export class MovableDirective implements AfterViewInit, OnDestroy {
  private static layerHash: { [layerName: string]: MovableDirective[] } = {};

  private tabletopObject: TabletopObject;
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

  private pointer3d: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerOffset3d: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerStart3d: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerPrev3d: PointerCoordinate = { x: 0, y: 0, z: 0 };

  private height: number = 0;
  private width: number = 0;
  private ratio: number = 1.0;

  private updateTimer: NodeJS.Timer = null;
  private collidableElements: HTMLElement[] = [];
  private input: InputHandler = null;

  constructor(
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private tabletopService: TabletopService,
  ) { }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.input = new InputHandler(this.elementRef.nativeElement);
    });
    this.input.onStart = this.onInputStart.bind(this);
    this.input.onMove = this.onInputMove.bind(this);
    this.input.onEnd = this.onInputEnd.bind(this);
    this.input.onContextMenu = this.onContextMenu.bind(this);

    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if ((event.isSendFromSelf && this.input.isGrabbing) || event.data.identifier !== this.tabletopObject.identifier || !this.shouldTransition(this.tabletopObject)) return;
        this.tabletopService.addBatch(() => {
          if (this.input.isGrabbing) {
            this.cancel();
          } else {
            this.setAnimatedTransition(true);
          }
          this.stopTransition();
          this.setPosition(this.tabletopObject);
        }, this);
      });
    if (this.layerName.length < 1 && this.tabletopObject) this.layerName = this.tabletopObject.aliasName;
    this.register();
    this.findCollidableElements();
    this.setPosition(this.tabletopObject);
  }

  ngOnDestroy() {
    this.cancel();
    this.input.destroy();
    this.unregister();
    EventSystem.unregister(this);
    this.tabletopService.removeBatch(this);
  }

  cancel() {
    this.input.cancel();
    this.setPointerEvents(true);
    this.setAnimatedTransition(true);
    this.setCollidableLayer(false);
  }

  onInputStart(e: MouseEvent | TouchEvent) {
    this.callSelectedEvent();
    if (this.collidableElements.length < 1) this.findCollidableElements(); // 稀にcollidableElementsの取得に失敗している

    if (this.isDisable || (e as MouseEvent).button === 1 || (e as MouseEvent).button === 2) return this.cancel();
    this.onstart.emit(e as PointerEvent);

    this.setPointerEvents(false);
    this.setAnimatedTransition(false);
    this.setCollidableLayer(true);

    let target = document.elementFromPoint(this.input.pointer.x, this.input.pointer.y) as HTMLElement;
    this.pointer3d = this.calcLocalCoordinate(target, this.input.pointer);
    this.setPointerEvents(true);

    this.pointerOffset3d.x = this.posX - this.pointer3d.x;
    this.pointerOffset3d.y = this.posY - this.pointer3d.y;
    this.pointerOffset3d.z = this.posZ - this.pointer3d.z;

    this.pointerStart3d.x = this.pointerPrev3d.x = this.pointer3d.x;
    this.pointerStart3d.y = this.pointerPrev3d.y = this.pointer3d.y;
    this.pointerStart3d.z = this.pointerPrev3d.z = this.pointer3d.z;

    this.ratio = 1.0;
    if (this.pointer3d.z !== this.posZ) {
      this.ratio /= Math.abs(this.pointer3d.z - this.posZ) / 2;
    }

    this.width = this.input.target.clientWidth;
    this.height = this.input.target.clientHeight;
  }

  onInputMove(e: MouseEvent | TouchEvent) {
    if (this.input.isGrabbing && !this.tabletopService.pointerDeviceService.isDragging) {
      return this.cancel(); // todo
    }
    if (this.isDisable || !this.input.isGrabbing) return this.cancel();
    if (e.cancelable) e.preventDefault();

    if (!this.input.isDragging) this.setPointerEvents(false);
    let target = document.elementFromPoint(this.input.pointer.x, this.input.pointer.y) as HTMLElement;
    if (target == null) return;

    this.pointer3d = this.calcLocalCoordinate(target, this.input.pointer);
    if (this.pointerPrev3d.x === this.pointer3d.x && this.pointerPrev3d.y === this.pointer3d.y && this.pointerPrev3d.z === this.pointer3d.z) return;

    if (!this.input.isDragging) this.ondragstart.emit(e as PointerEvent);
    this.ondrag.emit(e as PointerEvent);

    let ratio = this.calcDistanceRatio(this.pointerStart3d, this.pointer3d);
    if (ratio < this.ratio) this.ratio = ratio;

    this.pointerPrev3d.x = this.pointer3d.x;
    this.pointerPrev3d.y = this.pointer3d.y;
    this.pointerPrev3d.z = this.pointer3d.z;

    this.posX = this.pointer3d.x + (this.pointerOffset3d.x * this.ratio) + (-(this.width / 2) * (1.0 - this.ratio));
    this.posY = this.pointer3d.y + (this.pointerOffset3d.y * this.ratio) + (-(this.height / 2) * (1.0 - this.ratio));
    this.posZ = this.pointer3d.z;
  }

  onInputEnd(e: MouseEvent | TouchEvent) {
    if (this.isDisable) return this.cancel();
    if (this.input.isDragging) this.ondragend.emit(e as PointerEvent);
    this.cancel();
    let tableSelecter = ObjectStore.instance.get<TableSelecter>('tableSelecter');
    if (tableSelecter.gridSnap) this.snapToGrid();
    this.onend.emit(e as PointerEvent);
  }

  onContextMenu(e: MouseEvent | TouchEvent) {
    if (this.isDisable) return this.cancel();
    if (e.cancelable) e.preventDefault();

    let tableSelecter = ObjectStore.instance.get<TableSelecter>('tableSelecter');
    if (tableSelecter.gridSnap) this.snapToGrid();

    let needsDispatch = this.input.isGrabbing && e.isTrusted;
    this.cancel();

    if (needsDispatch) {
      // ロングプレスによるタッチ操作でコンテキストメニューを開く場合、イベントを適切なDOMに伝搬させる
      e.stopPropagation();
      let ev = new MouseEvent(e.type, e);
      this.ngZone.run(() => this.input.target.dispatchEvent(ev));
    }
  }

  private callSelectedEvent() {
    if (this.tabletopObject)
      EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.tabletopObject.identifier, className: this.tabletopObject.aliasName });
  }

  private calcLocalCoordinate(target: HTMLElement, coordinate: PointerCoordinate): PointerCoordinate {
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
    if (getComputedStyle(this.input.target).pointerEvents !== 'none') {
      this.collidableElements = [this.input.target];
      return;
    }
    this.findNestedCollidableElements(this.input.target);
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
    if (!this.input) return;
    this.input.target.style.transition = isEnable ? 'transform 132ms linear' : '';
  }

  private shouldTransition(object: TabletopObject): boolean {
    return object.location.x !== this.posX || object.location.y !== this.posY || object.posZ !== this.posZ;
  }

  private stopTransition() {
    this.input.target.style.transform = window.getComputedStyle(this.input.target).transform;
  }

  private updateTransformCss() {
    if (!this.input) return;
    let css = this.transformCssOffset + ' translateX(' + this.posX + 'px) translateY(' + this.posY + 'px) translateZ(' + this.posZ + 'px)';
    this.input.target.style.transform = css;
  }

  private setCollidableLayer(isCollidable: boolean) {
    // todo
    let isEnable = isCollidable;
    for (let layerName in MovableDirective.layerHash) {
      if (-1 < this.colideLayers.indexOf(layerName)) {
        isEnable = this.input.isGrabbing ? isCollidable : true;
      } else {
        isEnable = !isCollidable;
      }
      MovableDirective.layerHash[layerName].forEach(movable => {
        if (movable === this || movable.input.isGrabbing) return;
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
