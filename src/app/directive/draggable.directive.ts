import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output } from '@angular/core';
import { CSSNumber } from '@udonarium/transform/css-number';
import { PointerCoordinate } from 'service/pointer-device.service';

import { InputHandler } from './input-handler';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective implements AfterViewInit, OnDestroy {
  @Input('draggable.disable') isDisable: boolean = false;
  @Input('draggable.bounds') boundsSelector: string = 'body';
  @Input('draggable.handle') handleSelector: string = '';
  @Input('draggable.unhandle') unhandleSelector: string = 'input,textarea,button,select,option,span';
  @Input('draggable.stack') stackSelector: string = '';
  @Input('draggable.opacity') opacity: number = 0.7;

  @Output('draggable.start') onstart: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();
  @Output('draggable.move') onmove: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();
  @Output('draggable.end') onend: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();

  private callbackOnResize = this.adjustPosition.bind(this);

  private input: InputHandler = null;
  private startPosition: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private startPointer: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private prevTrans: PointerCoordinate = { x: 0, y: 0, z: 0 };

  constructor(
    private ngZone: NgZone,
    private elementRef: ElementRef<HTMLElement>
  ) { }

  ngAfterViewInit() {
    this.initialize();
    this.adjustPosition();
    this.setForeground();
  }

  ngOnDestroy() {
    this.cancel();
    this.destroy();
  }

  private initialize() {
    this.ngZone.runOutsideAngular(() => {
      this.input = new InputHandler(this.elementRef.nativeElement);
      window.addEventListener('resize', this.callbackOnResize, false);
    });
    this.input.onStart = this.onInputStart.bind(this);
    this.input.onMove = this.onInputMove.bind(this);
    this.input.onEnd = this.onInputEnd.bind(this);
    this.input.onContextMenu = this.onContextMenu.bind(this);
  }

  cancel() {
    this.input.cancel();
  }

  destroy() {
    window.removeEventListener('resize', this.callbackOnResize, false);
    this.input.destroy();
  }

  private onInputStart(e: MouseEvent | TouchEvent) {
    if ((e as MouseEvent).button === 1 || (e as MouseEvent).button === 2) return this.cancel();
    this.setForeground();
    this.startPosition = this.calcElementPosition(this.elementRef.nativeElement);

    this.startPointer = this.input.pointer;
    this.prevTrans = { x: 0, y: 0, z: 0 };

    let isHandle = this.isHandleElement(e.target as HTMLElement);
    let isUnhandle = this.isUnhandleElement(e.target as HTMLElement);
    let isScrollable = (e as TouchEvent).touches != null ? this.isScrollableElement(e.target as HTMLElement) : false;

    if (!isHandle || isUnhandle || isScrollable) {
      this.cancel();
      return;
    }
    e.stopPropagation();
  }

  private onInputMove(e: MouseEvent | TouchEvent) {
    let trans = {
      x: this.input.pointer.x - this.startPointer.x,
      y: this.input.pointer.y - this.startPointer.y,
      z: this.input.pointer.z - this.startPointer.z
    };

    let diff = {
      x: trans.x - this.prevTrans.x,
      y: trans.y - this.prevTrans.y,
      z: trans.z - this.prevTrans.z
    };

    let correction = this.calcCorrectionPosition(diff);
    trans.x += correction.x;
    trans.y += correction.y;
    trans.z += correction.z;

    if (0 < trans.x ** 2 + trans.y ** 2 + trans.z ** 2) {
      this.elementRef.nativeElement.style.opacity = this.opacity + '';
    }

    this.elementRef.nativeElement.style.willChange = 'top, left';
    this.elementRef.nativeElement.style.left = trans.x + this.startPosition.x + 'px';
    this.elementRef.nativeElement.style.top = trans.y + this.startPosition.y + 'px';

    this.prevTrans = trans;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
  }

  private onInputEnd(e: MouseEvent | TouchEvent) {
    this.elementRef.nativeElement.style.opacity = null;
    this.elementRef.nativeElement.style.willChange = null;
    if (this.input.isDragging && e.cancelable) {
      this.preventClickIfNeeded(e);
      e.preventDefault();
    }
    e.stopPropagation();
  }

  private onContextMenu(e: MouseEvent | TouchEvent) {
    e.stopPropagation();
  }

  private preventClickIfNeeded(e: MouseEvent | TouchEvent) {
    if ((e as TouchEvent).touches != null) return;

    let diffX = this.input.pointer.x - this.startPointer.x;
    let diffY = this.input.pointer.y - this.startPointer.y;
    let diffZ = this.input.pointer.z - this.startPointer.z;
    let distance = diffX ** 2 + diffY ** 2 + diffZ ** 2;

    if (15 ** 2 > distance) return;

    let callback = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    this.elementRef.nativeElement.addEventListener('click', callback, true);
    setTimeout(() => this.elementRef.nativeElement.removeEventListener('click', callback, true));
  }

  private adjustPosition() {
    let current = this.calcElementPosition(this.elementRef.nativeElement);
    let correction = this.calcCorrectionPosition();
    this.elementRef.nativeElement.style.left = correction.x + current.x + 'px';
    this.elementRef.nativeElement.style.top = correction.y + current.y + 'px';
  }

  private isHandleElement(target: HTMLElement): boolean {
    if (this.handleSelector.length < 1) return true;
    return this.isContainsElement(target, this.handleSelector);
  }

  private isUnhandleElement(target: HTMLElement): boolean {
    if (this.unhandleSelector.length < 1) return false;
    return this.isContainsElement(target, this.unhandleSelector);
  }

  private isContainsElement(target: HTMLElement, selectors: string): boolean {
    let elms = this.elementRef.nativeElement.querySelectorAll<HTMLElement>(selectors);
    for (let i = 0; i < elms.length; i++) {
      if (elms[i].contains(target)) return true;
    }
    return false;
  }

  private isScrollableElement(target: HTMLElement) {
    let boundsElm = this.elementRef.nativeElement.ownerDocument.querySelector(this.boundsSelector);
    let node = target;
    let overflowType = ['scroll', 'auto'];
    let positionType = ['fixed', 'sticky', '-webkit-sticky'];
    while (node && boundsElm !== node && this.elementRef.nativeElement !== node) {
      let css: CSSStyleDeclaration = window.getComputedStyle(node);
      if (0 <= overflowType.indexOf(css.overflowY) && node.offsetHeight < node.scrollHeight) return true;
      if (0 <= positionType.indexOf(css.position)) return false;
      node = node.parentElement;
    }
    return false;
  }

  private calcCorrectionPosition(diff: PointerCoordinate = { x: 0, y: 0, z: 0 }): PointerCoordinate {
    let correction: PointerCoordinate = { x: 0, y: 0, z: 0 };
    let box = this.elementRef.nativeElement.getBoundingClientRect();
    let bounds = this.elementRef.nativeElement.ownerDocument.querySelector(this.boundsSelector).getBoundingClientRect();

    if (bounds.right < box.right + diff.x) {
      correction.x += bounds.right - (box.right + diff.x);
    }
    if (box.left + diff.x < bounds.left) {
      correction.x += bounds.left - (box.left + diff.x);
    }

    if (bounds.bottom < box.bottom + diff.y) {
      correction.y += bounds.bottom - (box.bottom + diff.y);
    }
    if (box.top + diff.y < bounds.top) {
      correction.y += bounds.top - (box.top + diff.y);
    }
    return correction;
  }

  private calcElementPosition(target: HTMLElement): PointerCoordinate {
    let css: CSSStyleDeclaration = window.getComputedStyle(target);
    return {
      x: CSSNumber.relation(css.left, target.parentElement.offsetWidth, target.parentElement.offsetWidth * 0.5),
      y: CSSNumber.relation(css.top, target.parentElement.offsetHeight, target.parentElement.offsetHeight * 0.5),
      z: 0
    };
  }

  private setForeground() {
    if (this.stackSelector.length < 1) return;
    let stacks = this.elementRef.nativeElement.ownerDocument.querySelectorAll<HTMLElement>(this.stackSelector);
    let topZindex: number = 0;
    let bottomZindex: number = 99999;
    stacks.forEach(elm => {
      let zIndex = parseInt(elm.style.zIndex);
      if (topZindex < zIndex) topZindex = zIndex;
      if (zIndex < bottomZindex) bottomZindex = zIndex;
    });

    if (topZindex <= parseInt(this.elementRef.nativeElement.style.zIndex)) return;

    stacks.forEach(elm => {
      elm.style.zIndex = (parseInt(elm.style.zIndex) - bottomZindex) + '';
    });
    this.elementRef.nativeElement.style.zIndex = (topZindex + 1) + '';
  }
}
