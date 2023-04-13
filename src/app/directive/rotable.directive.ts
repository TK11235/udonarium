import { Directive, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { EventSystem } from '@udonarium/core/system';
import { TabletopObject } from '@udonarium/tabletop-object';
import { BatchService } from 'service/batch.service';
import { CoordinateService } from 'service/coordinate.service';
import { PointerCoordinate, PointerDeviceService } from 'service/pointer-device.service';

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
export class RotableDirective implements OnChanges, OnDestroy {
  protected tabletopObject: RotableTabletopObject;

  private transformCssOffset: string = '';
  private grabbingSelecter: string = '.rotate-grab';
  @Input('rotable.option') set option(option: RotableOption) {
    this.tabletopObject = option.tabletopObject;
    this.grabbingSelecter = option.grabbingSelecter ?? '.rotate-grab';
    this.transformCssOffset = option.transformCssOffset ?? '';
  }
  @Input('rotable.disable') isDisable: boolean = false;
  @Output('rotable.onstart') onstart: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.ondragstart') ondragstart: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.ondrag') ondrag: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.ondragend') ondragend: EventEmitter<PointerEvent> = new EventEmitter();
  @Output('rotable.onend') onend: EventEmitter<PointerEvent> = new EventEmitter();

  private get nativeElement(): HTMLElement { return this.elementRef.nativeElement; }

  private cssRotate = 0;
  private _rotate: number = 0;
  get rotate(): number { return this._rotate; }
  set rotate(rotate: number) { this._rotate = rotate; this.setUpdateBatching(); }
  @Input('rotable.value') set value(value: number) { this._rotate = value; }
  @Output('rotable.valueChange') valueChange: EventEmitter<number> = new EventEmitter();

  private get isAllowedToRotate(): boolean {
    if (!this.grabbingElement || !this.nativeElement) return false;
    if (this.grabbingSelecter.length < 1) return true;
    let elements = this.nativeElement.querySelectorAll(this.grabbingSelecter);
    let macth = false;
    for (let i = 0; i < elements.length; i++) {
      macth = elements[i].contains(this.grabbingElement);
      if (macth) return true;
    }
    return false;
  }

  private rotateOffset: number = 0;
  private isUpdateBatching: boolean = false;
  private grabbingElement: HTMLElement = null;
  private input: InputHandler = null;

  constructor(
    private elementRef: ElementRef,
    private batchService: BatchService,
    private pointerDeviceService: PointerDeviceService,
    private coordinateService: CoordinateService,
  ) { }

  ngOnChanges(): void {
    this.dispose();
    if (this.tabletopObject) {
      EventSystem.register(this)
        .on(`UPDATE_GAME_OBJECT/identifier/${this.tabletopObject?.identifier}`, event => {
          if ((event.isSendFromSelf && this.input?.isGrabbing) || !this.shouldTransition(this.tabletopObject)) return;
          this.batchService.add(() => {
            if (this.input?.isGrabbing) {
              this.cancel();
            } else {
              this.setAnimatedTransition(true);
            }
            this.stopTransition(this.tabletopObject.rotate);
            this.setRotate(this.tabletopObject);
          }, this);
        });
      this.setRotate(this.tabletopObject);
    } else {
      this.stopTransition();
      this.updateTransformCss();
    }
    if (!this.input) this.batchService.add(() => this.initialize(), this.elementRef);
  }

  ngOnDestroy() {
    this.dispose();
    this.input?.destroy();
  }

  initialize() {
    this.input = new InputHandler(this.nativeElement);
    this.input.onStart = this.onInputStart.bind(this);
    this.input.onMove = this.onInputMove.bind(this);
    this.input.onEnd = this.onInputEnd.bind(this);
    this.input.onContextMenu = this.onContextMenu.bind(this);
    this.setAnimatedTransition(true);
  }

  cancel() {
    this.input?.cancel();
    this.grabbingElement = null;
    this.setAnimatedTransition(true);
  }

  dispose() {
    EventSystem.unregister(this);
    this.batchService.remove(this);
    this.batchService.remove(this.elementRef);
  }

  onInputStart(e: MouseEvent | TouchEvent) {
    this.grabbingElement = e.target as HTMLElement;
    if (this.isDisable || !this.isAllowedToRotate || (e instanceof MouseEvent && e.button !== 0)) return this.cancel();
    e.stopPropagation();
    this.onstart.emit(e as PointerEvent);

    let pointer = this.coordinateService.convertLocalToLocal(this.input.pointer, this.grabbingElement, this.nativeElement.parentElement);
    this.rotateOffset = this.calcRotate(pointer, this.rotate);
    this.setAnimatedTransition(false);
  }

  onInputMove(e: MouseEvent | TouchEvent) {
    if (this.input.isGrabbing && !this.pointerDeviceService.isDragging) {
      return this.cancel(); // todo
    }
    if (this.isDisable || !this.input.isGrabbing) return this.cancel();

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    let pointer3d = this.coordinateService.convertLocalToLocal(this.input.pointer, this.grabbingElement, this.nativeElement.parentElement);
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
    if (e.cancelable) e.preventDefault();
    this.cancel();
    this.snapToPolygonal();
  }

  private calcRotate(pointer: PointerCoordinate, rotateOffset: number): number {
    let centerX = this.nativeElement.clientWidth / 2;
    let centerY = this.nativeElement.clientHeight / 2;
    let x = pointer.x - centerX;
    let y = pointer.y - centerY;
    let rad = Math.atan2(y, x);
    let rotate = ((rad * 180 / Math.PI) - rotateOffset + 720) % 360;
    return rotate < 180 ? rotate : rotate - 360;
  }

  private radianFromMatrix(a, b, c, d, e, f) {
    let radian = 0;
    if (a !== 0 || b !== 0) {
      let r = Math.sqrt(a * a + b * b);
      radian = b > 0 ? Math.acos(a / r) : -Math.acos(a / r);
    } else if (c !== 0 || d !== 0) {
      let s = Math.sqrt(c * c + d * d);
      radian = Math.PI * 0.5 - (d > 0 ? Math.acos(-c / s) : -Math.acos(c / s));
    } else {
      // a = b = c = d = 0
    }
    return radian;
  }

  snapToPolygonal(polygonal: number = 24) {
    if (polygonal <= 1) return;
    this.rotate = this.rotate < 0 ? this.rotate - (180 / polygonal) : this.rotate + (180 / polygonal);
    this.rotate -= (this.rotate) % (360 / polygonal);
  }

  private setUpdateBatching() {
    if (!this.isUpdateBatching) {
      this.isUpdateBatching = true;
      this.batchService.add(() => {
        this.valueChange.emit(this.rotate);
        if (this.tabletopObject) this.tabletopObject.rotate = this.rotate;
        this.isUpdateBatching = false;
      });
    }
    this.updateTransformCss();
  }

  private setRotate(object: RotableTabletopObject) {
    if (object) this._rotate = object.rotate;
    this.updateTransformCss();
  }

  private setAnimatedTransition(isEnable: boolean) {
    this.nativeElement.style.transition = isEnable ? 'transform 132ms linear' : '';
  }

  private shouldTransition(object: RotableTabletopObject): boolean {
    return object.rotate !== this.rotate;
  }

  private stopTransition(nextRotate: number = this.rotate) {
    let cssTransform = window.getComputedStyle(this.nativeElement).transform;

    if (Math.abs(nextRotate - this.cssRotate) < 180) return;

    let regArray = /matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^,]+)\)/gi.exec(cssTransform);
    if (!regArray) return;

    let currentRad = this.radianFromMatrix(
      Number(regArray[1]), Number(regArray[2]), Number(regArray[3]),
      Number(regArray[4]), Number(regArray[5]), Number(regArray[6])
    );
    let currentRotate = currentRad * 180 / Math.PI;
    let currentVector = { x: Math.cos(currentRad), y: Math.sin(currentRad) };

    let nextRad = nextRotate * Math.PI / 180;
    let nextVector = { x: Math.cos(nextRad), y: Math.sin(nextRad) };

    let crossProduct = currentVector.x * nextVector.y - nextVector.x * currentVector.y;

    let diff = Math.abs(nextRotate - currentRotate);
    if (180 < diff) diff = 360 - diff;

    let expectRotate = nextRotate + (0 < crossProduct ? -diff : diff);
    if (expectRotate === currentRotate) return;

    let cssTransition = this.nativeElement.style.transition;
    this.nativeElement.style.transition = '';

    this.cssRotate = expectRotate;
    this.nativeElement.style.transform = `${this.transformCssOffset} rotateZ(${expectRotate.toFixed(4)}deg)`;
    this.nativeElement.style.transform = window.getComputedStyle(this.nativeElement).transform;

    this.nativeElement.style.transition = cssTransition;
  }

  private updateTransformCss() {
    this.cssRotate = this.rotate;
    let css = `${this.transformCssOffset} rotateZ(${this.rotate.toFixed(4)}deg)`;
    this.nativeElement.style.transform = css;
  }
}
