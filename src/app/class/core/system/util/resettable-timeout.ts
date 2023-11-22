type TimerCallback = (...args: any[]) => void;

export class ResettableTimeout {
  private callback: TimerCallback;
  private timerMilliSecond: number = 0;
  private timeoutDate: number = 0;
  private timeoutTimer: NodeJS.Timeout;
  private isStopped: boolean = false;

  get isActive(): boolean { return this.timeoutTimer != null; }

  constructor(callback: TimerCallback, ms: number, activate: boolean = true) {
    this.callback = callback;
    this.timerMilliSecond = ms;
    if (activate) this.reset();
  }

  stop() {
    this.isStopped = true;
  }

  clear() {
    this.callback = null;
    this.timerMilliSecond = 0;
    this.timeoutDate = 0;
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = null;
    this.isStopped = false;
  }

  reset()
  reset(ms: number)
  reset(callback: TimerCallback, ms: number)
  reset(...args: any[]) {
    if (args.length === 1) {
      this.timerMilliSecond = args[0];
    } else if (1 < args.length) {
      this.callback = args[0];
      this.timerMilliSecond = args[1];
    }
    this.isStopped = false;

    let oldTimeoutDate = this.timeoutDate;
    this.timeoutDate = performance.now() + this.timerMilliSecond;

    if (this.timeoutTimer && oldTimeoutDate <= this.timeoutDate) return;
    this.setTimeout();
  }

  private setTimeout() {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = null;
    if (!this.callback) return;

    this.timeoutTimer = setTimeout(() => {
      this.timeoutTimer = null;
      if (this.isStopped) return;

      if (performance.now() < this.timeoutDate) {
        this.setTimeout();
      } else {
        if (this.callback) this.callback();
      }
    }, this.timeoutDate - performance.now());
  }
}
