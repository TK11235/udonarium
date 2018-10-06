import { EventSystem } from '../system/system';
import { AudioFile, AudioFileContext, AudioState } from './audio-file';
import { FileReaderUtil } from './file-reader-util';

interface ChankData {
  index: number;
  length: number;
  chank: Blob;
}

// 試験実装中
export class AudioSharingTask {
  private file: AudioFile;
  private sendTo: string = '';
  private chanks: Blob[] = [];
  private chankSize: number = 14 * 1024;
  private sendChankTimer: NodeJS.Timer;

  private sentChankLength = 0;
  private completedChankLength = 0;

  get identifier(): string { return this.file.identifier; }

  onfinish: (task: AudioSharingTask) => void;
  ontimeout: (task: AudioSharingTask) => void;

  private timeoutTimer: NodeJS.Timer;

  private constructor(file: AudioFile, sendTo?: string) {
    this.file = file;
    this.sendTo = sendTo;
  }

  static createSendTask(file: AudioFile, sendTo: string): AudioSharingTask {
    let task = new AudioSharingTask(file, sendTo);
    task.initializeSend();
    return task;
  }

  static createReceiveTask(file: AudioFile): AudioSharingTask {
    let task = new AudioSharingTask(file);
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
    console.log('チャンク分割 ' + this.file.identifier, this.chanks.length);

    EventSystem.register(this)
      .on<number>('FILE_MORE_CHANK_' + this.file.identifier, 0, event => {
        if (this.sendTo !== event.sendFrom) return;
        this.completedChankLength = event.data;
        if (this.sendChankTimer == null) {
          clearTimeout(this.timeoutTimer);
          this.sendChank(this.sentChankLength);
        }
      });

    this.sentChankLength = this.completedChankLength = 0;
    this.sendChank(0);
  }

  private sendChank(index: number) {
    this.sendChankTimer = setTimeout(async () => {
      let data = { index: index, length: this.chanks.length, chank: this.chanks[index] };

      /* hotfix issue #1 */
      data.chank = <any>await FileReaderUtil.readAsArrayBufferAsync(data.chank);
      /* */

      EventSystem.call('FILE_SEND_CHANK_' + this.file.identifier, data, this.sendTo);
      this.sentChankLength = index;
      if (this.completedChankLength + 16 <= index + 1) {
        console.log('waitSendChank... ', this.completedChankLength);
        this.sendChankTimer = null;
        this.setTimeout();
      } else if (index + 1 < this.chanks.length) {
        this.sendChank(index + 1);
      } else {
        EventSystem.call('FILE_SEND_END_' + this.file.identifier, { type: this.file.blob.type }, this.sendTo);
        console.warn('ファイル送信完了', this.file);
        if (this.onfinish) this.onfinish(this);
        this.cancel();
      }
    }, 0);
  }

  private initializeReceive() {
    this.setTimeout();
    EventSystem.register(this)
      .on<ChankData>('FILE_SEND_CHANK_' + this.file.identifier, 0, event => {
        this.chanks[event.data.index] = event.data.chank;
        /* */
        let context = this.file.toContext();
        context.name = (event.data.index * 100 / event.data.length).toFixed(1) + '%';
        this.file.apply(context);
        /* */

        this.setTimeout();
        if ((event.data.index + 1) % 8 === 0) {
          EventSystem.call('FILE_MORE_CHANK_' + this.file.identifier, event.data.index + 1, event.sendFrom);
        }
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
      if (this.ontimeout) this.ontimeout(this);
      if (this.onfinish) this.onfinish(this);
      this.cancel();
    }, 10 * 1000);
  }
}
