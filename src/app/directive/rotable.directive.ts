import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output } from '@angular/core';
import { EventSystem } from '@udonarium/core/system';
import { TabletopObject } from '@udonarium/tabletop-object';
import { PointerCoordinate, PointerDeviceService } from 'service/pointer-device.service';
import { TabletopService } from 'service/tabletop.service';

import { InputHandler } from './input-handler';

export interface RotableTabletopObject extends TabletopObject {
  rotate: number;
}

export interface RotableOption {
  readonly tabletopObject?: RotableTabletopObject;
  readonly grabbingSelecter?: string;
  readonly transformCssOffset?: string;
}

@Directive({
  selector: '[appRotable]'
})
export class RotableDirective implements AfterViewInit, OnDestroy {
  protected tabletopObject: RotableTabletopObject;

  private transformCssOffset: string = '';
  private grabbingSelecter: string = '.rotate-grab';
  @Input('rotable.option') set option(option: RotableOption) {
    this.tabletopObject = option.tabletopObject != null ? option.tabletopObject : this.tabletopObject;
    this.grabbingSelecter = option.grabbingSelecter != null ? option.grabbingSelecter : this.grabbingSelecter;
    this.transformCssOffset = option.transformCssOffset != null ? option.transformCssOffset : this.transformCssOffset;
  }
  @Input('rotable.disable') isDisable: boolean = false;
  @Output('rotable.onstart') onstart: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.ondragstart') ondragstart: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.ondrag') ondrag: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.ondragend') ondragend: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.onend') onend: EventEmitter<PointerEvent> = new EventEmitter();

  private _rotate: number = 0;
  get rotate(): number { return this._rotate; }
  set rotate(rotate: number) { this._rotate = rotate; this.setUpdateTimer(); }
  @Input('rotable.value') set value(value: number) { this._rotate = value; this.updateTransformCss(); }
  @Output('rotable.valueChange') valueChange: EventEmitter<number> = new EventEmitter();

  private get isAllowedToRotate(): boolean {
    if (!this.grabbingElement || !this.input.target) return false;
    if (this.grabbingSelecter.length < 1) return true;
    let elements = this.input.target.querySelectorAll(this.grabbingSelecter);
    let macth = false;
    for (let i = 0; i < elements.length; i++) {
      macth = elements[i].contains(this.grabbingElement);
      if (macth) return true;
    }
    return false;
  }

  private rotateOffset: number = 0;
  private updateTimer: NodeJS.Timer = null;
  private grabbingElement: HTMLElement = null;
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

    if (this.tabletopObject) {
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
            this.setRotate(this.tabletopObject);
          }, this);
        });
      this.setRotate(this.tabletopObject);
    } else {
      this.updateTransformCss();
    }
  }

  ngOnDestroy() {
    this.cancel();
    this.input.destroy();
    EventSystem.unregister(this);
    this.tabletopService.removeBatch(this);
  }

  cancel() {
    this.input.cancel();
    this.grabbingElement = null;
    this.setAnimatedTransition(true);
  }

  onInputStart(e: MouseEvent | TouchEvent) {
    this.grabbingElement = e.target as HTMLElement;
    if (this.isDisable || !this.isAllowedToRotate || (e as MouseEvent).button === 1 || (e as MouseEvent).button === 2) return this.cancel();
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    this.onstart.emit(e as PointerEvent);

    let pointer = PointerDeviceService.convertLocalToLocal(this.input.pointer, this.grabbingElement, this.input.target.parentElement);
    this.rotateOffset = this.calcRotate(pointer, this.rotate);
    this.setAnimatedTransition(false);
  }

  onInputMove(e: MouseEvent | TouchEvent) {
    if (this.input.isGrabbing && !this.tabletopService.pointerDeviceService.isDragging) {
      return this.cancel(); // todo
    }
    if (this.isDisable || !this.input.isGrabbing) return this.cancel();

    e.stopPropagation();
    let pointer3d = PointerDeviceService.convertLocalToLocal(this.input.pointer, this.grabbingElement, this.input.target.parentElement);
    let angle = this.calcRotate(pointer3d, this.rotateOffset);

    if (!this.input.isDragging) this.ondragstart.emit(e as PointerEvent);
    this.ondrag.emit(e as PointerEvent);
    this.rotate = angle;
  }

  onInputEnd(e: MouseEvent | TouchEvent) {
    if (this.isDisable) return this.cancel();
    e.stopPropagation();
    if (this.input.isDragging) this.ondragend.emit(e as PointerEvent);
    this.cancel();
    this.snapToPolygonal();
    this.onend.emit(e as PointerEvent);
  }

  onContextMenu(e: MouseEvent | TouchEvent) {
    if (this.isDisable) return this.cancel();
    e.preventDefault();
    this.cancel();
    this.snapToPolygonal();
  }

  private calcRotate(pointer: PointerCoordinate, rotateOffset: number): number {
    let centerX = this.input.target.clientWidth / 2;
    let centerY = this.input.target.clientHeight / 2;
    let x = pointer.x - centerX;
    let y = pointer.y - centerY;
    let rad = Math.atan2(y, x);
    return ((rad * 180 / Math.PI) - rotateOffset) % 360;
  }

  snapToPolygonal(polygonal: number = 24) {
    if (polygonal <= 1) return;
    this.rotate = this.rotate < 0 ? this.rotate - (180 / polygonal) : this.rotate + (180 / polygonal);
    this.rotate -= (this.rotate) % (360 / polygonal);
  }

  private setUpdateTimer() {
    if (this.updateTimer === null) {
      this.updateTimer = setTimeout(() => {
        this.valueChange.emit(this.rotate);
        if (this.tabletopObject) this.tabletopObject.rotate = this.rotate;
        this.updateTimer = null;
      }, 66);
    }
    this.updateTransformCss();
  }

  private setRotate(object: RotableTabletopObject) {
    if (object) this._rotate = object.rotate;
    this.updateTransformCss();
  }

  private setAnimatedTransition(isEnable: boolean) {
    if (!this.input) return;
    this.input.target.style.transition = isEnable ? 'transform 132ms linear' : '';
  }

  private shouldTransition(object: RotableTabletopObject): boolean {
    return object.rotate !== this.rotate;
  }

  private stopTransition() {
    this.input.target.style.transform = window.getComputedStyle(this.input.target).transform;
  }

  private updateTransformCss() {
    if (!this.input) return;
    let css = this.transformCssOffset + ' rotateZ(' + this.rotate + 'deg)';
    this.input.target.style.transform = css;
  }
}
