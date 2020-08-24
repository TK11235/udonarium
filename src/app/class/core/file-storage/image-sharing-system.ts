import { EventSystem, Network } from '../system';
import { UUID } from '../system/util/uuid';
import { BufferSharingTask } from './buffer-sharing-task';
import { FileReaderUtil } from './file-reader-util';
import { ImageContext, ImageFile, ImageState } from './image-file';
import { CatalogItem, ImageStorage } from './image-storage';
import { MimeType } from './mime-type';

export class ImageSharingSystem {
  private static _instance: ImageSharingSystem
  static get instance(): ImageSharingSystem {
    if (!ImageSharingSystem._instance) ImageSharingSystem._instance = new ImageSharingSystem();
    return ImageSharingSystem._instance;
  }

  private sendTaskMap: Map<string, BufferSharingTask<ImageContext[]>> = new Map();
  private receiveTaskMap: Map<string, BufferSharingTask<ImageContext[]>> = new Map();
  private maxSendTransmission: number = 1;
  private maxReceiveTransmission: number = 4;

  private constructor() {
    console.log('FileSharingSystem ready...');
  }

  initialize() {
    EventSystem.register(this)
      .on('CONNECT_PEER', 1, event => {
        if (!event.isSendFromSelf) return;
        console.log('CONNECT_PEER ImageStorageService !!!', event.data.peer);
        ImageStorage.instance.synchronize();
      })
      .on('XML_LOADED', event => {
        convertUrlImage(event.data.xmlElement);
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        if (event.isSendFromSelf) return;
        console.log('SYNCHRONIZE_FILE_LIST ImageStorageService ' + event.sendFrom);

        let otherCatalog: CatalogItem[] = event.data;
        let request: CatalogItem[] = [];

        for (let item of otherCatalog) {
          let image: ImageFile = ImageStorage.instance.get(item.identifier);
          if (image === null) {
            image = ImageFile.createEmpty(item.identifier);
            ImageStorage.instance.add(image);
          }
          if (image.state < ImageState.COMPLETE && !this.receiveTaskMap.has(item.identifier)) {
            request.push({ identifier: item.identifier, state: image.state });
          }
        }

        if (request.length < 1 || this.isReceiveTransmission()) {
          return;
        }
        this.request(request, event.sendFrom);
      })
      .on('REQUEST_FILE_RESOURE', async event => {
        if (event.isSendFromSelf) return;

        let request: CatalogItem[] = event.data.identifiers;
        let randomRequest: CatalogItem[] = [];

        for (let item of request) {
          let image: ImageFile = ImageStorage.instance.get(item.identifier);
          if (image && item.state < image.state)
            randomRequest.push({ identifier: item.identifier, state: item.state });
        }

        if (this.isSendTransmission() === false && 0 < randomRequest.length) {
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
          console.log('REQUEST_FILE_RESOURE ImageStorageService あぶれた...' + event.data.receiver, randomRequest.length);
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
        console.log('START_FILE_TRANSMISSION ' + event.data.taskIdentifier);
        let identifier = event.data.taskIdentifier;
        let image: ImageFile = ImageStorage.instance.get(identifier);
        if (this.receiveTaskMap.has(identifier) || (image && ImageState.COMPLETE <= image.state)) {
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

  private async startSendTransmission(updateImages: ImageContext[], sendTo: string) {
    let identifier = updateImages.length === 1 ? updateImages[0].identifier : UUID.generateUuid();
    this.sendTaskMap.set(identifier, null);
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
    this.sendTaskMap.set(task.identifier, task);

    task.onfinish = (task, data) => {
      this.stopSendTransmission(task.identifier);
      ImageStorage.instance.synchronize();
    }
  }

  private startReceiveTransmission(identifier: string) {
    let task = BufferSharingTask.createReceiveTask<ImageContext[]>(identifier);
    this.receiveTaskMap.set(identifier, task);
    task.onfinish = (task, data) => {
      this.stopReceiveTransmission(task.identifier);
      if (data) EventSystem.trigger('UPDATE_FILE_RESOURE', { identifier: task.identifier, updateImages: data });
      ImageStorage.instance.synchronize();
    }
    console.log('startFileTransmission => ', this.receiveTaskMap.size);
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
    EventSystem.call('REQUEST_FILE_RESOURE', { identifiers: request, receiver: Network.peerId, candidatePeers: peers }, peer);
  }

  private makeSendUpdateImages(catalog: CatalogItem[], maxSize: number = 1024 * 1024 * 0.5): ImageContext[] {
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

      updateImages.push(context);
      byteSize += size;
      if (maxSize < byteSize) break;
    }
    return updateImages;
  }

  private isSendTransmission(): boolean {
    return this.maxSendTransmission <= this.sendTaskMap.size;
  }

  private isReceiveTransmission(): boolean {
    return this.maxReceiveTransmission <= this.receiveTaskMap.size;
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
