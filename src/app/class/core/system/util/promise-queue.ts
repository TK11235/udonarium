export class PromiseQueue {
  private queue: Promise<any> = Promise.resolve();

  _length: number = 0;
  get length(): number { return this._length; }

  constructor(readonly name: string = 'Queue') { }

  add<T>(task: () => T): Promise<T>
  add<T>(promise: PromiseLike<T>): Promise<T>
  add<T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>
  add<T>(arg: any): Promise<T> {
    this._length++
    console.log(`${this.name} add: ${this._length}`);
    if (typeof arg.then == 'function') {
      this.queue = this.queue.then(() => arg); // promise
    } else if (0 < arg.length) {
      this.queue = this.queue.then(() => new Promise<T>(arg)); // executor
    } else {
      this.queue = this.queue.then(arg); // task
    }

    let ret = this.queue;
    this.queue = this.queue.catch((reason) => {
      console.error(reason);
    });
    this.queue = this.queue.then(() => {
      this._length--;
      console.log(`${this.name} done: ${this._length}`);
    });
    return ret;
  }
}
