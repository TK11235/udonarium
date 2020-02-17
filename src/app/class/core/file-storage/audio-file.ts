import { FileReaderUtil } from './file-reader-util';

export enum AudioState {
  NULL = 0,
  THUMBNAIL = 1,
  COMPLETE = 2,
  URL = 1000,
}

export interface AudioFileContext {
  identifier: string;
  name: string;
  type: string;
  blob: Blob;
  url: string;
}

export class AudioFile {
  private context: AudioFileContext = {
    identifier: '',
    name: '',
    blob: null,
    type: '',
    url: ''
  };

  get identifier(): string { return this.context.identifier };
  get name(): string { return this.context.name };
  get blob(): Blob { return this.context.blob; };
  get url(): string { return this.context.url; };
  get isReady(): boolean { return AudioState.NULL < this.state; }
  get state(): AudioState {
    if (!this.url && !this.blob) return AudioState.NULL;
    if (this.url && !this.blob) return AudioState.URL;
    return AudioState.COMPLETE;
  }

  isHidden: boolean = false;

  private constructor() { }

  static createEmpty(identifier: string): AudioFile {
    let audio = new AudioFile();
    audio.context.identifier = identifier;

    return audio;
  }

  static create(url: string): AudioFile
  static create(context: AudioFileContext): AudioFile
  static create(arg: any): AudioFile {
    if (typeof arg === 'string') {
      let audio = new AudioFile();
      audio.context.identifier = arg;
      audio.context.name = arg;
      audio.context.url = arg;
      return audio;
    } else {
      let audio = new AudioFile();
      audio.apply(arg);
      return audio;
    }
  }

  static async createAsync(file: File): Promise<AudioFile>
  static async createAsync(blob: Blob): Promise<AudioFile>
  static async createAsync(arg: any): Promise<AudioFile> {
    if (arg instanceof File) {
      return await AudioFile._createAsync(arg, arg.name);
    } else if (arg instanceof Blob) {
      return await AudioFile._createAsync(arg);
    }
  }

  private static async _createAsync(blob: Blob, name?: string): Promise<AudioFile> {
    let arrayBuffer = await FileReaderUtil.readAsArrayBufferAsync(blob);

    let audio = new AudioFile();
    audio.context.identifier = await FileReaderUtil.calcSHA256Async(arrayBuffer);
    audio.context.name = name;
    audio.context.blob = new Blob([arrayBuffer], { type: blob.type });
    audio.context.type = audio.context.blob.type;
    audio.context.url = window.URL.createObjectURL(audio.context.blob);

    if (!audio.context.name) audio.context.name = audio.context.identifier;

    return audio;
  }

  destroy() {
    this.revokeURLs();
  }

  apply(context: AudioFileContext) {
    if (!this.context.identifier && context.identifier) this.context.identifier = context.identifier;
    if (context.name) this.context.name = context.name;
    if (!this.context.blob && context.blob) this.context.blob = context.blob;
    if (!this.context.type && context.type) this.context.type = context.type;
    if (!this.context.url && context.url) {
      if (this.state !== AudioState.URL) window.URL.revokeObjectURL(this.context.url);
      this.context.url = context.url;
    }
    this.createURLs();
  }

  private createURLs() {
    if (this.state === AudioState.URL) return;
    if (this.context.blob && this.context.url === '') this.context.url = window.URL.createObjectURL(this.context.blob);
  }

  private revokeURLs() {
    if (this.state === AudioState.URL) return;
    window.URL.revokeObjectURL(this.context.url);
  }

  toContext(): AudioFileContext {
    return {
      identifier: this.context.identifier,
      name: this.context.name,
      blob: this.context.blob,
      type: this.context.type,
      url: this.context.url
    }
  }
}