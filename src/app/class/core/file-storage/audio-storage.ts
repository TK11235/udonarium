import { AudioFile, AudioFileContext } from './audio-file';
import { AudioSharingSystem } from './audio-sharing-system';
import { EventSystem } from '../system/system';

export class AudioStorage {
  private static _instance: AudioStorage
  static get instance(): AudioStorage {
    if (!AudioStorage._instance) AudioStorage._instance = new AudioStorage();
    return AudioStorage._instance;
  }

  private static _audioContext: AudioContext
  static get audioContext(): AudioContext {
    if (!AudioStorage._audioContext) {
      AudioStorage._audioContext = new AudioContext();
    }
    return AudioStorage._audioContext;
  }//

  static get volume(): number { return AudioStorage.masterGainNode.gain.value; }
  static set volume(volume: number) { AudioStorage.masterGainNode.gain.value = volume; }

  static get auditionVolume(): number { return AudioStorage.auditionGainNode.gain.value; }
  static set auditionVolume(auditionVolume: number) { AudioStorage.auditionGainNode.gain.value = auditionVolume; }

  private static _masterGainNode: GainNode
  private static get masterGainNode(): GainNode {
    if (!AudioStorage._masterGainNode) {
      let masterGain = AudioStorage.audioContext.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(AudioStorage.audioContext.destination);
      AudioStorage._masterGainNode = masterGain;

    }
    return AudioStorage._masterGainNode;
  }

  private static _auditionGainNode: GainNode
  private static get auditionGainNode(): GainNode {
    if (!AudioStorage._auditionGainNode) {
      let auditionGain = AudioStorage.audioContext.createGain();
      auditionGain.gain.value = 0.5;
      auditionGain.connect(AudioStorage.audioContext.destination);
      AudioStorage._auditionGainNode = auditionGain;

    }
    return AudioStorage._auditionGainNode;
  }

  private static _rootNode: AudioNode
  static get rootNode(): AudioNode {
    if (!AudioStorage._rootNode) {
      AudioStorage._rootNode = AudioStorage.masterGainNode;;

    }
    return AudioStorage._rootNode;
  }

  private static _auditionNode: AudioNode
  static get auditionNode(): AudioNode {
    if (!AudioStorage._auditionNode) {
      AudioStorage._auditionNode = AudioStorage.auditionGainNode;;

    }
    return AudioStorage._auditionNode;
  }

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
    window.addEventListener('beforeunload', event => {
      this.destroy();
    });
    this.initializeContext();
  }

  private destroy() {
    for (let identifier in this.hash) {
      this.delete(identifier);
    }
    if (AudioStorage._audioContext) {
      AudioStorage._audioContext.close();
    }
  }

  async addAsync(file: File): Promise<AudioFile>
  async addAsync(blob: Blob): Promise<AudioFile>
  async addAsync(arg: any): Promise<AudioFile> {
    let image: AudioFile = await AudioFile.createAsync(arg);

    return this._add(image);
  }

  add(url: string): AudioFile
  add(image: AudioFile): AudioFile
  add(context: AudioFileContext): AudioFile
  add(arg: any): AudioFile {
    let image: AudioFile
    if (typeof arg === 'string') {
      image = AudioFile.create(arg);
    } else if (arg instanceof AudioFile) {
      image = arg;
    } else {
      if (this.update(arg)) return this.hash[arg.identifier];
      image = AudioFile.create(arg);
    }
    return this._add(image);
  }

  private _add(image: AudioFile): AudioFile {
    //FileSharingSystem.instance.lazySynchronize(100);
    AudioSharingSystem.instance.lazySynchronize(100);
    if (this.update(image)) return this.hash[image.identifier];
    this.hash[image.identifier] = image;
    console.log('addNewFile()', image);
    return image;
  }

  private update(image: AudioFile): boolean
  private update(image: AudioFileContext): boolean
  private update(image: any): boolean {
    let context: AudioFileContext;
    if (image instanceof AudioFile) {
      context = image.toContext();
    } else {
      context = image;
    }
    let updatingImage: AudioFile = this.hash[image.identifier];
    if (updatingImage) {
      updatingImage.apply(image);
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
    let image: AudioFile = this.hash[identifier];
    if (image) return image;
    return null;
  }

  play(identifier: string, isLoop: boolean = false) {
    let audio = this.get(identifier);
    if (!audio) return;
    this.createBufferSourceAsync(identifier).then(() => {
      this.stop(identifier);
      if (audio.buffer) {
        audio.isPlaying = true;
        let source = AudioStorage.audioContext.createBufferSource();
        source.buffer = audio.buffer;
        source.onended = () => {
          console.log('audio has finished playing. ' + audio.name);
          this.stop(audio.identifier);
        }
        source.connect(AudioStorage.auditionNode);
        source.loop = isLoop;
        source.start(0);
        audio.source = source;
        EventSystem.call('PLAY_AUDIO', { identifier: audio.identifier });
        console.log('audio has started. ' + audio.name);
      }
    });
  }

  stop(identifier: string) {
    let audio = this.get(identifier);
    if (!audio) return;
    if (audio.source) {
      audio.isPlaying = false;
      audio.source.onended = null;
      audio.source.stop(0);
      audio.source = null;
      EventSystem.call('STOP_AUDIO', { identifier: audio.identifier });
      console.log('audio has stoped. ' + audio.name);
    }
  }

  private async createBufferSourceAsync(identifier: string): Promise<{}> {
    return new Promise((resolve, reject) => {
      let audio = this.get(identifier);
      if (!audio || audio.buffer) {
        resolve();
        return;
      }
      console.log('createBufferSourceAsync...');
      let reader = new FileReader();
      reader.onload = event => {
        AudioStorage.audioContext.decodeAudioData(reader.result).then((decodedData) => {
          audio.buffer = decodedData;
          resolve();
        }).catch(reason => {
          console.warn(reason);
          resolve();
        });
      }
      reader.onabort = reader.onerror = () => {
        resolve();
      }
      reader.readAsArrayBuffer(audio.blob);
    });
  }

  private initializeContext() {
    let callback = () => {
      let context = AudioStorage.audioContext;
      let buf = context.createBuffer(1, 1, 22050);
      let src = context.createBufferSource();
      src.buffer = buf;
      src.connect(context.destination);
      src.start(0);
      document.removeEventListener('click', callback);
    }
    document.addEventListener('click', callback);
  }
}
setTimeout(function () { AudioStorage.instance; }, 0);
