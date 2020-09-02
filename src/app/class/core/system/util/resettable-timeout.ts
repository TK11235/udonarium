type TimerCallback = (...args: any[]) => void;

export class ResettableTimeout {
  private callback: TimerCallback;
  private timerMilliSecond: number = 0;
  private timeoutDate: number = 0;
  private timeoutTimer: NodeJS.Timer;

  constructor(callback: TimerCallback, ms: number) {
    this.callback = callback;
    this.timerMilliSecond = ms;
    this.reset();
  }

  clear() {
    this.callback = null;
    this.timerMilliSecond = 0;
    this.timeoutDate = 0;
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = null;
  }

  reset(ms: number = this.timerMilliSecond) {
    this.timerMilliSecond = ms;
    let oldTimeoutDate = this.timeoutDate;
    this.timeoutDate = performance.now() + this.timerMilliSecond;

    if (this.timeoutTimer && oldTimeoutDate < this.timeoutDate) return;
    this.setTimeout();
  }

  private setTimeout() {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);

    this.timeoutTimer = setTimeout(() => {
      this.timeoutTimer = null;
      if (performance.now() < this.timeoutDate) {
        this.setTimeout();
      } else {
        if (this.callback) this.callback();
      }
    }, this.timeoutDate - performance.now());
  }
}
