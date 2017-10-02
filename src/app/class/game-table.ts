import { GameTableMask } from './game-table-mask';
import { TabletopObject } from './tabletop-object';
import { Terrain } from './terrain';

import { Network, EventSystem } from './core/system/system';
import { ObjectStore } from './core/synchronize-object/object-store';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { GameObject } from './core/synchronize-object/game-object';
import { ObjectSerializer, InnerXml } from './core/synchronize-object/object-serializer';

export interface GameTableDataContainer {
  width: number;
  height: number;
  gridSize: number;
  imageIdentifier: string;
}

@SyncObject('game-table')
export class GameTable extends GameObject implements InnerXml {
  @SyncVar() name: string = 'テーブル';
  @SyncVar() width: number = 20;
  @SyncVar() height: number = 20;
  @SyncVar() gridSize: number = 50;
  @SyncVar() imageIdentifier: string = 'imageIdentifier';
  @SyncVar() selected: boolean = false;

  innerXml(): string {
    let xml = '';
    let masks = ObjectStore.instance.getObjects<GameTableMask>(GameTableMask);
    for (let mask of masks) {
      if (mask.location.name === this.identifier) {
        xml += mask.toXml();
      }
    }
    let terrains = ObjectStore.instance.getObjects<Terrain>(Terrain);
    for (let terrain of terrains) {
      if (terrain.location.name === this.identifier) {
        xml += terrain.toXml();
      }
    }
    return xml;
  }

  parseInnerXml(element: Element) {
    for (let i = 0; i < element.children.length; i++) {
      console.log('GameTable.parseInnerXml() [' + i + ']', element.children[i]);
      let object = ObjectSerializer.instance.parseXml(element.children[i]);
      if (object instanceof TabletopObject) {
        object.location.name = this.identifier;
        object.update();
      }
    }
    if (this.selected) EventSystem.call('SELECT_GAME_TABLE', { identifier: this.identifier }, Network.peerId);
  }
}
