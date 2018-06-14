import * as CryptoJS from 'crypto-js/core.js';
import * as WordArray from 'crypto-js/lib-typedarrays.js';
import * as SHA256 from 'crypto-js/sha256.js';
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

  private _isPlaying: boolean = false;
  get isPlaying(): boolean { return this._isPlaying };
  set isPlaying(isPlaying: boolean) { this._isPlaying = isPlaying };

  buffer: AudioBuffer = null;
  source: AudioBufferSourceNode = null;

  get state(): AudioState {
    if (!this.url && !this.blob) return AudioState.NULL;
    if (this.url && !this.blob) return AudioState.URL;
    return AudioState.COMPLETE;
  }

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
      return await AudioFile._createAsync(new Blob([arg.slice()], { type: arg.type }), arg.name);
    } else if (arg instanceof Blob) {
      return await AudioFile._createAsync(arg);
    }
  }

  private static async _createAsync(blob: Blob, name?: string): Promise<AudioFile> {
    let audio = new AudioFile();
    audio.context.name = name;
    audio.context.blob = blob;
    audio.context.url = window.URL.createObjectURL(blob);

    try {
      audio.context.identifier = await AudioFile.calHashAsync(blob);
    } catch (e) {
      throw e;
    }

    if (!audio.context.name) audio.context.name = audio.context.identifier;

    return audio;
  }

  destroy() {
    if (this.source) this.source.stop();
  }

  apply(context: AudioFileContext) {
    if (!this.context.identifier && context.identifier) this.context.identifier = context.identifier;
    //if (!this.context.name && context.name) this.context.name = context.name;
    if (context.name) this.context.name = context.name;
    if (!this.context.blob && context.blob) this.context.blob = context.blob;
    if (!this.context.type && context.type) this.context.type = context.type;
    if (!this.context.url && context.url) {
      if (this.state !== AudioState.URL) window.URL.revokeObjectURL(this.context.url);
      this.context.url = context.url;
    }
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

  private static async calHashAsync(blob: Blob): Promise<string> {
    let wordArray = WordArray.create(await FileReaderUtil.readAsArrayBufferAsync(blob));
    let hash: string = SHA256(<any>wordArray, 'key').toString();
    console.log('calHashAsync => ' + hash);
    return hash;
  }
}