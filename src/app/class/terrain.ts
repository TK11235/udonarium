import { DataElement } from './data-element';
import { TabletopObject } from './tabletop-object';
import { ImageFile } from './core/file-storage/image-file';
import { FileStorage } from './core/file-storage/file-storage';

import { SyncObject, SyncVar } from './core/synchronize-object/anotation';

export enum TerrainViewState {
  NULL = 0,
  FLOOR = 1,
  WALL = 2,
  ALL = 3,
}

@SyncObject('terrain')
export class Terrain extends TabletopObject {
  @SyncVar() isLocked: boolean = false;
  @SyncVar() mode: TerrainViewState = TerrainViewState.ALL;
  @SyncVar() rotate: number = 0;

  get hasWall(): boolean { return this.mode & TerrainViewState.WALL ? true : false; }
  get hasFloor(): boolean { return this.mode & TerrainViewState.FLOOR ? true : false; }

  get width(): number {
    let element = this.getElement('width', this.commonDataElement);
    let num = element ? +element.value : 0;
    return Number.isNaN(num) ? 1 : num;
  }

  set width(width: number) {
    let element = this.getElement('width', this.commonDataElement);
    element.value = width;
  }

  get height(): number {
    let element = this.getElement('height', this.commonDataElement);
    let num = element ? +element.value : 0;
    return Number.isNaN(num) ? 1 : num;
  }

  set height(height: number) {
    let element = this.getElement('height', this.commonDataElement);
    element.value = height;
  }

  get depth(): number {
    let element = this.getElement('depth', this.commonDataElement);
    let num = element ? +element.value : 0;
    return Number.isNaN(num) ? 1 : num;
  }

  set depth(depth: number) {
    let element = this.getElement('depth', this.commonDataElement);
    element.value = depth;
  }

  get opacity(): number {
    let element = this.getElement('opacity', this.commonDataElement);
    let num = element ? <number>element.currentValue / <number>element.value : 1;
    return Number.isNaN(num) ? 1 : num;
  }

  get name(): string {
    let element = this.getElement('name', this.commonDataElement);
    return element ? <string>element.value : '';
  }

  get wallImage(): ImageFile {
    if (!this.imageDataElement) return null;
    let image = this.getElement('wall', this.imageDataElement);
    return image ? FileStorage.instance.get(<string>image.value) : null;
  }

  get floorImage(): ImageFile {
    if (!this.imageDataElement) return null;
    let image = this.getElement('floor', this.imageDataElement);
    return image ? FileStorage.instance.get(<string>image.value) : null;
  }

  static create(name: string, width: number, depth: number, height: number, opacity: number, wall: string, floor: string, identifier?: string): Terrain {
    let object: Terrain = null;

    if (identifier) {
      object = new Terrain(identifier);
    } else {
      object = new Terrain();
    }
    object.createDataElements();

    object.commonDataElement.appendChild(DataElement.create('name', name, {}, 'name_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('width', width, {}, 'width_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('height', width, {}, 'height_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('depth', width, {}, 'depth_' + object.identifier));
    //object.commonDataElement.appendChild(DataElement.create('opacity', opacity, { type: 'numberResource', currentValue: opacity }, 'opacity_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('wall', wall, { type: 'image' }, 'wall_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('floor', floor, { type: 'image' }, 'floor_' + object.identifier));
    object.initialize();

    /* debug */
    console.log('serializeToXmlString\n' + object.rootDataElement.toXml());
    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(object.rootDataElement.toXml(), 'application/xml');
    console.log(gameCharacterXMLDocument);
    /* debug */

    return object;
  }
}
