import { PointerCoordinate, PointerData } from 'service/pointer-device.service';

const MOUSE_IDENTIFIER = -9999;

interface InputHandlerOption {
  readonly capture?: boolean
  readonly passive?: boolean
  readonly always?: boolean
}

export class InputHandler {
  onStart: (ev: MouseEvent | TouchEvent) => void;
  onMove: (ev: MouseEvent | TouchEvent) => void;
  onEnd: (ev: MouseEvent | TouchEvent) => void;
  onContextMenu: (ev: MouseEvent | TouchEvent) => void;

  private callbackOnMouse = this.onMouse.bind(this);
  private callbackOnTouch = this.onTouch.bind(this);
  private callbackOnMenu = this.onMenu.bind(this);

  private lastPointers: PointerData[] = [];
  private primaryPointer: PointerData = { x: 0, y: 0, z: 0, identifier: MOUSE_IDENTIFIER }
  get pointer(): PointerCoordinate { return this.primaryPointer; }

  private _isDragging: boolean = false;
  private _isGrabbing: boolean = false;
  get isDragging(): boolean { return this._isDragging; }
  get isGrabbing(): boolean { return this._isGrabbing; }

  private _isDestroyed: boolean = false;
  get isDestroyed(): boolean { return this._isDestroyed; }

  private readonly option: InputHandlerOption = null;

  constructor(readonly target: HTMLElement, option: InputHandlerOption = { capture: false, passive: false, always: false }) {
    this.option = {
      capture: option.capture === true,
      passive: option.passive === true,
      always: option.always === true
    };
    this.initialize();
  }

  private initialize() {
    this.target.addEventListener('mousedown', this.callbackOnMouse, this.option.capture);
    this.target.addEventListener('touchstart', this.callbackOnTouch, this.option.capture);
    if (this.option.always) this.addEventListeners();
  }

  destroy() {
    this.cancel();
    this._isDestroyed = true;
    this.target.removeEventListener('mousedown', this.callbackOnMouse, this.option.capture);
    this.target.removeEventListener('touchstart', this.callbackOnTouch, this.option.capture);
    this.removeEventListeners();
  }

  cancel() {
    this._isDragging = this._isGrabbing = false;
    if (!this.option.always) this.removeEventListeners();
  }

  private onMouse(e: MouseEvent) {
    let mosuePointer: PointerData = { x: e.pageX, y: e.pageY, z: 0, identifier: MOUSE_IDENTIFIER };
    if (this.isSyntheticEvent(mosuePointer)) return;
    this.lastPointers = [mosuePointer];
    this.primaryPointer = mosuePointer;

    this.onPointer(e);
  }

  private onTouch(e: TouchEvent) {
    let length = e.changedTouches.length;
    if (length < 1) return;
    this.lastPointers = [];
    for (let i = 0; i < length; i++) {
      let touch = e.changedTouches[i];
      let touchPointer: PointerData = { x: touch.pageX, y: touch.pageY, z: 0, identifier: touch.identifier };
      this.lastPointers.push(touchPointer);
    }

    if (e.type === 'touchstart') {
      this.primaryPointer = this.lastPointers[0];
    } else {
      let changedTouches = Array.from(e.changedTouches);
      let touch = changedTouches.find(touch => touch.identifier === this.primaryPointer.identifier);
      if (touch == null) return;
      let touchPointer: PointerData = { x: touch.pageX, y: touch.pageY, z: 0, identifier: touch.identifier };
      this.primaryPointer = touchPointer;
    }

    this.onPointer(e);
  }

  private onPointer(e: MouseEvent | TouchEvent) {
    switch (e.type) {
      case 'mousedown':
      case 'touchstart':
        this._isGrabbing = true;
        this._isDragging = false;
        this.addEventListeners();
        if (this.onStart) this.onStart(e);
        break;
      case 'mousemove':
      case 'touchmove':
        if (this.onMove) this.onMove(e);
        this._isDragging = this._isGrabbing;
        break;
      default:
        if (this.onEnd) this.onEnd(e);
        this.cancel();
        break;
    }
  }

  private onMenu(e: MouseEvent | TouchEvent) {
    if (this.onContextMenu) this.onContextMenu(e);
  }

  private isSyntheticEvent(mosuePointer: PointerData, threshold: number = 15): boolean {
    for (let pointer of this.lastPointers) {
      if (pointer.identifier === mosuePointer.identifier) continue;
      let distance = (mosuePointer.x - pointer.x) ** 2 + (mosuePointer.y - pointer.y) ** 2;
      if (distance < threshold ** 2) {
        return true;
      }
    }
    return false;
  }

  private addEventListeners() {
    let option: AddEventListenerOptions = {
      capture: this.option.capture,
      passive: this.option.passive
    }
    this.target.ownerDocument.addEventListener('mousemove', this.callbackOnMouse, option);
    this.target.ownerDocument.addEventListener('mouseup', this.callbackOnMouse, option);
    this.target.ownerDocument.addEventListener('touchmove', this.callbackOnTouch, option);
    this.target.ownerDocument.addEventListener('touchend', this.callbackOnTouch, option);
    this.target.ownerDocument.addEventListener('touchcancel', this.callbackOnTouch, option);
    this.target.ownerDocument.addEventListener('contextmenu', this.callbackOnMenu, option);
    this.target.ownerDocument.addEventListener('drop', this.callbackOnMouse, option);
  }

  private removeEventListeners() {
    let option: EventListenerOptions = {
      capture: this.option.capture
    }
    this.target.ownerDocument.removeEventListener('mousemove', this.callbackOnMouse, option);
    this.target.ownerDocument.removeEventListener('mouseup', this.callbackOnMouse, option);
    this.target.ownerDocument.removeEventListener('touchmove', this.callbackOnTouch, option);
    this.target.ownerDocument.removeEventListener('touchend', this.callbackOnTouch, option);
    this.target.ownerDocument.removeEventListener('touchcancel', this.callbackOnTouch, option);
    this.target.ownerDocument.removeEventListener('contextmenu', this.callbackOnMenu, option);
    this.target.ownerDocument.removeEventListener('drop', this.callbackOnMouse, option);
  }
}
