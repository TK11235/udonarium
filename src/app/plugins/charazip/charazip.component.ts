import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import * as fetchJsonp from 'fetch-jsonp';
import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ImageFile, ImageState } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { MimeType } from '@udonarium/core/file-storage/mime-type';
import { CustomCharacter } from './custom-character';
import { Insane } from './system/insane';
import { Cthulhu } from './system/cthulhu';
import { DivineCharger } from './system/divine-charger';
import { DoubleCross3rd } from './system/double-cross-3rd';
import { SwordWorld2 } from './system/sword-world-2';
import { MonotoneMusium } from './system/monotone-musium';
import { Shinobigami } from './system/shinobigami';
import { DeadlineHeroes } from './system/deadline-heroes';
import { LogHorizon, LhrpgCharacter } from './system/log-horizon';

interface SystemInfo {
  system: string;
  name: string;
  href: string;
  generater: (
    json: any,
    url: string,
    imageIdentifier?: string
  ) => CustomCharacter[];
}

@Component({
  selector: 'app-charazip',
  templateUrl: './charazip.component.html',
  styleUrls: ['./charazip.component.css']
})
export class CharazipComponent implements OnInit {
  get vampireBloodList() {
    return CharazipComponent.vampireBloodInfos;
  }
  get appspotList() {
    return CharazipComponent.appspotInfos;
  }

  constructor() {}

  private static vampireBloodInfos: SystemInfo[] = [
    {
      system: 'coc',
      name: 'クトゥルフ',
      href: 'https://charasheet.vampire-blood.net/list_coc.html',
      generater: Cthulhu.generateByVampireVlood
    },
    {
      system: 'swordworld2',
      name: 'ソードワールド2.0',
      href: 'https://charasheet.vampire-blood.net/list_swordworld2.html',
      generater: SwordWorld2.generateByVampireVlood
    },
    {
      system: 'dx3',
      name: 'ダブルクロス3rd',
      href: 'https://charasheet.vampire-blood.net/list_dx3.html',
      generater: DoubleCross3rd.generateByVampireVlood
    }
  ];

  private static appspotInfos: SystemInfo[] = [
    {
      system: 'insane',
      name: 'インセイン',
      href: 'https://character-sheets.appspot.com/insane/',
      generater: Insane.geneateByAppspot
    },
    {
      system: 'shinobigami',
      name: 'シノビガミ',
      href: 'https://character-sheets.appspot.com/shinobigami/',
      generater: Shinobigami.geneateByAppspot
    },
    {
      system: 'dx3',
      name: 'ダブルクロス3rd',
      href: 'https://character-sheets.appspot.com/dx3/',
      generater: DoubleCross3rd.geneateByAppspot
    },
    {
      system: 'divinecharger',
      name: 'ディヴァインチャージャー',
      href: 'https://character-sheets.appspot.com/divinecharger/',
      generater: DivineCharger.generateByAppspot
    },
    {
      system: 'dlh',
      name: 'デッドラインヒーローズ',
      href: 'https://character-sheets.appspot.com/dlh/',
      generater: DeadlineHeroes.geneateByAppspot
    },
    {
      system: 'mnt',
      name: 'モノトーンミュージアム',
      href: 'https://character-sheets.appspot.com/mnt/',
      generater: MonotoneMusium.geneateByAppspot
    }
  ];

  @ViewChild('input', { static: true })
  inputElementRef: ElementRef<HTMLInputElement>;

  url = '';
  errorMsg = '';

  private static async generateByVampireBloodCharacter(
    id: string
  ): Promise<CustomCharacter[]> {
    const sheetUrl = `https://charasheet.vampire-blood.net/${id}`;
    const json = await fetchJsonp(
      `//charasheet.vampire-blood.net/${id}.js`
    ).then(response => response.json());
    // URLが正しくない場合、空のjsonが帰ってくる
    if (!json || Object.keys(json).length < 1) {
      throw new Error('URLが正しくありません。');
    }

    if (!json.game) {
      console.error('game要素がありません。');
      throw new Error('このキャラクターシートは使用できません。');
    }
    const systemInfo = CharazipComponent.vampireBloodInfos.find(
      info => info.system === json.game
    );
    if (!systemInfo) {
      throw new Error('未対応のシステムです。');
    }
    return systemInfo.generater(json, sheetUrl);
  }

