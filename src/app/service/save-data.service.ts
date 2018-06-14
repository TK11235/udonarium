import { Injectable } from '@angular/core';
import * as Beautify from 'vkbeautify';

import { ChatTabList } from '../class/chat-tab-list';
import { FileArchiver } from '../class/core/file-storage/file-archiver';
import { FileStorage } from '../class/core/file-storage/file-storage';
import { ImageFile } from '../class/core/file-storage/image-file';
import { MimeType } from '../class/core/file-storage/mime-type';
import { XmlUtil } from '../class/core/synchronize-object/xml-util';
import { Room } from '../class/room';
import { GameObject } from '../class/core/synchronize-object/game-object';

@Injectable({
  providedIn: 'root'
})
export class SaveDataService {

  saveRoom(fileName: string = 'ルームデータ') {
    let files: File[] = [];
    let roomXml = this.convertToXml(new Room());
    let chatXml = this.convertToXml(new ChatTabList());
    files.push(new File([roomXml], 'data.xml', { type: 'text/plain' }));
    files.push(new File([chatXml], 'chat.xml', { type: 'text/plain' }));

    files = files.concat(this.searchImageFiles(roomXml));
    files = files.concat(this.searchImageFiles(chatXml));

    FileArchiver.instance.save(files, fileName);
  }

  saveGameObject(gameObject: GameObject, fileName: string = 'xml_data') {
    let files: File[] = [];
    let xml: string = this.convertToXml(gameObject);

    files.push(new File([xml], 'data.xml', { type: 'text/plain' }));
    files = files.concat(this.searchImageFiles(xml));

    FileArchiver.instance.save(files, fileName);
  }

  private convertToXml(gameObject: GameObject): string {
    return Beautify.xml(gameObject.toXml(), 2);
  }

  private searchImageFiles(xml: string): File[] {
    let xmlElement: Element = XmlUtil.xml2element('<root>' + xml + '</root>');
    let files: File[] = [];
    if (!xmlElement) return files;

    let images: { [identifier: string]: ImageFile } = {};
    let imageElements = xmlElement.querySelectorAll('*[type="image"]');

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].innerHTML;
      images[identifier] = FileStorage.instance.get(identifier);
    }

    imageElements = xmlElement.querySelectorAll('*[imageIdentifier]');

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].getAttribute('imageIdentifier');
      images[identifier] = FileStorage.instance.get(identifier);
    }
    for (let identifier in images) {
      let image = images[identifier];
      if (image && image.blob) {
        files.push(new File([image.blob], image.identifier + '.' + MimeType.extension(image.blob.type), { type: image.blob.type }));
      }
    }
    return files;
  }
}
