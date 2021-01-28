import { NgZone } from '@angular/core';

type Callback = (srcEvent: TouchEvent | MouseEvent | PointerEvent) => void;
type OnGestureCallback = (srcEvent: TouchEvent | MouseEvent | PointerEvent) => void;
type OnTransformCallback = (transformX: number, transformY: number, transformZ: number, rotateX: number, rotateY: number, rotateZ: number, event: TableTouchGestureEvent, srcEvent: TouchEvent | MouseEvent | PointerEvent) => void;

export enum TableTouchGestureEvent {
  PAN = 'pan',
  TAP_PINCH = 'tappinch',
  PINCH = 'pinch',
  ROTATE = 'rotate',
}

export class TableTouchGesture {
  private hammer: HammerManager = null;
  private deltaHammerDeltaX: number = 0;
  private deltaHammerDeltaY = 1.0;
  private deltaHammerScale = 1.0;
  private deltaHammerRotation = 0;

  private prevHammerDeltaX: number = 0;
  private prevHammerDeltaY: number = 0;
  private prevHammerScale: number = 0;
  private prevHammerRotation: number = 0;

  private tappedPanTimer: NodeJS.Timer = null;
  private tappedPanCenter: HammerPoint = { x: 0, y: 0 };

  onstart: Callback = null;
  onend: Callback = null;
  ongesture: OnGestureCallback = null;
  ontransform: OnTransformCallback = null;

  constructor(readonly targetElement: Element, private readonly ngZone: NgZone) {
    this.initializeHammer();
  }

  destroy() {
    this.clearTappedPanTimer();
    this.hammer.destroy();
  }