  private static async generateByAppspotCharacter(
    system: string,
    key: string
  ): Promise<CustomCharacter[]> {
    const sheetUrl = `https://character-sheets.appspot.com/${system}/edit.html?key=${key}`;
    const systemInfo = CharazipComponent.appspotInfos.find(
      info => info.system === system
    );
    if (!systemInfo) {
      throw new Error('未対応のシステムです。');
    }

    const json = await fetchJsonp(
      `//character-sheets.appspot.com/${system}/display?ajax=1&base64Image=1&key=${key}`
    ).then(response => response.json());
    // URLが正しくない場合、空のjsonが帰ってくる
    if (!json || Object.keys(json).length < 1) {
      throw new Error('URLが正しくありません。');
    }

    let imageIdentifier: string = null;
    if (json.images && json.images.uploadImage) {
      const image: ImageFile = await this.createImageAsync(
        json.images.uploadImage
      );
      if (image) {
        imageIdentifier = image.toContext().identifier;
      }
    }

    return systemInfo.generater(json, sheetUrl, imageIdentifier);
  }

  private static async generateByLhrpgCharacter(
    id: string
  ): Promise<CustomCharacter[]> {
    const json = await fetchJsonp(`//lhrpg.com/lhz/api/${id}.json`).then(
      response => response.json<LhrpgCharacter>()
    );
    // URLが正しくない場合、空のjsonが帰ってくる
    if (!json || Object.keys(json).length < 1) {
      throw new Error('URLが正しくありません。');
    }
    return LogHorizon.generate(json);
  }

  /**
   * @see ImageFile#createThumbnailAsync from @udonarium/core/file-storage/image-file
   */
  private static async createImageAsync(base64img: string): Promise<ImageFile> {
    return new Promise((resolve, reject) => {
      const canvas: HTMLCanvasElement = document.createElement('canvas');
      const render: CanvasRenderingContext2D = canvas.getContext('2d');
      const image: HTMLImageElement = new Image();
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        render.drawImage(image, 0, 0);
        canvas.toBlob(blob => {
          if (blob.size > 2 * 1024 * 1024) {
            resolve();
          }
          resolve(ImageStorage.instance.addAsync(blob));
        });
      };
      image.onabort = image.onerror = () => {
        reject();
      };
      image.src = base64img;
    });
  }

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
    let gameCharacters: CustomCharacter[] = null;
    if (!gameCharacters) {
      const matchResult = this.url.match(
        /^http(s)?:\/\/charasheet\.vampire-blood\.net\/([^?#]+)/
      );
      if (matchResult) {
        const id = matchResult[2];
        try {
          gameCharacters = await CharazipComponent.generateByVampireBloodCharacter(
            id
          );
        } catch (err) {
          console.error(err);
          this.errorMsg = `キャラクターシートの取り込みに失敗しました。\n${
            err.message
          }`;
          return;
        }
      }
    }
    if (!gameCharacters) {
      const matchResult = this.url.match(
        /^http(s)?:\/\/character-sheets\.appspot\.com\/(.+)\/.+\?key=([^&]+)/
      );
      if (matchResult) {
        const system = matchResult[2];
        const key = matchResult[3];
        try {
          gameCharacters = await CharazipComponent.generateByAppspotCharacter(
            system,
            key
          );
        } catch (err) {
          console.error(err);
          this.errorMsg = `キャラクターシートの取り込みに失敗しました。\n${
            err.message
          }`;
          return;
        }
      }
    }
    if (!gameCharacters) {
      let matchResult = this.url.match(/^http(s)?:\/\/lhrpg\.com\/lhz\//);
      if (matchResult) {
        matchResult = this.url.match(/\?id=(\d+)/);
        if (!matchResult) {
          this.errorMsg =
            'URLが正しくありません。\nパーソナルファクターのページのURL"https://lhrpg.com/lhz/pc?id=xxxxxx"を入力してください。';
          return;
        }
        const id = matchResult[1];
        try {
          gameCharacters = await CharazipComponent.generateByLhrpgCharacter(id);
        } catch (err) {
          console.error(err);
          this.errorMsg = `キャラクターシートの取り込みに失敗しました。
「基本情報を変更する」→「外部ツールからの〈冒険者〉データ参照を許可する」にチェックが入っているか確認してください。
${err.message}`;
          return;
        }
      }
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
