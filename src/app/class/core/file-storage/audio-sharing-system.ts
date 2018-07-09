import { EventSystem, Event, Network } from '../system/system';
import { AudioStorage, Catalog } from './audio-storage';
import { FileSharingTask } from './audio-sharing-task';
import { AudioFile, AudioFileContext, AudioState } from './audio-file';
import { MimeType } from './mime-type';

export class AudioSharingSystem {
  private static _instance: AudioSharingSystem
  static get instance(): AudioSharingSystem {
    if (!AudioSharingSystem._instance) AudioSharingSystem._instance = new AudioSharingSystem();
    return AudioSharingSystem._instance;
  }

  private transmissionTimers: { [fileIdentifier: string]: NodeJS.Timer } = {};
  private tasks: { [fileIdentifier: string]: FileSharingTask } = {};
  private maxTransmissionSize: number = 1024 * 1024 * 0.5;
  private maxTransmission: number = 1;

  private lazyTimer: NodeJS.Timer;

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

        console.warn('SYNCHRONIZE_AUDIO_LIST active tasks ', Object.keys(this.tasks).length);
        for (let item of otherCatalog) {
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          if (audio === null) {
            audio = AudioFile.createEmpty(item.identifier);
            AudioStorage.instance.add(audio);
          }
          if (audio.state < AudioState.COMPLETE && !this.tasks[item.identifier]) {
            request.push({ identifier: item.identifier, state: audio.state });
          }
        }

        if (request.length < 1 && otherCatalog.length < AudioStorage.instance.getCatalog().length) {
          AudioStorage.instance.synchronize(event.sendFrom);
        }

        if (request.length < 1 || this.isTransmission()) {
          return;
        }

        let min = 0;
        let max = request.length - 1;

        let index = Math.floor(Math.random() * (max + 1 - min)) + min;

        /*
        for (let item of request) {
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          let task = FileSharingTask.createReceiveTask(audio);
          task.onfinish = () => {
            task.cancel();
            this.tasks[item.identifier] = null;
            delete this.tasks[item.identifier];
            console.warn('ファイル受信完了', task.identifier);
          }
          task.ontimeout = () => {
            task.cancel();
            this.tasks[item.identifier] = null;
            delete this.tasks[item.identifier];
            console.warn('ファイル受信タイムアウト', task.identifier);
            this.synchronize();
          }
          this.tasks[item.identifier] = task;
        }
        */
        let item = request[index];
        let audio: AudioFile = AudioStorage.instance.get(item.identifier);
        let task = FileSharingTask.createReceiveTask(audio);
        task.onfinish = () => {
          task.cancel();
          this.tasks[item.identifier] = null;
          delete this.tasks[item.identifier];
          console.warn('ファイル受信完了', task.identifier);
        }
        task.ontimeout = () => {
          task.cancel();
          this.tasks[item.identifier] = null;
          delete this.tasks[item.identifier];
          console.warn('ファイル受信タイムアウト', task.identifier);
          AudioStorage.instance.synchronize();
        }
        this.tasks[item.identifier] = task;

