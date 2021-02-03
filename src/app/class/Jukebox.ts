import { AudioFile } from './core/file-storage/audio-file';
import { AudioPlayer } from './core/file-storage/audio-player';
import { AudioStorage } from './core/file-storage/audio-storage';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { GameObject, ObjectContext } from './core/synchronize-object/game-object';
import { EventSystem } from './core/system';

@SyncObject('jukebox')
export class Jukebox extends GameObject {
  @SyncVar() audioIdentifier: string = '';
  @SyncVar() startTime: number = 0;
  @SyncVar() isLoop: boolean = false;
  @SyncVar() isPlaying: boolean = false;

  get audio(): AudioFile { return AudioStorage.instance.get(this.audioIdentifier); }

  private audioPlayer: AudioPlayer = new AudioPlayer();

  // GameObject Lifecycle
  onStoreAdded() {
    super.onStoreAdded();
    this.unlockAfterUserInteraction();
  }

  // GameObject Lifecycle
  onStoreRemoved() {
    super.onStoreRemoved();
    this._stop();
  }

  play(identifier: string, isLoop: boolean = false) {
    let audio = AudioStorage.instance.get(identifier);
    if (!audio || !audio.isReady) return;
    this.audioIdentifier = identifier;
    this.isPlaying = true;
    this.isLoop = isLoop;
    this._play();
  }

  private _play() {
    this._stop();
    if (!this.audio || !this.audio.isReady) {
      this.playAfterFileUpdate();
      return;
    }
    this.audioPlayer.loop = true;
    this.audioPlayer.play(this.audio);
  }

  stop() {
    this.audioIdentifier = '';
    this.isPlaying = false;
    this._stop();
  }

  private _stop() {
    this.unregisterEvent();
    this.audioPlayer.stop();
  }

  private playAfterFileUpdate() {
    EventSystem.register(this)
      .on('UPDATE_AUDIO_RESOURE', -100, event => {
        this._play();
      });
  }

  private unlockAfterUserInteraction() {
    let callback = () => {
      document.body.removeEventListener('touchstart', callback, true);
      document.body.removeEventListener('mousedown', callback, true);
      this.audioPlayer.stop();
      if (this.isPlaying) this._play();
    }
    document.body.addEventListener('touchstart', callback, true);
    document.body.addEventListener('mousedown', callback, true);
  }

  private unregisterEvent() {
    EventSystem.unregister(this, 'UPDATE_AUDIO_RESOURE');
  }

  // override
  apply(context: ObjectContext) {
    let audioIdentifier = this.audioIdentifier;
    let isPlaying = this.isPlaying;
    super.apply(context);
    if ((audioIdentifier !== this.audioIdentifier || !isPlaying) && this.isPlaying) {
      this._play();
    } else if (isPlaying !== this.isPlaying && !this.isPlaying) {
      this._stop();
    }
  }
}
