import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output } from '@angular/core';
import { CSSNumber } from '@udonarium/transform/css-number';
import { PointerCoordinate } from 'service/pointer-device.service';

import { HandleType, ResizeHandler } from './resize-handler';

interface BoxSize {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Directive({
  selector: '[appResizable]'
})
export class ResizableDirective implements AfterViewInit, OnDestroy {
  @Input('resizable.disable') isDisable: boolean = false;
  @Input('resizable.bounds') boundsSelector: string = 'body';
  @Input('resizable.stack') stackSelector: string = '';
  @Input('resizable.minWidth') minWidth: number = 100;
  @Input('resizable.minHeight') minHeight: number = 100

  @Output('resizable.start') ostart: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();
  @Output('resizable.move') onmove: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();
  @Output('resizable.end') onend: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();

  private handleMap = new Map<HandleType, ResizeHandler>();
  private handleTypes: HandleType[] = [
    HandleType.N,
    HandleType.E,
    HandleType.W,
    HandleType.S,
    HandleType.NE,
    HandleType.NW,
    HandleType.SE,
    HandleType.SW
  ];

  private startPosition: BoxSize = { left: 0, top: 0, width: 0, height: 0 };

  private startPointer: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private prevTrans: BoxSize = { left: 0, top: 0, width: 0, height: 0 };

  constructor(
    private ngZone: NgZone,
    private elementRef: ElementRef<HTMLElement>
  ) { }

  ngAfterViewInit() {
    this.initialize();
    this.setForeground();
  }

  ngOnDestroy() {
    this.cancel();
    this.destroy();
  }

  private initialize() {
    this.ngZone.runOutsideAngular(() => {
      this.handleTypes.forEach(type => {
        let handle = new ResizeHandler(this.elementRef.nativeElement, type);
        this.handleMap.set(type, handle);
        handle.input.onStart = ev => this.onResizeStart(ev, handle);
        handle.input.onMove = ev => this.onResizeMove(ev, handle);
        handle.input.onEnd = ev => this.onResizeEnd(ev, handle);
        handle.input.onContextMenu = ev => this.onContextMenu(ev, handle);
      });
    });
  }

  cancel() {
    this.handleMap.forEach(handle => handle.input.cancel());
  }

  destroy() {
    this.handleMap.forEach(handle => handle.input.destroy());
  }

  private onResizeStart(e: MouseEvent | TouchEvent, handle: ResizeHandler) {
    if ((e as MouseEvent).button === 1 || (e as MouseEvent).button === 2) return this.cancel();
    this.setForeground();
    this.handleMap.forEach(h => {
      if (h !== handle) h.input.cancel();
    });

    this.startPosition = this.calcElementPosition(this.elementRef.nativeElement);
    this.startPointer = handle.input.pointer;
    this.prevTrans = { left: 0, top: 0, width: 0, height: 0 };

    this.removeSelectionRanges();
    this.removeFocus();
    e.stopPropagation();
  }

  private onResizeMove(e: MouseEvent | TouchEvent, handle: ResizeHandler) {
    let trans: BoxSize = {
      left: 0,
      top: 0,
      width: handle.input.pointer.x - this.startPointer.x,
      height: handle.input.pointer.y - this.startPointer.y
    };

    switch (handle.type) {
      case HandleType.N:
      case HandleType.S:
        trans.width = 0;
        break;
      case HandleType.E:
      case HandleType.W:
        trans.height = 0;
        break;
    }

    switch (handle.type) {
      case HandleType.SW:
        trans.left = trans.width;
        trans.width *= -1;
        break;
      case HandleType.NE:
        trans.top = trans.height;
        trans.height *= -1;
        break;
      case HandleType.E:
      case HandleType.S:
      case HandleType.SE:
        break;
      case HandleType.N:
      case HandleType.W:
      case HandleType.NW:
        trans.left = trans.width;
        trans.top = trans.height;
        trans.width *= -1;
        trans.height *= -1;
        break;
    }

    if (trans.width + this.startPosition.width < this.minWidth) {
      trans.width = this.minWidth - this.startPosition.width;
      trans.left = trans.left !== 0 ? -trans.width : trans.left;
    }

    if (trans.height + this.startPosition.height < this.minHeight) {
      trans.height = this.minHeight - this.startPosition.height;
      trans.top = trans.top !== 0 ? -trans.height : trans.top;
    }

    let diff: BoxSize = {
      left: trans.left - this.prevTrans.left,
      top: trans.top - this.prevTrans.top,
      width: trans.width - this.prevTrans.width,
      height: trans.height - this.prevTrans.height
    };

    let correction = this.calcCorrectionPosition(diff);
    trans.left += correction.left;
    trans.top += correction.top;
    trans.width += correction.width;
    trans.height += correction.height;

    this.elementRef.nativeElement.style.left = trans.left + this.startPosition.left + 'px';
    this.elementRef.nativeElement.style.top = trans.top + this.startPosition.top + 'px';
    this.elementRef.nativeElement.style.width = trans.width + this.startPosition.width + 'px';
    this.elementRef.nativeElement.style.height = trans.height + this.startPosition.height + 'px';

    this.prevTrans = trans;

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
  }

  private onResizeEnd(e: MouseEvent | TouchEvent, handle: ResizeHandler) {
    if (handle.input.isDragging && e.cancelable) e.preventDefault();
    e.stopPropagation();
  }

  private onContextMenu(e: MouseEvent | TouchEvent, handle: ResizeHandler) {
    e.stopPropagation();
  }

  private calcCorrectionPosition(diff: BoxSize = { left: 0, top: 0, width: 0, height: 0 }): BoxSize {
    let correction: BoxSize = { left: 0, top: 0, width: 0, height: 0 };
    let box = this.elementRef.nativeElement.getBoundingClientRect();
    let bounds = this.elementRef.nativeElement.ownerDocument.querySelector(this.boundsSelector).getBoundingClientRect();

    if (bounds.right < box.right + diff.left + diff.width) {
      correction.width += bounds.right - (box.right + diff.left + diff.width);
    }
    if (box.left + diff.left < bounds.left) {
      correction.left += bounds.left - (box.left + diff.left);
      correction.width -= correction.left;
    }

    if (bounds.bottom < box.bottom + diff.top + diff.height) {
      correction.height += bounds.bottom - (box.bottom + diff.top + diff.height);
    }
    if (box.top + diff.top < bounds.top) {
      correction.top += bounds.top - (box.top + diff.top);
      correction.height -= correction.top;
    }

    return correction;
  }

  private calcElementPosition(target: HTMLElement): BoxSize {
    let css: CSSStyleDeclaration = window.getComputedStyle(target);
    return {
      left: CSSNumber.relation(css.left, target.parentElement.offsetWidth, target.parentElement.offsetWidth * 0.5),
      top: CSSNumber.relation(css.top, target.parentElement.offsetHeight, target.parentElement.offsetHeight * 0.5),
      width: CSSNumber.relation(css.width, target.parentElement.offsetWidth, target.parentElement.offsetWidth * 0.5),
      height: CSSNumber.relation(css.height, target.parentElement.offsetHeight, target.parentElement.offsetHeight * 0.5),
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

  private removeSelectionRanges() {
    let selection = window.getSelection();
    if (!selection.isCollapsed) {
      selection.removeAllRanges();
    }
  }

  private removeFocus() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