        this.request([request[index]], event.sendFrom);
      })
      .on('REQUEST_AUDIO_RESOURE', event => {
        if (event.isSendFromSelf) return;

        let request: Catalog = event.data.identifiers;
        let randomRequest: { identifier: string, state: number, seed: number }[] = [];

        for (let item of request) {
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);
          if (item.state < audio.state)
            randomRequest.push({ identifier: item.identifier, state: item.state, seed: Math.random() });
        }

        if (this.isTransmission() === false && 0 < randomRequest.length) {
          // 送信
          console.log('REQUEST_AUDIO_RESOURE Send!!! ' + event.data.receiver + ' -> ' + randomRequest);

          let updateAudios: AudioFileContext[] = [];
          let byteSize: number = 0;

          randomRequest.sort((a, b) => {
            if (a.seed < b.seed) return -1;
            if (a.seed > b.seed) return 1;
            return 0;
          });

          randomRequest.sort((a, b) => {
            if (a.state < b.state) return -1;
            if (a.state > b.state) return 1;
            return 0;
          });

          //for (let i = 0; i < randomRequest.length; i++) {
          let item: { identifier: string, state: number } = randomRequest[0];//randomRequest[i];
          let audio: AudioFile = AudioStorage.instance.get(item.identifier);

          let context: AudioFileContext = { identifier: audio.identifier, name: audio.name, type: '', blob: null, url: null };

          if (audio.state === AudioState.URL) {
            context.url = audio.url;
          } else {
            //context.blob = audio.blob;
            context.type = audio.blob.type;
          }

          //if (0 < byteSize && context.blob && this.maxTransmissionSize < byteSize + context.blob.size) break;

          console.log(item);
          console.log(context);

          updateAudios.push(context);
          byteSize += context.blob ? context.blob.size : 100;
          // }

          for (let i = 1; i < randomRequest.length; i++) {
            EventSystem.call('STOP_AUDIO_TRANSMISSION', { identifier: randomRequest[i].identifier }, event.data.receiver);
          }

          this.startTransmission(updateAudios[0].identifier, event.sendFrom);
          EventSystem.call('START_AUDIO_TRANSMISSION', { fileIdentifier: updateAudios[0].identifier }, event.data.receiver);
          let task = FileSharingTask.createSendTask(audio, event.data.receiver);
          task.onfinish = (target) => {
            EventSystem.call('UPDATE_AUDIO_RESOURE', updateAudios, event.data.receiver);
          }
        } else {
          // 中継
          let candidatePeers: string[] = event.data.candidatePeers;
          let index = candidatePeers.indexOf(Network.peerId);
          if (-1 < index) candidatePeers.splice(index, 1);

          if (candidatePeers.length < 1) {
            console.log('STOP_AUDIO_TRANSMISSION AudioStorageService STOP!!! ' + event.data.receiver + ' -> ' + event.data.identifiers);
            let request: Catalog = event.data.identifiers;
            for (let i = 0; i < request.length; i++) {
              EventSystem.call('STOP_AUDIO_TRANSMISSION', { identifier: request[i].identifier }, event.data.receiver);
            }
          } else {
            console.log('REQUEST_AUDIO_RESOURE AudioStorageService Relay!!! ' + candidatePeers[0] + ' -> ' + event.data.identifiers);
            EventSystem.call(event, candidatePeers[0]);
          }
        }
      })
      .on('STOP_AUDIO_TRANSMISSION', event => {
        /*
        let request: Catalog = event.data.identifiers;

        for (let item of request) {
          let task = this.tasks[item.identifier];
          if (task) task.cancel();
          this.tasks[item.identifier] = null;
          delete this.tasks[item.identifier];
        }
        */

        let identifier: string = event.data.identifier;
        let task = this.tasks[identifier];
        if (task) {
          task.cancel();
          this.tasks[identifier] = null;
          delete this.tasks[identifier];
          /*
          let audio: AudioFile = AudioStorage.instance.get(identifier);
          let context = audio.toContext();
          context.name = 'キャンセル';
          audio.apply(context);
          */
        }

        console.log('STOP_AUDIO_TRANSMISSION ' + identifier, Object.keys(this.tasks).length);
      })
      .on('UPDATE_AUDIO_RESOURE', event => {
        let updateAudios: AudioFileContext[] = event.data;
        console.log('UPDATE_AUDIO_RESOURE AudioStorageService ' + event.sendFrom + ' -> ', updateAudios);
        for (let context of updateAudios) {
          if (context.blob) context.blob = new Blob([context.blob], { type: context.type });
          AudioStorage.instance.add(context);
        }
        this.stopTransmission(updateAudios[0].identifier);
        AudioStorage.instance.synchronize();
        EventSystem.call('COMPLETE_AUDIO_TRANSMISSION', { fileIdentifier: updateAudios[0].identifier }, event.sendFrom);
      })
      .on('START_AUDIO_TRANSMISSION', event => {
        console.log('START_AUDIO_TRANSMISSION ' + event.data.fileIdentifier);
        this.startTransmission(event.data.fileIdentifier, event.sendFrom);
      })
      .on('COMPLETE_AUDIO_TRANSMISSION', event => {
        console.log('COMPLETE_AUDIO_TRANSMISSION ' + event.data.fileIdentifier);
        this.stopTransmission(event.data.fileIdentifier);
        if (!event.isSendFromSelf) AudioStorage.instance.synchronize();
      })
      .on('TIMEOUT_AUDIO_TRANSMISSION', event => {
        console.log('TIMEOUT_AUDIO_TRANSMISSION ' + event.data.fileIdentifier);
        this.stopTransmission(event.data.fileIdentifier);
      })
  }

  private destroy() {
    EventSystem.unregister(this);
  }

  private startTransmission(identifier: string, sendFrom: string) {
    this.stopTransmission(identifier);

    this.transmissionTimers[identifier] = setTimeout(() => {
      EventSystem.call('TIMEOUT_AUDIO_TRANSMISSION', { fileIdentifier: identifier }, Network.peerId);
      this.stopTransmission(identifier);
    }, 30 * 1000);

    EventSystem.register(this.transmissionTimers[identifier])
      .on('CLOSE_OTHER_PEER', 0, event => {
        console.warn('送信キャンセル', event.data.peer);
        EventSystem.call('TIMEOUT_AUDIO_TRANSMISSION', { fileIdentifier: identifier }, Network.peerId);
        this.stopTransmission(identifier);
      });
    console.log('startFileTransmission => ', Object.keys(this.transmissionTimers).length);
  }

  private stopTransmission(identifier: string) {
    if (!this.transmissionTimers[identifier]) return;

    EventSystem.unregister(this.transmissionTimers[identifier]);
    clearTimeout(this.transmissionTimers[identifier]);

    this.transmissionTimers[identifier] = null;
    delete this.transmissionTimers[identifier];

    console.log('stopFileTransmission => ', Object.keys(this.transmissionTimers).length);
  }

  private request(request: Catalog, peer: string) {
    console.log('requestFile() ' + peer);
    let peers = Network.peerIds;
    peers.splice(peers.indexOf(Network.peerId), 1);
    EventSystem.call('REQUEST_AUDIO_RESOURE', { identifiers: request, receiver: Network.peerId, candidatePeers: peers }, peer);
  }

  private isTransmission(): boolean {
    if (this.maxTransmission <= Object.keys(this.transmissionTimers).length) {
      return true;
    } else {
      return false;
    }
  }
}
