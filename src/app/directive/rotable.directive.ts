import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { EventSystem } from '../class/core/system/system';
import { TabletopObject } from '../class/tabletop-object';
import { PointerCoordinate, PointerDeviceService } from '../service/pointer-device.service';
import { TabletopService } from '../service/tabletop.service';
import { Grabbable } from './grabbable';

export interface RotableTabletopObject extends TabletopObject {
  rotate: number;
}

export interface RotableOption {
  tabletopObject?: RotableTabletopObject;
  grabbingSelecter?: string;
  transformCssOffset?: string;
}

@Directive({
  selector: '[appRotable]'
})
export class RotableDirective extends Grabbable implements OnInit, OnDestroy, AfterViewInit {
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
  @Output('rotable.ondrag') ondrag: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.onend') onend: EventEmitter<PointerEvent> = new EventEmitter();

  private _rotate: number = 0;
  get rotate(): number { return this._rotate; }
  set rotate(rotate: number) { this._rotate = rotate; this.setUpdateTimer(); }
  @Input('rotable.value') set value(value: number) { this._rotate = value; this.updateTransformCss(); }
  @Output('rotable.valueChange') valueChange: EventEmitter<number> = new EventEmitter();

  private get isAllowedToRotate(): boolean {
    if (!this.grabbingElement || !this.transformElement) return false;
    if (this.grabbingSelecter.length < 1) return true;
    let elements = this.transformElement.querySelectorAll(this.grabbingSelecter);
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
  private transformElement: HTMLElement;

  constructor(
    private elementRef: ElementRef,
    protected tabletopService: TabletopService,
  ) {
    super();
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.transformElement = this.elementRef.nativeElement;
    if (this.tabletopObject) {
      EventSystem.register(this)
        .on('UPDATE_GAME_OBJECT', -1000, event => {
          if (event.isSendFromSelf || event.data.identifier !== this.tabletopObject.identifier) return;
          this.cancel();
          this.setRotate(this.tabletopObject);
        });
      this.setRotate(this.tabletopObject);
    } else {
      this.updateTransformCss();
    }
    this.tabletopService.ngZone.runOutsideAngular(() => {
      this.transformElement.addEventListener('mousedown', this.callbackOnMouseDown, false);
    });
  }

  ngOnDestroy() {
    this.cancel();
    EventSystem.unregister(this);
  }

  cancel() {
    this._isDragging = this._isGrabbing = false;
    this.grabbingElement = null;
    this.removeEventListeners();
    this.setAnimatedTransition(true);
  }

  protected onMouseDown(e: PointerEvent) {
    this.grabbingElement = <HTMLElement>e.target;
    if (this.isDisable || !this.isAllowedToRotate || e.button === 2) return this.cancel();
    console.log('onRotateMouseDown!!!!');
    e.stopPropagation();
    this._isGrabbing = true;
    this._isDragging = false;
    let pointer = PointerDeviceService.convertLocalToLocal(this.tabletopService.pointerDeviceService.pointers[0], this.grabbingElement, this.transformElement.parentElement);
    this.rotateOffset = this.calcRotate(pointer, this.rotate);
    this.addEventListeners();
    this.setAnimatedTransition(false);
  }

  protected onMouseMove(e: PointerEvent) {
    if (this.isDisable) return this.cancel();
    e.stopPropagation();
    let pointer = PointerDeviceService.convertLocalToLocal(this.tabletopService.pointerDeviceService.pointers[0], this.grabbingElement, this.transformElement.parentElement);
    let angle = this.calcRotate(pointer, this.rotateOffset);
    if (this.rotate !== angle) {
      this._isDragging = true;
      this.rotate = angle;
    }
  }

  protected onMouseUp(e: PointerEvent) {
    if (this.isDisable) return this.cancel();
    e.preventDefault();
    this.cancel();
    this.stickToPolygonal();
  }

  protected onContextMenu(e: PointerEvent) {
    if (this.isDisable) return this.cancel();
    e.preventDefault();
    this.cancel();
    this.stickToPolygonal();
  }

  private calcRotate(pointer: PointerCoordinate, rotateOffset: number): number {
    let centerX = this.transformElement.clientWidth / 2;
    let centerY = this.transformElement.clientHeight / 2;
    let x = pointer.x - centerX;
    let y = pointer.y - centerY;
    let rad = Math.atan2(y, x);
    return ((rad * 180 / Math.PI) - rotateOffset) % 360;
  }

  stickToPolygonal(polygonal: number = 24) {
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
    if (!this.transformElement) return;
    this.transformElement.style.transition = isEnable ? 'transform 132ms linear' : '';
  }

  private updateTransformCss() {
    if (!this.transformElement) return;
    let css = this.transformCssOffset + ' rotateZ(' + this.rotate + 'deg)';
    this.transformElement.style.transform = css;
  }
}
