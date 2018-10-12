import { AudioFile } from './core/file-storage/audio-file';
import { AudioPlayer } from './core/file-storage/audio-player';
import { AudioStorage } from './core/file-storage/audio-storage';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { GameObject, ObjectContext } from './core/synchronize-object/game-object';
import { EventSystem } from './core/system/system';

@SyncObject('jukebox')
export class Jukebox extends GameObject {
  @SyncVar() audioIdentifier: string = '';
  @SyncVar() startTime: number = 0;
  @SyncVar() isLoop: boolean = false;
  @SyncVar() isPlaying: boolean = false;

  get audio(): AudioFile { return AudioStorage.instance.get(this.audioIdentifier); }

  private audioPlayer: AudioPlayer = new AudioPlayer();

  // override
  destroy() {
    super.destroy();
    this._stop();
  }

  play(identifier: string, isLoop: boolean = false) {
    let audio = AudioStorage.instance.get(identifier);
    if (!audio) return;
    this.audioIdentifier = identifier;
    this.isPlaying = true;
    this.isLoop = isLoop;
    this._play();
  }

  private _play() {
    if (!this.isPlaying) return;
    let audio = this.audio;
    EventSystem.unregister(this, 'UPDATE_AUDIO_RESOURE');
    if (!audio || !audio.isReady) {
      EventSystem.register(this)
        .on('UPDATE_AUDIO_RESOURE', -100, event => {
          this.play(this.audioIdentifier, this.isLoop);
        });
      return;
    }
    this.audioPlayer.loop = true;
    this.audioPlayer.play(audio);
  }

  stop() {
    this.audioIdentifier = '';
    this.isPlaying = false;
    this._stop();
  }

  private _stop() {
    this.audioPlayer.stop();
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
