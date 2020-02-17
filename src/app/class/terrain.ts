import { ImageFile } from './core/file-storage/image-file';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { DataElement } from './data-element';
import { TabletopObject } from './tabletop-object';

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

  get width(): number { return this.getCommonValue('width', 1); }
  set width(width: number) { this.setCommonValue('width', width); }
  get height(): number { return this.getCommonValue('height', 1); }
  set height(height: number) { this.setCommonValue('height', height); }
  get depth(): number { return this.getCommonValue('depth', 1); }
  set depth(depth: number) { this.setCommonValue('depth', depth); }
  get name(): string { return this.getCommonValue('name', ''); }
  set name(name: string) { this.setCommonValue('name', name); }

  get wallImage(): ImageFile { return this.getImageFile('wall'); }
  get floorImage(): ImageFile { return this.getImageFile('floor'); }

  get hasWall(): boolean { return this.mode & TerrainViewState.WALL ? true : false; }
  get hasFloor(): boolean { return this.mode & TerrainViewState.FLOOR ? true : false; }

  static create(name: string, width: number, depth: number, height: number, wall: string, floor: string, identifier?: string): Terrain {
    let object: Terrain = null;

    if (identifier) {
      object = new Terrain(identifier);
    } else {
      object = new Terrain();
    }
    object.createDataElements();

    object.commonDataElement.appendChild(DataElement.create('name', name, {}, 'name_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('width', width, {}, 'width_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('height', height, {}, 'height_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('depth', depth, {}, 'depth_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('wall', wall, { type: 'image' }, 'wall_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('floor', floor, { type: 'image' }, 'floor_' + object.identifier));
    object.initialize();

    return object;
  }
}
