import { EventSystem, Network } from '../system/system';
import { AudioFile, AudioFileContext, AudioState } from './audio-file';
import { AudioSharingTask } from './audio-sharing-task';
import { AudioStorage, Catalog } from './audio-storage';

export class AudioSharingSystem {
  private static _instance: AudioSharingSystem
  static get instance(): AudioSharingSystem {
    if (!AudioSharingSystem._instance) AudioSharingSystem._instance = new AudioSharingSystem();
    return AudioSharingSystem._instance;
  }

  private taskMap: Map<string, AudioSharingTask> = new Map();
  private maxTransmission: number = 1;

  private constructor() { }

  initialize() {
    console.log('AudioSharingSystem ready...');
    this.destroy();
    EventSystem.register(this)
      .on('OPEN_OTHER_PEER', -1, event => {
        if (!event.isSendFromSelf) return;
        console.log('OPEN_OTHER_PEER AudioStorageService !!!', event.data.peer);
        AudioStorage.instance.synchronize();
      })
      .on('SYNCHRONIZE_AUDIO_LIST', event => {
        if (event.isSendFromSelf) return;
        console.log('SYNCHRONIZE_AUDIO_LIST ' + event.sendFrom);

        let otherCatalog: Catalog = event.data;
        let request: Catalog = [];

        console.log('SYNCHRONIZE_AUDIO_LIST active tasks ', this.taskMap.size);
        for (let item of otherCatalog) {
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          if (audio === null) {
            audio = AudioFile.createEmpty(item.identifier);
            AudioStorage.instance.add(audio);
          }
          if (audio.state < AudioState.COMPLETE && !this.taskMap.has[item.identifier]) {
            request.push({ identifier: item.identifier, state: audio.state });
          }
        }

        if (request.length < 1 && otherCatalog.length < AudioStorage.instance.getCatalog().length) {
          AudioStorage.instance.synchronize(event.sendFrom);
        }

        if (request.length < 1 || this.isTransmission()) {
          return;
        }
        let index = Math.floor(Math.random() * request.length);
        this.request([request[index]], event.sendFrom);
      })
      .on('REQUEST_AUDIO_RESOURE', event => {
        if (event.isSendFromSelf) return;

        let request: Catalog = event.data.identifiers;
        let randomRequest: Catalog = [];

        for (let item of request) {
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          if (item.state < audio.state) randomRequest.push({ identifier: item.identifier, state: item.state });
        }

        if (this.isTransmission() === false && 0 < randomRequest.length) {
          // 送信
          console.log('REQUEST_AUDIO_RESOURE Send!!! ' + event.data.receiver + ' -> ' + randomRequest);
          let index = Math.floor(Math.random() * randomRequest.length);
          let item: { identifier: string, state: number } = randomRequest[index];
          this.startSendTransmission(item.identifier, event.data.receiver);
        } else {
          // 中継
          let candidatePeers: string[] = event.data.candidatePeers;
          let index = candidatePeers.indexOf(Network.peerId);
          if (-1 < index) candidatePeers.splice(index, 1);

          for (let peer of candidatePeers) {
            console.log('REQUEST_AUDIO_RESOURE AudioStorageService Relay!!! ' + peer + ' -> ' + event.data.identifiers);
            EventSystem.call(event, peer);
          }
          console.log('REQUEST_FILE_RESOURE ImageStorageService あぶれた...' + event.data.receiver, randomRequest.length, this.taskMap);
        }
      })
      .on('STOP_AUDIO_TRANSMISSION', event => {
        let identifier: string = event.data.identifier;
        this.stopTransmission(identifier);
        AudioStorage.instance.synchronize();
        console.log('STOP_AUDIO_TRANSMISSION ' + identifier, this.taskMap.size);
      })
      .on('UPDATE_AUDIO_RESOURE', event => {
        let updateAudios: AudioFileContext[] = event.data;
        console.log('UPDATE_AUDIO_RESOURE AudioStorageService ' + event.sendFrom + ' -> ', updateAudios);
        for (let context of updateAudios) {
          if (context.blob) context.blob = new Blob([context.blob], { type: context.type });
          AudioStorage.instance.add(context);
        }
      })
      .on('START_AUDIO_TRANSMISSION', event => {
        console.log('START_AUDIO_TRANSMISSION ' + event.data.fileIdentifier, this.isTransmission());
        let identifier: string = event.data.fileIdentifier;
        if (this.isTransmission() || this.taskMap.has(identifier)) {
          EventSystem.call('STOP_AUDIO_TRANSMISSION', { identifier: identifier }, event.sendFrom);
        } else {
          this.startReceiveTransmission(identifier);
        }
      });
  }

  private destroy() {
    EventSystem.unregister(this);
  }

  private startSendTransmission(identifier: string, sendTo: string) {
    let audio: AudioFile = AudioStorage.instance.get(identifier);

    EventSystem.call('START_AUDIO_TRANSMISSION', { fileIdentifier: audio.identifier }, sendTo);
    let task = AudioSharingTask.createSendTask(audio, sendTo);
    this.taskMap.set(audio.identifier, task);

    task.onfinish = (target) => {
      this.stopTransmission(task.identifier);
      let context: AudioFileContext = { identifier: audio.identifier, name: audio.name, type: null, blob: null, url: null };
      EventSystem.call('UPDATE_AUDIO_RESOURE', [context], sendTo);
      AudioStorage.instance.synchronize();
    }
    task.ontimeout = (target) => {
      this.stopTransmission(task.identifier);
      AudioStorage.instance.synchronize();
    }
  }

  private startReceiveTransmission(identifier: string) {
    this.stopTransmission(identifier);
    if (this.taskMap.has(identifier)) return;

    let audio: AudioFile = AudioStorage.instance.get(identifier);
    let task = AudioSharingTask.createReceiveTask(audio);
    this.taskMap.set(identifier, task);
    task.onfinish = () => {
      this.stopTransmission(task.identifier);
      AudioStorage.instance.synchronize();
    }
    task.ontimeout = () => {
      this.stopTransmission(task.identifier);
      AudioStorage.instance.synchronize();
    }
    console.log('startFileTransmission => ', this.taskMap.size);
  }

  private stopTransmission(identifier: string) {
    let task = this.taskMap.get(identifier);
    if (task) { task.cancel(); }
    this.taskMap.delete(identifier);

    console.log('stopFileTransmission => ', this.taskMap.size);
  }

  private request(request: Catalog, peer: string) {
    console.log('requestFile() ' + peer);
    let peers = Network.peerIds;
    peers.splice(peers.indexOf(Network.peerId), 1);
    EventSystem.call('REQUEST_AUDIO_RESOURE', { identifiers: request, receiver: Network.peerId, candidatePeers: peers }, peer);
  }

  private isTransmission(): boolean {
    if (this.maxTransmission <= this.taskMap.size) {
      return true;
    } else {
      return false;
    }
  }
}
