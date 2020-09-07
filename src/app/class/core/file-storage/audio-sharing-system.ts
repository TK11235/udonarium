import { EventSystem, Network } from '../system';
import { AudioFile, AudioFileContext, AudioState } from './audio-file';
import { AudioStorage, CatalogItem } from './audio-storage';
import { BufferSharingTask } from './buffer-sharing-task';
import { FileReaderUtil } from './file-reader-util';

export class AudioSharingSystem {
  private static _instance: AudioSharingSystem
  static get instance(): AudioSharingSystem {
    if (!AudioSharingSystem._instance) AudioSharingSystem._instance = new AudioSharingSystem();
    return AudioSharingSystem._instance;
  }

  private sendTaskMap: Map<string, BufferSharingTask<AudioFileContext>> = new Map();
  private receiveTaskMap: Map<string, BufferSharingTask<AudioFileContext>> = new Map();
  private maxSendTransmission: number = 1;
  private maxReceiveTransmission: number = 4;

  private constructor() { }

  initialize() {
    console.log('AudioSharingSystem ready...');
    this.destroy();
    EventSystem.register(this)
      .on('CONNECT_PEER', -1, event => {
        if (!event.isSendFromSelf) return;
        console.log('CONNECT_PEER AudioStorageService !!!', event.data.peer);
        AudioStorage.instance.synchronize();
      })
      .on('SYNCHRONIZE_AUDIO_LIST', event => {
        if (event.isSendFromSelf) return;
        console.log('SYNCHRONIZE_AUDIO_LIST ' + event.sendFrom);

        let otherCatalog: CatalogItem[] = event.data;
        let request: CatalogItem[] = [];

        console.log('SYNCHRONIZE_AUDIO_LIST active tasks ', this.sendTaskMap.size + this.receiveTaskMap.size);
        for (let item of otherCatalog) {
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          if (audio === null) {
            audio = AudioFile.createEmpty(item.identifier);
            AudioStorage.instance.add(audio);
          }
          if (audio.state < AudioState.COMPLETE && !this.receiveTaskMap.has(item.identifier)) {
            request.push({ identifier: item.identifier, state: audio.state });
          }
        }

        // Peer切断時などのエッジケースに対応する
        if (request.length < 1 && !this.hasActiveTask() && otherCatalog.length < AudioStorage.instance.getCatalog().length) {
          AudioStorage.instance.synchronize(event.sendFrom);
        }

        if (request.length < 1 || this.isReceiveTransmission()) {
          return;
        }
        let index = Math.floor(Math.random() * request.length);
        this.request([request[index]], event.sendFrom);
      })
      .on('REQUEST_AUDIO_RESOURE', event => {
        if (event.isSendFromSelf) return;

        let request: CatalogItem[] = event.data.identifiers;
        let randomRequest: CatalogItem[] = [];

        for (let item of request) {
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          if (audio && item.state < audio.state) randomRequest.push({ identifier: item.identifier, state: item.state });
        }

        if (this.isSendTransmission() === false && 0 < randomRequest.length) {
          // 送信
          console.log('REQUEST_AUDIO_RESOURE Send!!! ' + event.data.receiver + ' -> ' + randomRequest);
          let index = Math.floor(Math.random() * randomRequest.length);
          let item: { identifier: string, state: number } = randomRequest[index];
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          this.startSendTransmission(audio, event.data.receiver);
        } else {
          // 中継
          let candidatePeers: string[] = event.data.candidatePeers;
          let index = candidatePeers.indexOf(Network.peerId);
          if (-1 < index) candidatePeers.splice(index, 1);

          for (let peer of candidatePeers) {
            console.log('REQUEST_AUDIO_RESOURE AudioStorageService Relay!!! ' + peer + ' -> ' + event.data.identifiers);
            EventSystem.call(event, peer);
            return;
          }
          console.log('REQUEST_FILE_RESOURE AudioStorageService あぶれた...' + event.data.receiver, randomRequest.length);
        }
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
        console.log('START_AUDIO_TRANSMISSION ' + event.data.fileIdentifier);
        let identifier: string = event.data.fileIdentifier;
        let audio: AudioFile = AudioStorage.instance.get(identifier);
        if (this.receiveTaskMap.has(identifier) || (audio && AudioState.COMPLETE <= audio.state)) {
          console.warn('CANCEL_TASK_ ' + identifier);
          EventSystem.call('CANCEL_TASK_' + identifier, null, event.sendFrom);
        } else {
          this.startReceiveTransmission(identifier);
        }
      });
  }

  private destroy() {
    EventSystem.unregister(this);
  }

  private async startSendTransmission(audio: AudioFile, sendTo: string) {
    this.sendTaskMap.set(audio.identifier, null);

    EventSystem.call('START_AUDIO_TRANSMISSION', { fileIdentifier: audio.identifier }, sendTo);

    let context: AudioFileContext = {
      identifier: audio.identifier,
      name: audio.name,
      blob: null,
      type: '',
      url: null
    };

    if (audio.state === AudioState.URL) {
      context.url = audio.url;
    } else {
      context.blob = <any>await FileReaderUtil.readAsArrayBufferAsync(audio.blob);
      context.type = audio.blob.type;
    }

    let task = await BufferSharingTask.createSendTask(context, sendTo, audio.identifier);
    this.sendTaskMap.set(audio.identifier, task);

    task.onfinish = () => {
      this.stopSendTransmission(task.identifier);
      AudioStorage.instance.synchronize();
    }
  }

  private startReceiveTransmission(identifier: string) {
    let audio: AudioFile = AudioStorage.instance.get(identifier);
    let task = BufferSharingTask.createReceiveTask<AudioFileContext>(identifier);
    this.receiveTaskMap.set(identifier, task);

    task.onprogress = (task, loded, total) => {
      let context = audio.toContext();
      context.name = (loded * 100 / total).toFixed(1) + '%';
      audio.apply(context);
    }
    task.onfinish = (task, data) => {
      this.stopReceiveTransmission(task.identifier);
      if (data) EventSystem.trigger('UPDATE_AUDIO_RESOURE', [data]);
      AudioStorage.instance.synchronize();
    }
    console.log('startReceiveTransmission => ', this.receiveTaskMap.size);
  }

  private stopSendTransmission(identifier: string) {
    let task = this.sendTaskMap.get(identifier);
    if (task) { task.cancel(); }
    this.sendTaskMap.delete(identifier);

    console.log('stopSendTransmission => ', this.sendTaskMap.size);
  }

  private stopReceiveTransmission(identifier: string) {
    let task = this.receiveTaskMap.get(identifier);
    if (task) { task.cancel(); }
    this.receiveTaskMap.delete(identifier);

    console.log('stopReceiveTransmission => ', this.receiveTaskMap.size);
  }

  private request(request: CatalogItem[], peer: string) {
    console.log('requestFile() ' + peer);
    let peers = Network.peerIds;
    peers.splice(peers.indexOf(Network.peerId), 1);
    EventSystem.call('REQUEST_AUDIO_RESOURE', { identifiers: request, receiver: Network.peerId, candidatePeers: peers }, peer);
  }

  private hasActiveTask(): boolean {
    return 0 < this.sendTaskMap.size || 0 < this.receiveTaskMap.size;
  }

  private isSendTransmission(): boolean {
    return this.maxSendTransmission <= this.sendTaskMap.size;
  }

  private isReceiveTransmission(): boolean {
    return this.maxReceiveTransmission <= this.receiveTaskMap.size;
  }
}
