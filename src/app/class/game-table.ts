import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { InnerXml } from './core/synchronize-object/object-serializer';
import { EventSystem } from './core/system/system';
import { GameTableMask } from './game-table-mask';
import { Terrain } from './terrain';

export enum GridType {
  SQUARE = 0,
  HEX_VERTICAL = 1,
  HEX_HORIZONTAL = 2,
}

export enum FilterType {
  NONE = '',
  WHITE = 'white',
  BLACK = 'black',
}

export interface GameTableDataContainer {
  width: number;
  height: number;
  gridSize: number;
  imageIdentifier: string;
  distanceviewImageIdentifier: string;
  distanceViewFilterType: FilterType;
  gridType: GridType;
}

@SyncObject('game-table')
export class GameTable extends ObjectNode implements InnerXml {
  @SyncVar() name: string = 'テーブル';
  @SyncVar() width: number = 20;
  @SyncVar() height: number = 20;
  @SyncVar() gridSize: number = 50;
  @SyncVar() imageIdentifier: string = 'imageIdentifier';
  @SyncVar() distanceviewImageIdentifier: string = 'imageIdentifier';
  @SyncVar() distanceViewFilterType: FilterType = FilterType.WHITE;
  @SyncVar() selected: boolean = false;
  @SyncVar() gridType: GridType = GridType.SQUARE;
  @SyncVar() gridColor: string = '#000000e6';

  get terrains(): Terrain[] {
    let terrains: Terrain[] = [];
    this.children.forEach(object => {
      if (object instanceof Terrain) terrains.push(object);
    });
    return terrains;
  }

  get masks(): GameTableMask[] {
    let masks: GameTableMask[] = [];
    this.children.forEach(object => {
      if (object instanceof GameTableMask) masks.push(object);
    });
    return masks;
  }

  innerXml(): string {
    return super.innerXml();
  }

  parseInnerXml(element: Element) {
    super.parseInnerXml(element);
    if (this.selected) EventSystem.trigger('SELECT_GAME_TABLE', { identifier: this.identifier });
  }
}
