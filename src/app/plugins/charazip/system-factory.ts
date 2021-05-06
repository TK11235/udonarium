import * as fetchJsonp from 'fetch-jsonp';

import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';

import { CustomCharacter } from './custom-character';

import { Insane } from './system/insane';
import { Cthulhu } from './system/cthulhu';
import { DivineCharger } from './system/divine-charger';
import { DoubleCross3rd } from './system/double-cross-3rd';
import { SwordWorld2 } from './system/sword-world-2';
import { MonotoneMuseum } from './system/monotone-museum';
import { Shinobigami } from './system/shinobigami';
import { DeadlineHeroes } from './system/deadline-heroes';
import { LogHorizon, LhrpgCharacter } from './system/log-horizon';
import { Cthulhu7th } from './system/cthulhu-7th';
import { Amadeus } from './system/amadeus';
import { TokyoNovaX } from './system/tokyo-nova-x';
import { TokyoNightmare } from './system/tokyo-nightmare';
import { Satasupe } from './system/satasupe';
import { Arianrhod2e } from './system/arianrhod-2e';
import { StratoShout } from './system/strato-shout';
import { Kamigakari } from './system/kamigakari';
import { StarryDolls } from './system/starry-dolls';

export interface AppspotFactory {
  gameSystem: string;
  name: string;
  href: string;
  create: (
    json: any,
    url: string,
    imageIdentifier: string
  ) => CustomCharacter[];
}

export interface VampireBloodFactory {
  gameSystem: string;
  name: string;
  href: string;
  create: (json: any, url: string) => CustomCharacter[];
}

export class GameSystemList {
  static vampireBlood: VampireBloodFactory[] = [
    Arianrhod2e.vampireBloodFactory(),
    Kamigakari.vampireBloodFactory(),
    Cthulhu.vampireBloodFactory(),
    Cthulhu7th.vampireBloodFactory(),
    SwordWorld2.vampireBloodFactory(),
    DoubleCross3rd.vampireBloodFactory(),
  ];

  static appspot: AppspotFactory[] = [
    Amadeus.appspotFactory(),
    Insane.appspotFactory(),
    Satasupe.appspotFactory(),
    Shinobigami.appspotFactory(),
    StarryDolls.appspotFactory(),
    StratoShout.appspotFactory(),
    DoubleCross3rd.appspotFactory(),
    DivineCharger.appspotFactory(),
    DeadlineHeroes.appspotFactory(),
    TokyoNightmare.appspotFactory(),
    TokyoNovaX.appspotFactory(),
    MonotoneMuseum.appspotFactory(),
  ];

  static async createVampireBloodCharacter(
    url: URL
  ): Promise<CustomCharacter[]> {
    // pathnameは常に"/"から始まる
    const id = url.pathname.substring(1);
    if (!id) {
      throw new Error('URLが正しくありません。');
    }
    const sheetUrl = `https://charasheet.vampire-blood.net/${id}`;
    const json = await fetchJsonp(
      `//charasheet.vampire-blood.net/${id}.js`
    ).then((response) => response.json());
    // URLが正しくない場合、空のjsonが帰ってくる
    if (!json || Object.keys(json).length < 1) {
      throw new Error('URLが正しくありません。');
    }

    if (!json.game) {
      throw new Error('このキャラクターシートは使用できません。');
    }
    const factory = GameSystemList.vampireBlood.find(
      (factory) => factory.gameSystem === json.game
    );
    if (!factory) {
      throw new Error(`未対応のシステムです。game=${json.game}`);
    }
    return factory.create(json, sheetUrl);
  }

  static async createAppspotCharacter(url: URL): Promise<CustomCharacter[]> {
    if (!url.searchParams || !url.searchParams.has('key')) {
      throw new Error('URLが正しくありません。');
    }
    const key = url.searchParams.get('key');
    if (!key) {
      throw new Error('URLが正しくありません。');
    }
    // pathnameは常に"/"から始まる
    const gameSystem = url.pathname.substring(1, url.pathname.lastIndexOf('/'));
    const factory = GameSystemList.appspot.find(
      (factory) => factory.gameSystem === gameSystem
    );
    if (!factory) {
      throw new Error(`未対応のシステムです。gameSystem=${gameSystem}`);
    }

    const json = await fetchJsonp(
      `//character-sheets.appspot.com/${gameSystem}/display?ajax=1&base64Image=1&key=${key}`
    ).then((response) => response.json());
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

    const sheetUrl = `https://character-sheets.appspot.com/${gameSystem}/edit.html?key=${key}`;
    return factory.create(json, sheetUrl, imageIdentifier);
  }

  static async generateByLhrpgCharacter(url: URL): Promise<CustomCharacter[]> {
    if (
      !url.pathname.startsWith('/lhz/pc') ||
      !url.searchParams ||
      !url.searchParams.has('id')
    ) {
      throw new Error(
        'URLが正しくありません。\nパーソナルファクターのページのURL"https://lhrpg.com/lhz/pc?id=xxxxxx"を入力してください。'
      );
    }
    const id = url.searchParams.get('id');
    if (!id) {
      throw new Error(
        'URLが正しくありません。\nパーソナルファクターのページのURL"https://lhrpg.com/lhz/pc?id=xxxxxx"を入力してください。'
      );
    }
    const json = await fetchJsonp(`//lhrpg.com/lhz/api/${id}.json`)
      .then((response) => response.json<LhrpgCharacter>())
      .catch((err): never => {
        console.error(err);
        throw new Error(
          `「基本情報を変更する」→「外部ツールからの〈冒険者〉データ参照を許可する」にチェックが入っているか確認してください。`
        );
      });
    // URLが正しくない場合、空のjsonが帰ってくる
    if (!json || Object.keys(json).length < 1) {
      throw new Error('URLが正しくありません。');
    }
    return LogHorizon.generate(json);
  }

  static async generateByCharaeno(url: URL): Promise<CustomCharacter[]> {
    let edition = url.pathname.substring(1, url.pathname.lastIndexOf('/'));
    if (!['6th', '7th'].includes(edition)) {
      throw new Error('URLが正しくありません。');
    }
    const json = await fetch(
      `https://charaeno.sakasin.net/api/v1${url.pathname}/summary`
    )
      .then((response) => response.json())
      .catch((err): never => {
        console.error(err);
        throw new Error('URLが正しくありません。');
      });
    const sheetUrl = `https://charaeno.sakasin.net${url.pathname}`;
    switch (edition) {
      case '6th':
        return Cthulhu.charaenoFactory().create(json, sheetUrl);
      case '7th':
        return Cthulhu7th.charaenoFactory().create(json, sheetUrl);
    }
    throw new Error('URLが正しくありません。');
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
        canvas.toBlob((blob) => {
          if (blob.size > 2 * 1024 * 1024) {
            resolve(ImageFile.Empty);
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
}
