import { ArrayBuffer } from '@angular/http/src/static_request';
import { EventSystem, Event, Network } from '../system/system';
import { FileStorage, Catalog } from './file-storage';
import { ImageFile, ImageContext, ImageState } from './image-file';
import { MimeType } from './mime-type';
import { XmlUtil } from '../synchronize-object/xml-util';

export class FileSharingSystem {
  private static _instance: FileSharingSystem
  static get instance(): FileSharingSystem {
    if (!FileSharingSystem._instance) FileSharingSystem._instance = new FileSharingSystem();
    return FileSharingSystem._instance;
  }

  private transmissionTimers: { [fileIdentifier: string]: NodeJS.Timer } = {};
  private maxTransmission: number = 1;

  private lazyTimer: NodeJS.Timer;

  private constructor() {
    console.log('FileSharingSystem ready...');
    window.addEventListener('beforeunload', event => {
      this.destroy();
    });
    EventSystem.register(this)
      .on('OPEN_OTHER_PEER', 1, event => {
        if (!event.isSendFromSelf) return;
        console.log('OPEN_OTHER_PEER FileStorageService !!!', event.data.peer);
        FileStorage.instance.synchronize();
      })
      .on('XML_PARSE', event => {
        let xml: string = event.data.xml;
        convertUrlImage(xml);
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        if (event.isSendFromSelf) return;
        console.log('SYNCHRONIZE_FILE_LIST FileStorageService ' + event.sendFrom);

        let otherCatalog: Catalog = event.data;
        let request: Catalog = [];

        for (let item of otherCatalog) {
          let image: ImageFile = FileStorage.instance.get(item.identifier);
          if (image === null) {
            image = ImageFile.createEmpty(item.identifier);
            FileStorage.instance.add(image);
          }
          if (image.state < ImageState.COMPLETE) {
            request.push({ identifier: item.identifier, state: image.state });
          }
        }

        if (request.length < 1 && otherCatalog.length < FileStorage.instance.getCatalog().length) {
          FileStorage.instance.synchronize(event.sendFrom);
        }

        if (request.length < 1 || this.isTransmission()) {
          return;
        }
        this.request(request, event.sendFrom);
      })
      .on('REQUEST_FILE_RESOURE', async event => {
        if (event.isSendFromSelf) return;

        let request: Catalog = event.data.identifiers;
        let randomRequest: { identifier: string, state: number, seed: number }[] = [];

        for (let item of request) {
          let image: ImageFile = FileStorage.instance.get(item.identifier);
          if (item.state < image.state)
            randomRequest.push({ identifier: item.identifier, state: item.state, seed: Math.random() });
        }

        if (this.isTransmission() === false && 0 < randomRequest.length) {
          // 送信
          console.log('REQUEST_FILE_RESOURE FileStorageService Send!!! ' + event.data.receiver + ' -> ' + randomRequest);

          let updateImages: ImageContext[] = [];
          let byteSize: number = 0;
          let maxSize = 1024 * 1024 * 0.5;

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

          for (let i = 0; i < randomRequest.length; i++) {
            let item: { identifier: string, state: number } = randomRequest[i];
            let image: ImageFile = FileStorage.instance.get(item.identifier);

            let context: ImageContext = { identifier: image.identifier, name: image.name, type: '', blob: null, url: null, thumbnail: { type: '', blob: null, url: null, } };

            if (image.state === ImageState.URL) {
              context.url = image.url;
            } else if (item.state === ImageState.NULL) {
              context.thumbnail.blob = image.thumbnail.blob;//
              context.thumbnail.type = image.thumbnail.type;
            } else {
              context.blob = image.blob;//
              context.type = image.blob.type;
            }

            //let updateImage: ImageFile = ImageFile.create(context);
            if (0 < byteSize && context.blob && maxSize < byteSize + context.blob.size) break;

            console.log(item);
            console.log(context);

            updateImages.push(context);
            byteSize += context.blob ? context.blob.size : 100;
          }

          this.startTransmission(updateImages[0].identifier, event.sendFrom);
          EventSystem.call('START_FILE_TRANSMISSION', { fileIdentifier: updateImages[0].identifier }, event.data.receiver);

          /* hotfix issue #1 */
          for (let context of updateImages) {
            if (context.thumbnail.blob) {
              context.thumbnail.blob = <any>await blobToArrayBuffer(context.thumbnail.blob);
            } else if (context.blob) {
              context.blob = <any>await blobToArrayBuffer(context.blob);
            }
          }
          /* */

          EventSystem.call('UPDATE_FILE_RESOURE', updateImages, event.data.receiver);
        } else {
          // 中継
          let candidatePeers: string[] = event.data.candidatePeers;
          let index = candidatePeers.indexOf(Network.peerId);
          if (-1 < index) candidatePeers.splice(index, 1);

          for (let peer of candidatePeers) {
            console.log('REQUEST_FILE_RESOURE FileStorageService Relay!!! ' + peer + ' -> ' + event.data.identifiers);
            EventSystem.call(event, peer);
            break;
          }
        }
      })
      .on('UPDATE_FILE_RESOURE', event => {
        let updateImages: ImageContext[] = event.data;
        console.log('UPDATE_FILE_RESOURE FileStorageService ' + event.sendFrom + ' -> ', updateImages);
        for (let context of updateImages) {
          if (context.blob) context.blob = new Blob([context.blob], { type: context.type });
          if (context.thumbnail.blob) context.thumbnail.blob = new Blob([context.thumbnail.blob], { type: context.thumbnail.type });
          FileStorage.instance.add(context);
        }
        this.stopTransmission(updateImages[0].identifier);
        FileStorage.instance.synchronize();
        EventSystem.call('COMPLETE_FILE_TRANSMISSION', { fileIdentifier: updateImages[0].identifier }, event.sendFrom);
      })
      .on('START_FILE_TRANSMISSION', event => {
        console.log('START_FILE_TRANSMISSION ' + event.data.fileIdentifier);
        this.startTransmission(event.data.fileIdentifier, event.sendFrom);
      })
      .on('COMPLETE_FILE_TRANSMISSION', event => {
        console.log('COMPLETE_FILE_TRANSMISSION ' + event.data.fileIdentifier);
        this.stopTransmission(event.data.fileIdentifier);
        if (!event.isSendFromSelf) FileStorage.instance.synchronize();
      })
      .on('TIMEOUT_FILE_TRANSMISSION', event => {
        console.log('TIMEOUT_FILE_TRANSMISSION ' + event.data.fileIdentifier);
        this.stopTransmission(event.data.fileIdentifier);
      })
  }

