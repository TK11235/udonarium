import { GameTableMask } from './game-table-mask';
import { TabletopObject } from './tabletop-object';

import { AudioFile, AudioFileContext } from './core/file-storage/audio-file';
import { AudioStorage } from './core/file-storage/audio-storage';
import { Network, EventSystem } from './core/system/system';
import { ObjectStore } from './core/synchronize-object/object-store';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { GameObject, ObjectContext } from './core/synchronize-object/game-object';
import { FileReaderUtil } from './core/file-storage/file-reader-util';

@SyncObject('jukebox')
export class Jukebox extends GameObject {
  @SyncVar() audioIdentifier: string = '';
  @SyncVar() startTime: number = 0;
  @SyncVar() isLoop: boolean = false;
  @SyncVar() isPlaying: boolean = false;

  get audio(): AudioFile { return AudioStorage.instance.get(this.audioIdentifier); }

  private source: AudioBufferSourceNode = null;

  initialize(needUpdate: boolean = true) {
    super.initialize(needUpdate);
    EventSystem.register(this)
      .on('PLAY_BGM', 0, event => {
      })
      .on('STOP_BGM', 0, event => {
      });
  }

  play(identifier: string, isLoop: boolean = false) {
    let audio = AudioStorage.instance.get(identifier);
    if (!audio) return;
    this.stop();
    this.audioIdentifier = identifier;
    this.isPlaying = true;
    this.isLoop = isLoop;
    this._play();
  }

  private _play() {
    if (!this.isPlaying) return;
    let audio = AudioStorage.instance.get(this.audioIdentifier);
    EventSystem.unregister(this, 'UPDATE_AUDIO_RESOURE');
    if (!audio || !audio.isReady) {
      EventSystem.register(this)
        .on('UPDATE_AUDIO_RESOURE', -100, event => {
          this.stop();
          this.play(this.audioIdentifier, this.isLoop);
        });
      return;
    }
    AudioStorage.instance.createBufferSourceAsync(audio).then(() => {
      if (audio.buffer) {
        let source = AudioStorage.audioContext.createBufferSource();
        source.buffer = audio.buffer;
        source.onended = () => {
          console.log('Jukebox has finished playing. ');
          this.stop();
        }
        source.connect(AudioStorage.rootNode);
        source.loop = this.isLoop;
        source.start(0);
        this.source = source;
        console.log('Jukebox has started. ');
      }
    });
  }

  stop() {
    if (this.source) {
      this.audioIdentifier = '';
      this.isPlaying = false;
    }
    this._stop();
  }

  private _stop() {
    if (this.source) {
      this.source.onended = null;
      this.source.stop(0);
      this.source = null;
      console.log('Jukebox has stoped. ');
    }
  }

  // override
  apply(context: ObjectContext) {
    let audioIdentifier = this.audioIdentifier;
    let isPlaying = this.isPlaying;
    super.apply(context);
    if ((audioIdentifier !== this.audioIdentifier || !isPlaying) && this.isPlaying) {
      this._stop();
      this._play();
    } else if (this.isPlaying === false && isPlaying !== this.isPlaying) {
      this._stop();
    }
  }
}
