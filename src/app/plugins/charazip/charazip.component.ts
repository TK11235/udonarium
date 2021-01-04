import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ImageFile, ImageState } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { MimeType } from '@udonarium/core/file-storage/mime-type';
import { XmlUtil } from '@udonarium/core/system/util/xml-util';

import * as Beautify from 'vkbeautify';

import { CustomCharacter } from './custom-character';
import {
  GameSystemList,
  AppspotFactory,
  VampireBloodFactory,
} from './system-factory';

@Component({
  selector: 'app-charazip',
  templateUrl: './charazip.component.html',
  styleUrls: ['./charazip.component.css'],
})
export class CharazipComponent implements OnInit {
  get vampireBloodList(): VampireBloodFactory[] {
    return GameSystemList.vampireBlood;
  }
  get appspotList(): AppspotFactory[] {
    return GameSystemList.appspot;
  }

  constructor() {}

  @ViewChild('input', { static: true })
  inputElementRef: ElementRef<HTMLInputElement>;

  url: string = '';
  errorMsg: string = '';

  ngOnInit() {}

  onFocus(): void {
    this.inputElementRef.nativeElement.select();
  }

  async createZip(): Promise<void> {
    this.url = this.url.trim();
    if (!this.url) {
      this.errorMsg = 'URLを入力してください。';
      return;
    }
    let url: URL = null;
    try {
      url = new URL(this.url);
    } catch (err) {
      console.error(err);
      this.errorMsg = '入力されたURLが正しくありません。';
      return;
    }
    let gameCharacters: CustomCharacter[] = null;
    try {
      switch (url.host) {
        case 'charasheet.vampire-blood.net':
          gameCharacters = await GameSystemList.createVampireBloodCharacter(
            url
          );
          break;
        case 'character-sheets.appspot.com':
          gameCharacters = await GameSystemList.createAppspotCharacter(url);
          break;
        case 'lhrpg.com':
          gameCharacters = await GameSystemList.generateByLhrpgCharacter(url);
          break;
        default:
          this.errorMsg =
            'URLが正しくありません。もしくは未対応のキャラクターシートサービスです。';
          return;
      }
    } catch (err) {
      console.error(err);
      this.errorMsg = `キャラクターシートの取り込みに失敗しました。\n${err.message}`;
      return;
    }
    if (!gameCharacters || gameCharacters.length <= 0) {
      this.errorMsg =
        this.errorMsg ||
        'URLが正しくありません。もしくは未対応のシステムです。';
      return;
    }
    this.errorMsg = '';

    const element = gameCharacters[0].commonDataElement.getFirstElementByName('name');
    const objectName: string = element ? element.value.toString() : '';

    this._saveGameCharactersAsync(gameCharacters, 'xml_' + objectName);
  }

  /**
   * @see SaveDataService#_saveGameObjectAsync from service/save-data.service
   */
  private _saveGameCharactersAsync(
    gameCharacters: CustomCharacter[],
    fileName: string = 'xml_data'
  ): void {
    let files: File[] = [];
    for (let i = 0; i < gameCharacters.length; i++) {
      const xml: string = this.convertToXml(gameCharacters[i]);
      files.push(new File([xml], `data${i}.xml`, { type: 'text/plain' }));
      files = files.concat(this.searchImageFiles(xml));
    }

    FileArchiver.instance.saveAsync(files, this.appendTimestamp(fileName));
  }

  private convertToXml(gameObject: CustomCharacter): string {
    let xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
    return xmlDeclaration + '\n' + Beautify.xml(gameObject.toXml(), 2);
  }

  private searchImageFiles(xml: string): File[] {
    let xmlElement: Element = XmlUtil.xml2element(xml);
    let files: File[] = [];
    if (!xmlElement) return files;

    let images: { [identifier: string]: ImageFile } = {};
    let imageElements = xmlElement.ownerDocument.querySelectorAll(
      '*[type="image"]'
    );

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].innerHTML;
      images[identifier] = ImageStorage.instance.get(identifier);
    }

    imageElements = xmlElement.ownerDocument.querySelectorAll(
      '*[imageIdentifier], *[backgroundImageIdentifier]'
    );

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].getAttribute('imageIdentifier');
      if (identifier)
        images[identifier] = ImageStorage.instance.get(identifier);

      let backgroundImageIdentifier = imageElements[i].getAttribute(
        'backgroundImageIdentifier'
      );
      if (backgroundImageIdentifier)
        images[backgroundImageIdentifier] = ImageStorage.instance.get(
          backgroundImageIdentifier
        );
    }
    for (let identifier in images) {
      let image = images[identifier];
      if (image && image.state === ImageState.COMPLETE) {
        files.push(
          new File(
            [image.blob],
            image.identifier + '.' + MimeType.extension(image.blob.type),
            { type: image.blob.type }
          )
        );
      }
    }
    return files;
  }

  private appendTimestamp(fileName: string): string {
    let date = new Date();
    let year = date.getFullYear();
    let month = ('00' + (date.getMonth() + 1)).slice(-2);
    let day = ('00' + date.getDate()).slice(-2);
    let hours = ('00' + date.getHours()).slice(-2);
    let minutes = ('00' + date.getMinutes()).slice(-2);

    return fileName + `_${year}-${month}-${day}_${hours}${minutes}`;
  }
}
