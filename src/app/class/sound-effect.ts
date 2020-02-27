import { ChatMessage, ChatMessageContext } from './chat-message';
import { AudioFile } from './core/file-storage/audio-file';
import { AudioPlayer, VolumeType } from './core/file-storage/audio-player';
import { AudioStorage } from './core/file-storage/audio-storage';
import { SyncObject } from './core/synchronize-object/decorator';
import { GameObject } from './core/synchronize-object/game-object';
import { ObjectStore } from './core/synchronize-object/object-store';
import { EventSystem } from './core/system';

export class PresetSound {
  static dicePick: string = '';
  static dicePut: string = '';
  static diceRoll1: string = '';
  static diceRoll2: string = '';
  static cardDraw: string = '';
  static cardPick: string = '';
  static cardPut: string = '';
  static cardShuffle: string = '';
  static piecePick: string = '';
  static piecePut: string = '';
  static blockPick: string = '';
  static blockPut: string = '';
  static lock: string = '';
  static unlock: string = '';
  static sweep: string = '';
}

@SyncObject('sound-effect')
export class SoundEffect extends GameObject {
  readonly sfxPlayer: AudioPlayer = new AudioPlayer();
  // GameObject Lifecycle
  onStoreAdded() {
    super.onStoreAdded();
    this.sfxPlayer.volumeType = VolumeType.SOUND_EFFECT;
    EventSystem.register(this)
      .on<string>('SOUND_EFFECT', event => {
        this.sfxPlayer.play(AudioStorage.instance.get(event.data));
      })
      .on('SEND_MESSAGE', event => {
        let chatMessage = ObjectStore.instance.get<ChatMessage>(event.data.messageIdentifier);
        if (!chatMessage || !chatMessage.isSendFromSelf || !chatMessage.isDicebot) return;
        if (Math.random() < 0.5) {
          SoundEffect.play(PresetSound.diceRoll1);
        } else {
          SoundEffect.play(PresetSound.diceRoll2);
        }
      });
  }

  // GameObject Lifecycle
  onStoreRemoved() {
    super.onStoreRemoved();
    EventSystem.unregister(this);
  }

  play(identifier: string)
  play(audio: AudioFile)
  play(arg: any) {
    SoundEffect.play(arg);
  }

  static play(identifier: string)
  static play(audio: AudioFile)
  static play(arg: any) {
    let identifier = '';
    if (typeof arg === 'string') {
      identifier = arg;
    } else {
      identifier = arg.identifier;
    }
    SoundEffect._play(identifier);
  }

  private static _play(identifier: string) {
    EventSystem.call('SOUND_EFFECT', identifier);
  }
}
