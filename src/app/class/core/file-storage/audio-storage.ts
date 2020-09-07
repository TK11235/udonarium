import { EventSystem } from '../system';
import { AudioFile, AudioFileContext, AudioState } from './audio-file';

export type CatalogItem = { readonly identifier: string, readonly state: number };

export class AudioStorage {
  private static _instance: AudioStorage
  static get instance(): AudioStorage {
    if (!AudioStorage._instance) AudioStorage._instance = new AudioStorage();
    return AudioStorage._instance;
  }

  private lazyTimer: NodeJS.Timer;
  private hash: { [identifier: string]: AudioFile } = {};

  get audios(): AudioFile[] {
    let audios: AudioFile[] = [];
    for (let identifier in this.hash) {
      audios.push(this.hash[identifier]);
    }
    return audios;
  }

  private constructor() {
    console.log('AudioStorage ready...');
  }

  private destroy() {
    for (let identifier in this.hash) {
      this.delete(identifier);
    }
  }

  async addAsync(file: File): Promise<AudioFile>
  async addAsync(blob: Blob): Promise<AudioFile>
  async addAsync(arg: any): Promise<AudioFile> {
    let audio: AudioFile = await AudioFile.createAsync(arg);

    return this._add(audio);
  }

  add(url: string): AudioFile
  add(audio: AudioFile): AudioFile
  add(context: AudioFileContext): AudioFile
  add(arg: any): AudioFile {
    let audio: AudioFile;
    if (typeof arg === 'string') {
      audio = AudioFile.create(arg);
    } else if (arg instanceof AudioFile) {
      audio = arg;
    } else {
      if (this.update(arg)) return this.hash[arg.identifier];
      audio = AudioFile.create(arg);
    }
    return this._add(audio);
  }

  private _add(audio: AudioFile): AudioFile {
    if (AudioState.COMPLETE <= audio.state) this.lazySynchronize(100);
    if (this.update(audio)) return this.hash[audio.identifier];
    this.hash[audio.identifier] = audio;
    console.log('add Audio: ' + audio.identifier);
    return audio;
  }

  private update(audio: AudioFile): boolean
  private update(audio: AudioFileContext): boolean
  private update(audio: any): boolean {
    let context: AudioFileContext;
    if (audio instanceof AudioFile) {
      context = audio.toContext();
    } else {
      context = audio;
    }
    let updateAudio: AudioFile = this.hash[audio.identifier];
    if (updateAudio) {
      updateAudio.apply(audio);
      return true;
    }
    return false;
  }

  delete(identifier: string): boolean {
    let audio: AudioFile = this.hash[identifier];
    if (audio) {
      audio.destroy();
      delete this.hash[identifier];
      return true;
    }
    return false;
  }

  get(identifier: string): AudioFile {
    let audio: AudioFile = this.hash[identifier];
    if (audio) return audio;
    return null;
  }

  synchronize(peer?: string) {
    if (this.lazyTimer) clearTimeout(this.lazyTimer);
    this.lazyTimer = null;
    EventSystem.call('SYNCHRONIZE_AUDIO_LIST', this.getCatalog(), peer);
  }

  lazySynchronize(ms: number, peer?: string) {
    if (this.lazyTimer) clearTimeout(this.lazyTimer);
    this.lazyTimer = setTimeout(() => {
      this.lazyTimer = null;
      this.synchronize(peer);
    }, ms);
  }

  getCatalog(): CatalogItem[] {
    let catalog: CatalogItem[] = [];
    for (let audio of AudioStorage.instance.audios) {
      if (AudioState.COMPLETE <= audio.state) {
        catalog.push({ identifier: audio.identifier, state: audio.state });
      }
    }
    return catalog;
  }
}