  private initializeHammer() {
    this.hammer = new Hammer.Manager(this.targetElement, { inputClass: Hammer.TouchInput });

    let tap = new Hammer.Tap();
    let pan1p = new Hammer.Pan({ event: 'pan1p', pointers: 1, threshold: 0 });
    let pan2p = new Hammer.Pan({ event: 'pan2p', pointers: 2, threshold: 0 });
    let pinch = new Hammer.Pinch();
    let rotate = new Hammer.Rotate();

    pan1p.recognizeWith(pan2p);
    pan1p.recognizeWith(rotate);
    pan1p.recognizeWith(pinch);

    pan2p.recognizeWith(pinch);
    pan2p.recognizeWith(rotate);
    pinch.recognizeWith(rotate);

    this.hammer.add([tap, pan1p, pan2p, pinch, rotate]);

    this.hammer.on('hammer.input', this.onHammer.bind(this));
    this.hammer.on('tap', this.onTap.bind(this));
    this.hammer.on('pan1pstart', this.onTappedPanStart.bind(this));
    this.hammer.on('pan1pmove', this.onTappedPanMove.bind(this));
    this.hammer.on('pan1pend', this.onTappedPanEnd.bind(this));
    this.hammer.on('pan1pcancel', this.onTappedPanEnd.bind(this));
    this.hammer.on('pan2pmove', this.onPanMove.bind(this));
    this.hammer.on('pinchmove', this.onPinchMove.bind(this));
    this.hammer.on('rotatemove', this.onRotateMove.bind(this));

    // iOS で contextmenu が発火しない問題へのworkaround.
    let ua = window.navigator.userAgent.toLowerCase();
    let isiOS = ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 || ua.indexOf('macintosh') > -1 && 'ontouchend' in document;
    if (!isiOS) return;
    this.hammer.add(new Hammer.Press({ time: 251 }));
    this.hammer.on('press', ev => {
      let event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: ev.center.x,
        clientY: ev.center.y,
      });
      this.ngZone.run(() => ev.srcEvent.target.dispatchEvent(event));
    });
  }

  private onHammer(ev: HammerInput) {
    if (ev.isFirst) {
      this.deltaHammerScale = ev.scale;
      this.deltaHammerRotation = ev.rotation;
      this.deltaHammerDeltaX = ev.deltaX;
      this.deltaHammerDeltaY = ev.deltaY;
      if (this.onstart) this.onstart(ev.srcEvent);
    } else if (ev.isFinal) {
      if (this.onend) this.onend(ev.srcEvent);
    } else {
      this.deltaHammerScale = ev.scale - this.prevHammerScale;
      this.deltaHammerRotation = ev.rotation - this.prevHammerRotation;
      this.deltaHammerDeltaX = ev.deltaX - this.prevHammerDeltaX;
      this.deltaHammerDeltaY = ev.deltaY - this.prevHammerDeltaY;
    }
    this.prevHammerScale = ev.scale;
    this.prevHammerRotation = ev.rotation;
    this.prevHammerDeltaX = ev.deltaX;
    this.prevHammerDeltaY = ev.deltaY;

    if (this.tappedPanTimer == null || ev.eventType != Hammer.INPUT_START) return;
    let distance = (this.tappedPanCenter.x - ev.center.x) ** 2 + (this.tappedPanCenter.y - ev.center.y) ** 2;
    if (50 ** 2 < distance) {
      this.clearTappedPanTimer();
    }
  }

  private onTap(ev: HammerInput) {
    this.tappedPanCenter = ev.center;
    this.tappedPanTimer = setTimeout(() => { this.tappedPanTimer = null; }, 400);
    if (this.ongesture) this.ongesture(ev.srcEvent);
  }

  private onTappedPanStart(ev: HammerInput) {
    if (this.tappedPanTimer == null) return;
    this.clearTappedPanTimer(false);
    if (this.ongesture) this.ongesture(ev.srcEvent);
  }

  private onTappedPanEnd(ev: HammerInput) {
    this.clearTappedPanTimer();
  }

  private onTappedPanMove(ev: HammerInput) {
    if (this.tappedPanTimer == null) {
      let transformX = this.deltaHammerDeltaX;
      let transformY = this.deltaHammerDeltaY;
      let transformZ = 0;
      if (this.ontransform) this.ontransform(transformX, transformY, transformZ, 0, 0, 0, TableTouchGestureEvent.PAN, ev.srcEvent);
    } else {
      this.clearTappedPanTimer(false);
      let scale = this.deltaHammerDeltaY;
      let transformZ = scale * 7.5;
      if (this.ongesture) this.ongesture(ev.srcEvent);
      if (this.ontransform) this.ontransform(0, 0, transformZ, 0, 0, 0, TableTouchGestureEvent.TAP_PINCH, ev.srcEvent);
    }
  }

  private onPanMove(ev: HammerInput) {
    this.clearTappedPanTimer();
    let rotateX = -this.deltaHammerDeltaY / window.innerHeight * 100;
    if (this.ongesture) this.ongesture(ev.srcEvent);
    if (this.ontransform) this.ontransform(0, 0, 0, rotateX, 0, 0, TableTouchGestureEvent.ROTATE, ev.srcEvent);
  }

  private onPinchMove(ev: HammerInput) {
    this.clearTappedPanTimer();
    let transformZ = this.deltaHammerScale * 500;
    if (this.ongesture) this.ongesture(ev.srcEvent);
    if (this.ontransform) this.ontransform(0, 0, transformZ, 0, 0, 0, TableTouchGestureEvent.PINCH, ev.srcEvent);
  }

  private onRotateMove(ev: HammerInput) {
    this.clearTappedPanTimer();
    let rotateZ = this.deltaHammerRotation;
    if (this.ongesture) this.ongesture(ev.srcEvent);
    if (this.ontransform) this.ontransform(0, 0, 0, 0, 0, rotateZ, TableTouchGestureEvent.ROTATE, ev.srcEvent);
  }

  private clearTappedPanTimer(needsSetNull: boolean = true) {
    clearTimeout(this.tappedPanTimer);
    if (needsSetNull) this.tappedPanTimer = null;
  }
}