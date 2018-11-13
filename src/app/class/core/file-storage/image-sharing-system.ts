import { UUID } from '../synchronize-object/uuid';
import { EventSystem, Network } from '../system/system';
import { BufferSharingTask } from './buffer-sharing-task';
import { FileReaderUtil } from './file-reader-util';
import { ImageContext, ImageFile, ImageState } from './image-file';
import { Catalog, ImageStorage } from './image-storage';
import { MimeType } from './mime-type';

export class FileSharingSystem {
  private static _instance: FileSharingSystem
  static get instance(): FileSharingSystem {
    if (!FileSharingSystem._instance) FileSharingSystem._instance = new FileSharingSystem();
    return FileSharingSystem._instance;
  }

  private taskMap: Map<string, BufferSharingTask<ImageContext[]>> = new Map();
  private maxTransmission: number = 1;

  private constructor() {
    console.log('FileSharingSystem ready...');
  }

  initialize() {
    EventSystem.register(this)
      .on('OPEN_OTHER_PEER', 1, event => {
        if (!event.isSendFromSelf) return;
        console.log('OPEN_OTHER_PEER ImageStorageService !!!', event.data.peer);
        ImageStorage.instance.synchronize();
      })
      .on('XML_LOADED', event => {
        convertUrlImage(event.data.xmlElement);
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        if (event.isSendFromSelf) return;
        console.log('SYNCHRONIZE_FILE_LIST ImageStorageService ' + event.sendFrom);

        let otherCatalog: Catalog = event.data;
        let request: Catalog = [];

        for (let item of otherCatalog) {
          let image: ImageFile = ImageStorage.instance.get(item.identifier);
          if (image === null) {
            image = ImageFile.createEmpty(item.identifier);
            ImageStorage.instance.add(image);
          }
          if (image.state < ImageState.COMPLETE) {
            request.push({ identifier: item.identifier, state: image.state });
          }
        }

        if (request.length < 1 && otherCatalog.length < ImageStorage.instance.getCatalog().length) {
          ImageStorage.instance.synchronize(event.sendFrom);
        }

        if (request.length < 1 || this.isTransmission()) {
          return;
        }
        this.request(request, event.sendFrom);
      })
      .on('REQUEST_FILE_RESOURE', async event => {
        if (event.isSendFromSelf) return;

        let request: Catalog = event.data.identifiers;
        let randomRequest: Catalog = [];

        for (let item of request) {
          let image: ImageFile = ImageStorage.instance.get(item.identifier);
          if (item.state < image.state)
            randomRequest.push({ identifier: item.identifier, state: item.state });
        }

        if (this.isTransmission() === false && 0 < randomRequest.length) {
          // 送信
          let updateImages: ImageContext[] = this.makeSendUpdateImages(randomRequest);
          console.log('REQUEST_FILE_RESOURE ImageStorageService Send!!! ' + event.data.receiver + ' -> ' + updateImages.length);
          this.startSendTransmission(updateImages, event.data.receiver);
        } else {
          // 中継
          let candidatePeers: string[] = event.data.candidatePeers;
          let index = candidatePeers.indexOf(Network.peerId);
          if (-1 < index) candidatePeers.splice(index, 1);

          for (let peer of candidatePeers) {
            console.log('REQUEST_FILE_RESOURE ImageStorageService Relay!!! ' + peer + ' -> ' + event.data.identifiers);
            EventSystem.call(event, peer);
            return;
          }
          console.log('REQUEST_FILE_RESOURE ImageStorageService あぶれた...' + event.data.receiver, randomRequest.length, this.taskMap);
        }
      })
      .on('UPDATE_FILE_RESOURE', event => {
        let updateImages: ImageContext[] = event.data.updateImages;
        console.log('UPDATE_FILE_RESOURE ImageStorageService ' + event.sendFrom + ' -> ', updateImages);
        for (let context of updateImages) {
          if (context.blob) context.blob = new Blob([context.blob], { type: context.type });
          if (context.thumbnail.blob) context.thumbnail.blob = new Blob([context.thumbnail.blob], { type: context.thumbnail.type });
          ImageStorage.instance.add(context);
        }
      })
      .on('START_FILE_TRANSMISSION', event => {
        let identifier = event.data.taskIdentifier
        console.log('START_FILE_TRANSMISSION ' + identifier);
        this.startReceiveTransmission(identifier);
      });
  }

  private destroy() {
    EventSystem.unregister(this);
  }

