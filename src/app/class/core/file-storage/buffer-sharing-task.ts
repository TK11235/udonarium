import * as MessagePack from 'msgpack-lite';

import { EventSystem } from '../system/system';
import { FileReaderUtil } from './file-reader-util';
import { setZeroTimeout } from '../system/util/zero-timeout';

interface ChankData {
  index: number;
  length: number;
  chank: ArrayBuffer;
}

export class BufferSharingTask<T> {
  private _identifier: string;
  get identifier(): string { return this._identifier };
  private _sendTo: string;
  get sendTo(): string { return this._sendTo };

  private data: T;
  private arrayBuffer: ArrayBuffer;
  private chanks: ArrayBuffer[] = [];
  private chankSize: number = 8 * 1024;
  private sendChankTimer: number;

  private sentChankLength = 0;
  private completedChankLength = 0;

  onprogress: (task: BufferSharingTask<T>, loded: number, total: number) => void;
  onfinish: (task: BufferSharingTask<T>, data: T) => void;
  ontimeout: (task: BufferSharingTask<T>) => void;

  private timeoutTimer: NodeJS.Timer;

  private constructor(data?: T, sendTo?: string) {
    this.data = data;
    this.arrayBuffer = <ArrayBuffer>MessagePack.encode(data).buffer;
    this._sendTo = sendTo;
  }

  static async createSendTask<T>(data: T, sendTo: string, identifier?: string): Promise<BufferSharingTask<T>> {
    let task = new BufferSharingTask(data, sendTo);
    task._identifier = identifier != null ? identifier : await FileReaderUtil.calcSHA256Async(task.arrayBuffer);
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
    EventSystem.unregister(this);
    clearTimeout(this.sendChankTimer);
    clearTimeout(this.timeoutTimer);
    this.onfinish = this.ontimeout = null;
  }

  private initializeSend() {
    let offset = 0;
    let byteLength = this.arrayBuffer.byteLength;
    while (offset < byteLength) {
      let chank: ArrayBuffer = null;
      if (offset + this.chankSize < byteLength) {
        chank = this.arrayBuffer.slice(offset, offset + this.chankSize);
      } else {
        chank = this.arrayBuffer.slice(offset, byteLength);
      }
      this.chanks.push(chank);
      offset += this.chankSize;
    }
    console.log('チャンク分割 ' + this.identifier, this.arrayBuffer, this.chanks.length);

    EventSystem.register(this)
      .on<number>('FILE_MORE_CHANK_' + this.identifier, 0, event => {
        if (this.sendTo !== event.sendFrom) return;
        this.completedChankLength = event.data;
        if (this.sendChankTimer == null) {
          clearTimeout(this.timeoutTimer);
          this.sendChank(this.sentChankLength + 1);
        }
      })
      .on('CLOSE_OTHER_PEER', 0, event => {
        if (event.data.peer !== this.sendTo) return;
        console.warn('送信キャンセル', this, event.data.peer);
        if (this.ontimeout) this.ontimeout(this);
        if (this.onfinish) this.onfinish(this, this.data);
        this.cancel();
      });
    this.sentChankLength = this.completedChankLength = 0;
    setZeroTimeout(() => this.sendChank(0));
  }

  private sendChank(index: number) {
    let data = { index: index, length: this.chanks.length, chank: this.chanks[index] };
    EventSystem.call('FILE_SEND_CHANK_' + this.identifier, data, this.sendTo);
    this.sentChankLength = index;
    if (this.chanks.length <= index + 1) {
      EventSystem.call('FILE_SEND_END_' + this.identifier, null, this.sendTo);
      console.log('バッファ送信完了', this.identifier);
      if (this.onfinish) this.onfinish(this, this.data);
      this.cancel();
    } else if (this.completedChankLength + 8 <= index + 1) {
      this.sendChankTimer = null;
      this.resetTimeout();
    } else {
      this.sendChankTimer = setZeroTimeout(() => { this.sendChank(this.sentChankLength + 1); });
    }
  }

  private initializeReceive() {
    this.resetTimeout();
    let startTime = performance.now();
    EventSystem.register(this)
      .on<ChankData>('FILE_SEND_CHANK_' + this.identifier, 0, event => {
        this.chanks[event.data.index] = event.data.chank;
        if (this.onprogress) this.onprogress(this, event.data.index, event.data.length);
        this.resetTimeout();
        if ((event.data.index + 1) % 4 === 0) {
          EventSystem.call('FILE_MORE_CHANK_' + this.identifier, event.data.index, event.sendFrom);
        }
      })
      .on('FILE_SEND_END_' + this.identifier, 0, event => {
        console.log('バッファ受信完了', this.identifier);
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        EventSystem.unregister(this);

        let sumLength = 0;
        this.chanks.forEach(chank => sumLength += chank.byteLength);

        let time = performance.now() - startTime;
        let rate = (sumLength / 1024 / 1024) / (time / 1000);
        console.log(`${(time / 1000).toFixed(2)}秒 転送速度: ${rate.toFixed(2)}MB/s`);

        let uint8Array = new Uint8Array(sumLength);
        let pos = 0;

        this.chanks.forEach(chank => {
          uint8Array.set(new Uint8Array(chank), pos);
          pos += chank.byteLength;
        });

        this.data = MessagePack.decode(uint8Array);
        if (this.onfinish) this.onfinish(this, this.data);
        this.cancel();
      });
  }

  private resetTimeout() {
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      if (this.ontimeout) this.ontimeout(this);
      if (this.onfinish) this.onfinish(this, this.data);
      this.cancel();
    }, 15 * 1000);
  }
}
