type Callback = (srcEvent: TouchEvent | MouseEvent | PointerEvent) => void;

export class ObjectInteractGesture {
  private hammer: HammerManager = new Hammer.Manager(this.targetElement, { inputClass: Hammer.TouchMouseInput });
  private isEnable = true;

  onstart: Callback = null;
  oninteract: Callback = null;

  constructor(readonly targetElement: HTMLElement) {
    this.initializeHammer();
  }

  cancel() {
    this.isEnable = false;
  }

  destroy() {
    this.hammer.destroy();
  }

  private initializeHammer() {
    let tap2 = new Hammer.Tap({ event: 'tap2', taps: 2 });
    this.hammer.add([tap2]);
    this.hammer.on('hammer.input', this.onHammer.bind(this));
    this.hammer.on('tap2', this.onInteract.bind(this));
  }

  private onHammer(ev: HammerInput) {
    if (!ev.isFirst) return;
    let isSubButton = ev.srcEvent instanceof MouseEvent && (ev.srcEvent.button !== 0 || ev.srcEvent.ctrlKey || ev.srcEvent.shiftKey);
    this.isEnable = !isSubButton;
    if (this.isEnable && this.onstart) this.onstart(ev.srcEvent);
  }

  private onInteract(ev: HammerInput) {
    if (this.isEnable && this.oninteract) this.oninteract(ev.srcEvent);
  }
}
