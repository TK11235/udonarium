import { EventSystem } from '../system/system';
import { AudioFile, AudioFileContext, AudioState } from './audio-file';

interface ChankData {
  index: number;
  length: number;
  chank: Blob;
}

// 試験実装中
export class FileSharingTask {
  private file: AudioFile;
  private sendTo: string = '';
  private chanks: Blob[] = [];
  private chankSize: number = 14 * 1024;
  private sendChankTimer: NodeJS.Timer;

  get identifier(): string { return this.file.identifier; }

  onfinish: (task: FileSharingTask) => void;
  ontimeout: (task: FileSharingTask) => void;

  private timeoutTimer: NodeJS.Timer;

  private constructor(file: AudioFile, sendTo?: string) {
    this.file = file;
    this.sendTo = sendTo;
  }

  static createSendTask(file: AudioFile, sendTo: string): FileSharingTask {
    let task = new FileSharingTask(file, sendTo);
    task.initializeSend();
    return task;
  }

  static createReceiveTask(file: AudioFile): FileSharingTask {
    let task = new FileSharingTask(file);
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
    while (offset < this.file.blob.size) {
      let chank: Blob = null;
      if (offset + this.chankSize < this.file.blob.size) {
        chank = this.file.blob.slice(offset, offset + this.chankSize);
      } else {
        chank = this.file.blob.slice(offset, this.file.blob.size);
      }
      this.chanks.push(chank);
      offset += this.chankSize;
    }
    let blob = new Blob(this.chanks, { type: this.file.blob.type });
    console.warn('ファイル末尾 ', this.chanks);
    this.sendChank(0);
  }

  private sendChank(index: number) {
    this.sendChankTimer = setTimeout(() => {
      EventSystem.call('FILE_SEND_CHANK_' + this.file.identifier, { index: index, length: this.chanks.length, chank: this.chanks[index] }, this.sendTo);
      if (index + 1 < this.chanks.length) {
        this.sendChank(index + 1);
      } else {
        EventSystem.call('FILE_SEND_END_' + this.file.identifier, { type: this.file.blob.type }, this.sendTo);
        console.warn('ファイル送信完了', this.file);
        if (this.onfinish) this.onfinish(this);
      }
    }, 0);
  }

  private initializeReceive() {
    this.setTimeout();
    /*
    let context = this.file.toContext();
    context.name = '待機…';
    this.file.apply(context);
    */
    EventSystem.register(this)
      .on<ChankData>('FILE_SEND_CHANK_' + this.file.identifier, 0, event => {
        this.chanks[event.data.index] = event.data.chank;
        //this.chanks.push(event.data.chank);
        let context = this.file.toContext();
        context.name = (event.data.index * 100 / event.data.length).toFixed(1) + '%';
        this.file.apply(context);
        this.setTimeout();
      }).on('FILE_SEND_END_' + this.file.identifier, 0, event => {
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        EventSystem.unregister(this);
        let context = this.file.toContext();
        context.blob = new Blob(this.chanks, { type: event.data.type });
        this.file.apply(context);
        if (this.onfinish) this.onfinish(this);
        this.cancel();
      });
  }

  private setTimeout() {
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      /*
      let context = this.file.toContext();
      context.name = 'タイムアウト'
      this.file.apply(context);
      if (this.ontimeout) this.ontimeout(this);
      */
      this.cancel();
    }, 10 * 1000);
  }
}