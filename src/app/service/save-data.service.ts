import { Injectable } from '@angular/core';

import { ChatTabList } from '@udonarium/chat-tab-list';
import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ImageFile, ImageState } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { MimeType } from '@udonarium/core/file-storage/mime-type';
import { GameObject } from '@udonarium/core/synchronize-object/game-object';
import { XmlUtil } from '@udonarium/core/synchronize-object/xml-util';
import { DataSummarySetting } from '@udonarium/data-summary-setting';
import { Room } from '@udonarium/room';

import * as Beautify from 'vkbeautify';

@Injectable({
  providedIn: 'root'
})
export class SaveDataService {

  saveRoom(fileName: string = 'ルームデータ') {
    let files: File[] = [];
    let roomXml = this.convertToXml(new Room());
    let chatXml = this.convertToXml(new ChatTabList());
    let summarySetting = this.convertToXml(DataSummarySetting.instance);
    files.push(new File([roomXml], 'data.xml', { type: 'text/plain' }));
    files.push(new File([chatXml], 'chat.xml', { type: 'text/plain' }));
    files.push(new File([summarySetting], 'summary.xml', { type: 'text/plain' }));

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
      images[identifier] = ImageStorage.instance.get(identifier);
    }

    imageElements = xmlElement.querySelectorAll('*[imageIdentifier], *[backgroundImageIdentifier]');

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].getAttribute('imageIdentifier');
      if (identifier) images[identifier] = ImageStorage.instance.get(identifier);

      let backgroundImageIdentifier = imageElements[i].getAttribute('backgroundImageIdentifier');
      if (backgroundImageIdentifier) images[backgroundImageIdentifier] = ImageStorage.instance.get(backgroundImageIdentifier);
    }
    for (let identifier in images) {
      let image = images[identifier];
      if (image && image.state === ImageState.COMPLETE) {
        files.push(new File([image.blob], image.identifier + '.' + MimeType.extension(image.blob.type), { type: image.blob.type }));
      }
    }
    return files;
  }
}
