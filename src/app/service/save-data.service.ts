import { Injectable } from '@angular/core';

import { ChatTabList } from '@udonarium/chat-tab-list';
import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ImageFile, ImageState } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { ImageTagStorage } from '@udonarium/core/file-storage/image-tag-storage';
import { MimeType } from '@udonarium/core/file-storage/mime-type';
import { GameObject } from '@udonarium/core/synchronize-object/game-object';
import { XmlUtil } from '@udonarium/core/system/util/xml-util';
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

    let imageTagCsvLines = [];
    let roomImageFiles = this.searchImageFiles(roomXml);
    if(roomImageFiles) {
      for (let roomImageFile of roomImageFiles) {
        let identifier = roomImageFile.name.replace('.' + MimeType.extension(roomImageFile.type),'');
        let imageTag = ImageTagStorage.instance.get(identifier);
        if (imageTag) imageTagCsvLines.push(identifier + ',' + imageTag.tag);
      }
    }
    let chatImageFiles = this.searchImageFiles(chatXml);
    if(chatImageFiles) {
      for (let chatImageFile of chatImageFiles) {
        let identifier = chatImageFile.name.replace('.' + MimeType.extension(chatImageFile.type),'');
        let imageTag = ImageTagStorage.instance.get(identifier);
        if (imageTag) imageTagCsvLines.push(identifier + ',' + imageTag.tag);
      }
    }
    if (imageTagCsvLines) {
      let imageTagCsvData = imageTagCsvLines.join('\r\n')
      let imageTagCsvBom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      let imageTagCsvBlob = new Blob([imageTagCsvBom, imageTagCsvData], {type: 'text/csv'});
      files.push(new File([imageTagCsvBlob], 'imageTag.csv', {type: imageTagCsvBlob.type}));
    }

    files = files.concat(this.searchImageFiles(roomXml));
    files = files.concat(this.searchImageFiles(chatXml));

    FileArchiver.instance.save(files, fileName);
  }

  saveGameObject(gameObject: GameObject, fileName: string = 'xml_data') {
    let files: File[] = [];
    let xml: string = this.convertToXml(gameObject);

    let imageTagCsvLines = [];
    let imageFiles = this.searchImageFiles(xml);
    if(imageFiles) {
      for (let imageFile of imageFiles) {
        let identifier = imageFile.name.replace('.' + MimeType.extension(imageFile.type),'');
        let imageTag = ImageTagStorage.instance.get(identifier);
        if (imageTag) imageTagCsvLines.push(identifier + ',' + imageTag.tag);
      }
    }
    if (imageTagCsvLines) {
      let imageTagCsvData = imageTagCsvLines.join('\r\n');
      let imageTagCsvBom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      let imageTagCsvBlob = new Blob([imageTagCsvBom, imageTagCsvData], {type: 'text/csv'});
      files.push(new File([imageTagCsvBlob], 'imageTag.csv', {type: imageTagCsvBlob.type}));
    }

    files.push(new File([xml], 'data.xml', { type: 'text/plain' }));
    files = files.concat(this.searchImageFiles(xml));

    FileArchiver.instance.save(files, fileName);
  }

  private convertToXml(gameObject: GameObject): string {
    let xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
    return xmlDeclaration + '\n' + Beautify.xml(gameObject.toXml(), 2);
  }

  private searchImageFiles(xml: string): File[] {
    let xmlElement: Element = XmlUtil.xml2element(xml);
    let files: File[] = [];
    if (!xmlElement) return files;

    let images: { [identifier: string]: ImageFile } = {};
    let imageElements = xmlElement.ownerDocument.querySelectorAll('*[type="image"]');

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].innerHTML;
      images[identifier] = ImageStorage.instance.get(identifier);
    }

    imageElements = xmlElement.ownerDocument.querySelectorAll('*[imageIdentifier], *[backgroundImageIdentifier]');

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