  private destroy() {
    EventSystem.unregister(this);
  }

  private startTransmission(identifier: string, sendFrom: string) {
    this.stopTransmission(identifier);

    this.transmissionTimers[identifier] = setTimeout(() => {
      EventSystem.call('TIMEOUT_FILE_TRANSMISSION', { fileIdentifier: identifier }, Network.peerId);
      this.stopTransmission(identifier);
    }, 30 * 1000);

    EventSystem.register(this.transmissionTimers[identifier])
      .on('CLOSE_OTHER_PEER', 0, event => {
        console.warn('送信キャンセル', event.data.peer);
        EventSystem.call('TIMEOUT_FILE_TRANSMISSION', { fileIdentifier: identifier }, Network.peerId);
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
    EventSystem.call('REQUEST_FILE_RESOURE', { identifiers: request, receiver: Network.peerId, candidatePeers: peers }, peer);
  }

  private isTransmission(): boolean {
    if (this.maxTransmission <= Object.keys(this.transmissionTimers).length) {
      return true;
    } else {
      return false;
    }
  }
}

function convertUrlImage(xml: string) {
  let xmlElement: Element = XmlUtil.xml2element(xml);
  let urls: string[] = [];
  if (!xmlElement) return;

  let imageElements = xmlElement.querySelectorAll('*[type="image"]');
  for (let i = 0; i < imageElements.length; i++) {
    let url = imageElements[i].innerHTML;
    if (!FileStorage.instance.get(url) && 0 < MimeType.type(url).length) {
      urls.push(url);
    }
  }

  imageElements = xmlElement.querySelectorAll('*[imageIdentifier]');
  for (let i = 0; i < imageElements.length; i++) {
    let url = imageElements[i].getAttribute('imageIdentifier');
    if (!FileStorage.instance.get(url) && 0 < MimeType.type(url).length) {
      urls.push(url);
    }
  }
  for (let url of urls) {
    FileStorage.instance.add(url)
  }
}

async function blobToArrayBuffer(blob): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = event => { resolve(reader.result); }
    reader.onabort = reader.onerror = () => { reject([]); }
    reader.readAsArrayBuffer(blob);
  });
}

setTimeout(function () { FileSharingSystem.instance; }, 0);