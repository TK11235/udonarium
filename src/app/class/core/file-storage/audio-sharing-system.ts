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
  private maxSendTask: number = 2;
  private maxReceiveTask: number = 4;

  private constructor() { }

  initialize() {
    console.log('AudioSharingSystem ready...');
    this.destroy();
    EventSystem.register(this)
      .on('CONNECT_PEER', -1, event => {
        if (!event.isSendFromSelf) return;
        console.log('CONNECT_PEER AudioStorageService !!!', event.data.peerId);
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

        if (request.length < 1 || this.isLimitReceiveTask()) {
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

        if (this.isLimitSendTask() === false && 0 < randomRequest.length && !this.existsSendTask(event.data.receiver)) {
          // 送信
          console.log('REQUEST_AUDIO_RESOURE Send!!! ' + event.data.receiver + ' -> ' + randomRequest);
          let index = Math.floor(Math.random() * randomRequest.length);
          let item: { identifier: string, state: number } = randomRequest[index];
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          this.startSendTask(audio, event.data.receiver);
        } else {
          // 中継
          let candidatePeers: string[] = event.data.candidatePeers;
          let index = candidatePeers.indexOf(Network.peerId);
          if (-1 < index) candidatePeers.splice(index, 1);

          for (let peerId of candidatePeers) {
            console.log('REQUEST_AUDIO_RESOURE AudioStorageService Relay!!! ' + peerId + ' -> ' + event.data.identifiers);
            EventSystem.call(event, peerId);
            return;
          }
          console.log('REQUEST_FILE_RESOURE AudioStorageService あぶれた...' + event.data.receiver, randomRequest.length);
        }
      })
      .on('UPDATE_AUDIO_RESOURE', 1000, event => {
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
          this.startReceiveTask(identifier);
        }
      });
  }

  private destroy() {
    EventSystem.unregister(this);
  }

  private async startSendTask(audio: AudioFile, sendTo: string) {
    let task = BufferSharingTask.createSendTask<AudioFileContext>(audio.identifier, sendTo);
    this.sendTaskMap.set(audio.identifier, task);

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

    task.onfinish = () => {
      this.stopSendTask(task.identifier);
      AudioStorage.instance.synchronize();
    }

    task.start(context);
  }

  private startReceiveTask(identifier: string) {
    let audio: AudioFile = AudioStorage.instance.get(identifier);
    let task = BufferSharingTask.createReceiveTask<AudioFileContext>(identifier);
    this.receiveTaskMap.set(identifier, task);

    task.onprogress = (task, loded, total) => {
      let context = audio.toContext();
      context.name = (loded * 100 / total).toFixed(1) + '%';
      audio.apply(context);
    }
    task.onfinish = (task, data) => {
      this.stopReceiveTask(task.identifier);
      if (data) EventSystem.trigger('UPDATE_AUDIO_RESOURE', [data]);
      AudioStorage.instance.synchronize();
    }

    task.start();
    console.log('startReceiveTask => ', this.receiveTaskMap.size);
  }

  private stopSendTask(identifier: string) {
    let task = this.sendTaskMap.get(identifier);
    if (task) { task.cancel(); }
    this.sendTaskMap.delete(identifier);

    console.log('stopSendTask => ', this.sendTaskMap.size);
  }

  private stopReceiveTask(identifier: string) {
    let task = this.receiveTaskMap.get(identifier);
    if (task) { task.cancel(); }
    this.receiveTaskMap.delete(identifier);

    console.log('stopReceiveTask => ', this.receiveTaskMap.size);
  }

  private request(request: CatalogItem[], peerId: string) {
    console.log('requestFile() ' + peerId);
    let peerIds = Network.peerIds;
    peerIds.splice(peerIds.indexOf(Network.peerId), 1);
    EventSystem.call('REQUEST_AUDIO_RESOURE', { identifiers: request, receiver: Network.peerId, candidatePeers: peerIds }, peerId);
  }

  private hasActiveTask(): boolean {
    return 0 < this.sendTaskMap.size || 0 < this.receiveTaskMap.size;
  }

  private isLimitSendTask(): boolean {
    return this.maxSendTask <= this.sendTaskMap.size;
  }

  private isLimitReceiveTask(): boolean {
    return this.maxReceiveTask <= this.receiveTaskMap.size;
  }

  private existsSendTask(peerId: string): boolean {
    for (let task of this.sendTaskMap.values()) {
      if (task && task.sendTo === peerId) return true;
    }
    return false;
  }
}
