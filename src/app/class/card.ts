import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { GameObject } from './core/synchronize-object/game-object';
import { DataElement } from './data-element';
import { ObjectStore } from './core/synchronize-object/object-store';
import { TabletopObject } from './tabletop-object';
import { ImageFile } from './core/file-storage/image-file';
import { PeerCursor } from './peer-cursor';
import { EventSystem, Network } from './core/system/system';
import { CardStack } from './card-stack';

export enum CardState {
  FRONT,
  BACK,
}

@SyncObject('card')
export class Card extends TabletopObject {
  @SyncVar() state: CardState = CardState.FRONT;
  @SyncVar() rotate: number = 0;
  @SyncVar() owner: string = '';
  @SyncVar() zindex: number = 0;

  get name(): string { return this.getCommonValue('name', ''); }
  get size(): number { return this.getCommonValue('size', 2); }
  set size(size: number) { this.setCommonValue('size', size); }
  get frontImage(): ImageFile { return this.getImageFile('front'); }
  get backImage(): ImageFile { return this.getImageFile('back'); }

  get imageFile(): ImageFile {
    if (this.isVisible) {
      return this.frontImage;
    } else {
      return this.backImage;
    }
  }

  get ownerName(): string {
    let object = PeerCursor.find(this.owner);
    return object ? object.name : '';
  }

  get hasOwner(): boolean { return PeerCursor.find(this.owner) != null; }
  get isHand(): boolean { return Network.peerId === this.owner; }
  get isFront(): boolean { return this.state === CardState.FRONT; }
  get isVisible(): boolean { return this.isHand || this.isFront; }

  faceUp() {
    this.state = CardState.FRONT;
    this.owner = '';
  }

  faceDown() {
    this.state = CardState.BACK;
    this.owner = '';
  }

  toTopmost() {
    let object: any[] = ObjectStore.instance.getObjects('card-stack');
    object = object.concat(ObjectStore.instance.getObjects('card'));
    object.sort((a, b) => {
      if (a.zindex < b.zindex) return -1;
      if (a.zindex > b.zindex) return 1;
      return 0;
    });
    let last = object[object.length - 1];
    if (last === this) return;
    let max = last.zindex;
    if (this.zindex <= max) this.zindex = max + 1;

    if (object.length * 16 < max) {
      for (let i = 0; i < object.length; i++) {
        object[i].zindex = i;
      }
    }
  }

  static create(name: string, fornt: string, back: string, size: number = 2, identifier?: string): Card {
    let object: Card = null;

    if (identifier) {
      object = new Card(identifier);
    } else {
      object = new Card();
    }
    object.createDataElements();

    object.commonDataElement.appendChild(DataElement.create('name', name, {}, 'name_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('size', size, {}, 'size_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('front', fornt, { type: 'image' }, 'front_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('back', back, { type: 'image' }, 'back_' + object.identifier));
    object.initialize();

    return object;
  }
}