import * as MessagePack from 'msgpack-lite';

import { EventSystem } from '../system';
import { setZeroTimeout } from '../system/util/zero-timeout';
import { FileReaderUtil } from './file-reader-util';

interface ChankData {
  index: number;
  length: number;
  chank: Uint8Array;
}

export class BufferSharingTask<T> {
  private _identifier: string;
  get identifier(): string { return this._identifier };
  private _sendTo: string;
  get sendTo(): string { return this._sendTo };

  private data: T;
  private uint8Array: Uint8Array;
  private chanks: Uint8Array[] = [];
  private chankSize: number = 32 * 1024;
  private chankReceiveCount: number = 0;
  private sendChankTimer: number;

  private sentChankIndex = 0;
  private completedChankIndex = 0;

  private startTime = 0;

  onprogress: (task: BufferSharingTask<T>, loded: number, total: number) => void;
  onfinish: (task: BufferSharingTask<T>, data: T) => void;
  ontimeout: (task: BufferSharingTask<T>) => void;
  oncancel: (task: BufferSharingTask<T>) => void;

  private timeoutTimer: NodeJS.Timer;

  private constructor(data?: T, sendTo?: string) {
    this.data = data;
    this.uint8Array = MessagePack.encode(data);
    this._sendTo = sendTo;
  }

  static async createSendTask<T>(data: T, sendTo: string, identifier?: string): Promise<BufferSharingTask<T>> {
    let task = new BufferSharingTask(data, sendTo);
    task._identifier = identifier != null ? identifier : await FileReaderUtil.calcSHA256Async(task.uint8Array);
    task.initializeSend();
    return task;
  }

  static createReceiveTask<T>(identifier: string): BufferSharingTask<T> {
    let task = new BufferSharingTask<T>();
    task._identifier = identifier;
    task.initializeReceive();
    return task;
  }

  cancel() {
    this.dispose();
    if (this.oncancel) this.oncancel(this);
  }

  private dispose() {
    EventSystem.unregister(this);
    clearTimeout(this.sendChankTimer);
    clearTimeout(this.timeoutTimer);
    this.onprogress = this.onfinish = this.ontimeout = this.oncancel = null;
  }

  private initializeSend() {
    let offset = 0;
    let byteLength = this.uint8Array.byteLength;
    while (offset < byteLength) {
      let chank: Uint8Array = null;
      if (offset + this.chankSize < byteLength) {
        chank = this.uint8Array.slice(offset, offset + this.chankSize);
      } else {
        chank = this.uint8Array.slice(offset, byteLength);
      }
      this.chanks.push(chank);
      offset += this.chankSize;
    }
    console.log('チャンク分割 ' + this.identifier, this.chanks.length);

    EventSystem.register(this)
      .on<number>('FILE_MORE_CHANK_' + this.identifier, 0, event => {
        if (this.sendTo !== event.sendFrom) return;
        this.completedChankIndex = event.data;
        if (this.sendChankTimer == null) {
          clearTimeout(this.timeoutTimer);
          this.sendChank(this.sentChankIndex + 1);
        }
      })
      .on('CLOSE_OTHER_PEER', 0, event => {
        if (event.data.peer !== this.sendTo) return;
        console.warn('送信キャンセル', this, event.data.peer);
        if (this.ontimeout) this.ontimeout(this);
        if (this.onfinish) this.onfinish(this, this.data);
        this.dispose();
      });
    this.sentChankIndex = this.completedChankIndex = 0;
    setZeroTimeout(() => this.sendChank(0));
  }

  private sendChank(index: number) {
    let data = { index: index, length: this.chanks.length, chank: this.chanks[index] };
    EventSystem.call('FILE_SEND_CHANK_' + this.identifier, data, this.sendTo);
    this.sentChankIndex = index;
    if (this.chanks.length <= index + 1) {
      EventSystem.call('FILE_SEND_END_' + this.identifier, null, this.sendTo);
      console.log('バッファ送信完了', this.identifier);
      if (this.onfinish) this.onfinish(this, this.data);
      this.dispose();
    } else if (this.completedChankIndex + 4 <= index) {
      this.sendChankTimer = null;
      this.resetTimeout();
    } else {
      this.sendChankTimer = setZeroTimeout(() => { this.sendChank(this.sentChankIndex + 1); });
    }
  }

  private initializeReceive() {
    this.resetTimeout();
    this.startTime = performance.now();
    this.chankReceiveCount = 0;
    EventSystem.register(this)
      .on<ChankData>('FILE_SEND_CHANK_' + this.identifier, 0, event => {
        if (this.chanks.length < 1) this.chanks = new Array(event.data.length);

        if (this.chanks[event.data.index] != null) {
          console.log(`already received. [${event.data.index}] <${this.identifier}>`);
          return;
        }
        this.chankReceiveCount++;
        this.chanks[event.data.index] = event.data.chank;
        if (this.onprogress) this.onprogress(this, event.data.index, event.data.length);
        if (this.chanks.length <= this.chankReceiveCount) {
          this.finishReceive();
        } else {
          this.resetTimeout();
          if ((event.data.index + 1) % 1 === 0) {
            EventSystem.call('FILE_MORE_CHANK_' + this.identifier, event.data.index, event.sendFrom);
          }
        }
      });
  }

  private finishReceive() {
    console.log('バッファ受信完了', this.identifier);
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    EventSystem.unregister(this);

    let sumLength = 0;
    for (let chank of this.chanks) { sumLength += chank.byteLength; }

    let time = performance.now() - this.startTime;
    let rate = (sumLength / 1024 / 1024) / (time / 1000);
    console.log(`${(sumLength / 1024).toFixed(2)}KB ${(time / 1000).toFixed(2)}秒 転送速度: ${rate.toFixed(2)}MB/s`);

    let uint8Array = new Uint8Array(sumLength);
    let pos = 0;

    for (let chank of this.chanks) {
      uint8Array.set(chank, pos);
      pos += chank.byteLength;
    }

    this.data = MessagePack.decode(uint8Array);
    if (this.onfinish) this.onfinish(this, this.data);
    this.dispose();
  }

  private resetTimeout() {
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      if (this.ontimeout) this.ontimeout(this);
      if (this.onfinish) this.onfinish(this, this.data);
      this.dispose();
    }, 15 * 1000);
  }
}
