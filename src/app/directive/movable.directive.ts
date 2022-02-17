import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output } from '@angular/core';
import { EventSystem } from '@udonarium/core/system';
import { TableSelecter } from '@udonarium/table-selecter';
import { TabletopObject } from '@udonarium/tabletop-object';
import { BatchService } from 'service/batch.service';
import { CoordinateService } from 'service/coordinate.service';
import { PointerCoordinate, PointerDeviceService } from 'service/pointer-device.service';

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

  private get nativeElement(): HTMLElement { return this.elementRef.nativeElement; }

  private _posX: number = 0;
  private _posY: number = 0;
  private _posZ: number = 0;

  get posX(): number { return this._posX; }
  set posX(posX: number) { this._posX = posX; this.setUpdateTimer(); }
  get posY(): number { return this._posY; }
  set posY(posY: number) { this._posY = posY; this.setUpdateTimer(); }
  get posZ(): number { return this._posZ; }
  set posZ(posZ: number) { this._posZ = posZ; this.setUpdateTimer(); }

  private pointerOffset2d: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerStart3d: PointerCoordinate = { x: 0, y: 0, z: 0 };

  private targetStartRect: DOMRect;

  private height: number = 0;
  private width: number = 0;
  private ratio: number = 1.0;

  private updateTimer: NodeJS.Timer = null;
  private collidableElements: HTMLElement[] = [];
  private input: InputHandler = null;

  private get isGridSnap(): boolean { return TableSelecter.instance.gridSnap; }

  constructor(
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private batchService: BatchService,
    private pointerDeviceService: PointerDeviceService,
    private coordinateService: CoordinateService,
  ) { }

  ngAfterViewInit() {
    this.batchService.add(() => this.initialize(), this.elementRef);
    this.setPosition(this.tabletopObject);
  }

  ngOnDestroy() {
    this.cancel();
    this.input.destroy();
    this.unregister();
    EventSystem.unregister(this);
    this.batchService.remove(this);
    this.batchService.remove(this.elementRef);
  }

  initialize() {
    this.input = new InputHandler(this.nativeElement);
    this.input.onStart = this.onInputStart.bind(this);
    this.input.onMove = this.onInputMove.bind(this);
    this.input.onEnd = this.onInputEnd.bind(this);
    this.input.onContextMenu = this.onContextMenu.bind(this);

    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if ((event.isSendFromSelf && this.input.isGrabbing) || event.data.identifier !== this.tabletopObject.identifier || !this.shouldTransition(this.tabletopObject)) return;
        this.batchService.add(() => {
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

    this.width = this.nativeElement.clientWidth;
    this.height = this.nativeElement.clientHeight;

    let target3d = {
      x: this.posX + (this.width / 2),
      y: this.posY + (this.height / 2),
      z: this.posZ,
    };
    let target2d = this.coordinateService.convertToGlobal(target3d, this.coordinateService.tabletopOriginElement);

    this.setPointerEvents(true);

    this.pointerOffset2d.x = target2d.x - this.input.pointer.x;
    this.pointerOffset2d.y = target2d.y - this.input.pointer.y;
    this.pointerOffset2d.z = target2d.z - this.input.pointer.z;

    this.pointerStart3d.x = target3d.x;
    this.pointerStart3d.y = target3d.y;
    this.pointerStart3d.z = target3d.z;

    this.targetStartRect = this.nativeElement.getBoundingClientRect();

    this.ratio = 1.0;
  }

  onInputMove(e: MouseEvent | TouchEvent) {
    if (this.input.isGrabbing && !this.pointerDeviceService.isDragging) {
      return this.cancel(); // todo
    }
    if (this.isDisable || !this.input.isGrabbing) return this.cancel();
    if (e.cancelable) e.preventDefault();

    if (!this.input.isDragging) this.setPointerEvents(false);

    let pointer2d = {
      x: this.input.pointer.x + (this.pointerOffset2d.x * this.ratio),
      y: this.input.pointer.y + (this.pointerOffset2d.y * this.ratio),
      z: 0,
    };

    pointer2d.x = Math.min(window.innerWidth - 0.1, Math.max(pointer2d.x, 0.1));
    pointer2d.y = Math.min(window.innerHeight - 0.1, Math.max(pointer2d.y, 0.1));

    let element = document.elementFromPoint(pointer2d.x, pointer2d.y) as HTMLElement;
    if (element == null) return;

    let pointer3d = this.coordinateService.calcTabletopLocalCoordinate(pointer2d, element);
    pointer3d.x -= this.width / 2;
    pointer3d.y -= this.height / 2;

    if (this.posX === pointer3d.x && this.posY === pointer3d.y && this.posZ === pointer3d.z) return;

    if (!this.input.isDragging) this.ondragstart.emit(e as PointerEvent);
    this.ondrag.emit(e as PointerEvent);

    let targetRect = this.nativeElement.getBoundingClientRect();
    let ratio = targetRect.width / this.targetStartRect.width;
    if (ratio < this.ratio) {
      this.ratio += (ratio - this.ratio) * 0.1;
    }

    this.posX = pointer3d.x;
    this.posY = pointer3d.y;
    this.posZ = pointer3d.z;
  }

  onInputEnd(e: MouseEvent | TouchEvent) {
    if (this.isDisable) return this.cancel();
    if (this.input.isDragging) this.ondragend.emit(e as PointerEvent);
    if (this.isGridSnap && this.input.isDragging) this.snapToGrid();
    this.cancel();
    this.onend.emit(e as PointerEvent);
  }

  onContextMenu(e: MouseEvent | TouchEvent) {
    if (this.isDisable) return this.cancel();
    if (e.cancelable) e.preventDefault();

    if (this.isGridSnap && this.input.isDragging) this.snapToGrid();

    let needsDispatch = this.input.isGrabbing && e.isTrusted;
    this.cancel();

    if (needsDispatch) {
      // ロングプレスによるタッチ操作でコンテキストメニューを開く場合、イベントを適切なDOMに伝搬させる
      e.stopPropagation();
      let ev = new MouseEvent(e.type, e);
      this.ngZone.run(() => this.nativeElement.dispatchEvent(ev));
    }
  }

  private callSelectedEvent() {
    if (this.tabletopObject)
      EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.tabletopObject.identifier, className: this.tabletopObject.aliasName });
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
    if (getComputedStyle(this.nativeElement).pointerEvents !== 'none') {
      this.collidableElements = [this.nativeElement];
      return;
    }
    this.findNestedCollidableElements(this.nativeElement);
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
    this.nativeElement.style.transition = isEnable ? 'transform 132ms linear' : '';
  }

  private shouldTransition(object: TabletopObject): boolean {
    return object.location.x !== this.posX || object.location.y !== this.posY || object.posZ !== this.posZ;
  }

  private stopTransition() {
    this.nativeElement.style.transform = window.getComputedStyle(this.nativeElement).transform;
  }

  private updateTransformCss() {
    let css = this.transformCssOffset + ' translateX(' + this.posX + 'px) translateY(' + this.posY + 'px) translateZ(' + this.posZ + 'px)';
    this.nativeElement.style.transform = css;
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
