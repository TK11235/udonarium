import { FileStorage } from './file-storage';
import { AudioStorage } from './audio-storage';
import { Base64 } from './base64';
import { MimeType } from './mime-type';
import { EventSystem } from '../system/system';

import * as JSZip from 'jszip/dist/jszip.min.js';
//import * as JSZip from 'jszip';

export class FileArchiver {
  private static _instance: FileArchiver
  static get instance(): FileArchiver {
    if (!FileArchiver._instance) FileArchiver._instance = new FileArchiver();
    return FileArchiver._instance;
  }

  private callbackOnDragEnter;
  private callbackOnDragOver;
  private callbackOnDrop;

  private constructor() {
    console.log('FileArchiver ready...');
    this.addEventListeners();
    window.addEventListener('beforeunload', event => {
      this.destroy();
    });
  }

  private destroy() {
    this.removeEventListeners();
  }

  private addEventListeners() {
    this.removeEventListeners();
    this.callbackOnDragEnter = (e) => this.onDragEnter(e);
    this.callbackOnDragOver = (e) => this.onDragOver(e);
    this.callbackOnDrop = (e) => this.onDrop(e);
    document.body.addEventListener('dragenter', this.callbackOnDragEnter, false);
    document.body.addEventListener('dragover', this.callbackOnDragOver, false);
    document.body.addEventListener('drop', this.callbackOnDrop, false);
  }

  private removeEventListeners() {
    document.body.removeEventListener('dragenter', this.callbackOnDragEnter, false);
    document.body.removeEventListener('dragover', this.callbackOnDragOver, false);
    document.body.removeEventListener('drop', this.callbackOnDrop, false);
    this.callbackOnDragEnter = null;
    this.callbackOnDragOver = null;
    this.callbackOnDrop = null;
  }

  private onDragEnter(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();
  };

  private onDragOver(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();
  };

  private onDrop(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();

    let dataTransfer = event.dataTransfer;
    console.log('onDrop', event.dataTransfer);
    this.load(dataTransfer.files);
  };

  async load(files: File[])
  async load(files: FileList)
  async load(files: any) {
    let length = files.length;
    for (let i = 0; i < length; i++) {
      await this.handleImage(files[i]);
      await this.handleAudio(files[i]);
      this.handleText(files[i]);
      await this.handleZip(files[i]);
    }
  }

  private async handleImage(file: File) {
    if (file.type.indexOf('image/') < 0) return;
    console.log(file.name + ' type:' + file.type);
    if (2 * 1024 * 1024 < file.size) return;
    await FileStorage.instance.addAsync(file);
  }

  private async handleAudio(file: File) {
    if (file.type.indexOf('audio/') < 0) return;
    console.log(file.name + ' type:' + file.type);
    if (10 * 1024 * 1024 < file.size) return;
    //await FileStorage.instance.addAsync(file);
    console.warn('handleAudio() is not implemented. test play....');
    let audio = await AudioStorage.instance.addAsync(file);
  }

  private handleText(file: File) {
    if (file.type.indexOf('text/') < 0) return;
    console.log(file.name + ' type:' + file.type);
    if (10 * 1024 * 1024 < file.size) return;

    let reader = new FileReader();
    reader.onload = (event) => {
      let xml: string = reader.result;
      EventSystem.trigger('XML_PARSE', { xml: xml });
    }
    reader.readAsText(file);
  }

  private async handleZip(file: File) {
    if (!(0 <= file.type.indexOf('application/') || file.type.length < 1)) return;
    let zip = new JSZip();
    try {
      zip = await zip.loadAsync(file);
    } catch (reason) {
      console.warn(reason);
      return;
    }
    zip.forEach(async (relativePath, zipEntry) => {
      try {
        let arraybuffer = await zipEntry.async('arraybuffer');
        console.log(zipEntry.name + ' 解凍...', arraybuffer);
        await this.load([new File([arraybuffer], zipEntry.name, { type: MimeType.type(zipEntry.name) })]);
      } catch (reason) {
        console.warn(reason);
      }
    });
  }

  save(files: File[], zipName: string)
  save(files: FileList, zipName: string)
  save(files: any, zipName: string) {
    if (!files) return;

    let zip = new JSZip();
    let length = files.length;
    for (let i = 0; i < length; i++) {
      let file = files[i]
      zip.file(file.name, file);
    }

    zip.generateAsync({ type: 'blob' }).then(blob => {
      let a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.target = '_blank';
      a.download = zipName + '.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(a.href);
    });
  }
}
setTimeout(function () { FileArchiver.instance; }, 0);