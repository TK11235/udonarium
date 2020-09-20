import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ImageState } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { MimeType } from '@udonarium/core/file-storage/mime-type';

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

    const element = gameCharacters[0].getElement(
      'name',
      gameCharacters[0].commonDataElement
    );
    const objectName: string = element ? element.value.toString() : '';

    this.saveGameCharacters(gameCharacters, 'xml_' + objectName);
  }

  /**
   * @see SaveDataService#saveGameObject from service/save-data.service
   */
  private saveGameCharacters(
    gameCharacters: CustomCharacter[],
    fileName: string = 'xml_data'
  ): void {
    const files: File[] = [];
    for (let i = 0; i < gameCharacters.length; i++) {
      const xml: string = gameCharacters[i].toXml();
      files.push(new File([xml], `data${i}.xml`, { type: 'text/plain' }));
    }

    const imageIdentifier = gameCharacters[0].imageDataElement.getFirstElementByName(
      'imageIdentifier'
    ).value;
    if (imageIdentifier) {
      const image = ImageStorage.instance.get(imageIdentifier.toString());
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

    FileArchiver.instance.save(files, fileName);
  }
}