  private async startSendTransmission(updateImages: ImageContext[], sendTo: string) {
    let identifier = UUID.generateUuid();
    this.taskMap.set(identifier, null);
    EventSystem.call('START_FILE_TRANSMISSION', { taskIdentifier: identifier }, sendTo);

    /* hotfix issue #1 */
    for (let context of updateImages) {
      if (context.thumbnail.blob) {
        context.thumbnail.blob = <any>await FileReaderUtil.readAsArrayBufferAsync(context.thumbnail.blob);
      } else if (context.blob) {
        context.blob = <any>await FileReaderUtil.readAsArrayBufferAsync(context.blob);
      }
    }
    /* */

    let task = await BufferSharingTask.createSendTask(updateImages, sendTo, identifier);
    this.taskMap.set(task.identifier, task);

    task.onfinish = (task, data) => {
      this.stopTransmission(task.identifier);
      ImageStorage.instance.synchronize();
    }
    task.ontimeout = (task) => {
      this.stopTransmission(task.identifier);
      ImageStorage.instance.synchronize();
    }
  }

  private startReceiveTransmission(identifier: string) {
    this.stopTransmission(identifier);
    if (this.taskMap.has(identifier)) return;

    let task = BufferSharingTask.createReceiveTask<ImageContext[]>(identifier);
    this.taskMap.set(identifier, task);
    task.onfinish = (task, data) => {
      this.stopTransmission(task.identifier);
      EventSystem.trigger('UPDATE_FILE_RESOURE', { identifier: task.identifier, updateImages: data });
      ImageStorage.instance.synchronize();
    }
    task.ontimeout = (task) => {
      this.stopTransmission(task.identifier);
      ImageStorage.instance.synchronize();
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
    EventSystem.call('REQUEST_FILE_RESOURE', { identifiers: request, receiver: Network.peerId, candidatePeers: peers }, peer);
  }

  private makeSendUpdateImages(catalog: Catalog, maxSize: number = 1024 * 1024 * 0.5): ImageContext[] {
    let updateImages: ImageContext[] = [];
    let byteSize: number = 0;

    // Fisher-Yates
    for (let i = catalog.length - 1; 0 <= i; i--) {
      let rand = Math.floor(Math.random() * (i + 1));
      [catalog[i], catalog[rand]] = [catalog[rand], catalog[i]];
    }

    catalog.sort((a, b) => {
      if (a.state < b.state) return -1;
      if (a.state > b.state) return 1;
      return 0;
    });

    for (let i = 0; i < catalog.length; i++) {
      let item: { identifier: string, state: number } = catalog[i];
      let image: ImageFile = ImageStorage.instance.get(item.identifier);

      let context: ImageContext = {
        identifier: image.identifier,
        name: image.name,
        type: '',
        blob: null,
        url: null,
        thumbnail: { type: '', blob: null, url: null, }
      };

      if (image.state === ImageState.URL) {
        context.url = image.url;
      } else if (item.state === ImageState.NULL) {
        context.thumbnail.blob = image.thumbnail.blob;//
        context.thumbnail.type = image.thumbnail.type;
      } else {
        context.blob = image.blob;//
        context.type = image.blob.type;
      }

      let size = context.blob
        ? context.blob.size
        : context.thumbnail.blob
          ? context.thumbnail.blob.size
          : 100;

      if (0 < byteSize && maxSize < byteSize + size) break;

      updateImages.push(context);
      byteSize += size;
    }
    return updateImages;
  }

  private isTransmission(): boolean {
    if (this.maxTransmission <= this.taskMap.size) {
      return true;
    } else {
      return false;
    }
  }
}

function convertUrlImage(xmlElement: Element) {
  let urls: string[] = [];

  let imageElements = xmlElement.querySelectorAll('*[type="image"]');
  for (let i = 0; i < imageElements.length; i++) {
    let url = imageElements[i].innerHTML;
    if (!ImageStorage.instance.get(url) && 0 < MimeType.type(url).length) {
      urls.push(url);
    }
  }

  imageElements = xmlElement.querySelectorAll('*[imageIdentifier]');
  for (let i = 0; i < imageElements.length; i++) {
    let url = imageElements[i].getAttribute('imageIdentifier');
    if (!ImageStorage.instance.get(url) && 0 < MimeType.type(url).length) {
      urls.push(url);
    }
  }
  for (let url of urls) {
    ImageStorage.instance.add(url)
  }
}
