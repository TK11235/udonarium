import { CardStack } from './card-stack';
import { ImageFile } from './core/file-storage/image-file';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectStore } from './core/synchronize-object/object-store';
import { Network } from './core/system';
import { DataElement } from './data-element';
import { PeerCursor } from './peer-cursor';
import { TabletopObject } from './tabletop-object';

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

  get imageFile(): ImageFile { return this.isVisible ? this.frontImage : this.backImage; }

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
    let objects: (Card | CardStack)[] = ObjectStore.instance.getObjects<CardStack>('card-stack').filter(obj => obj.location.name === 'table');
    objects = objects.concat(ObjectStore.instance.getObjects<Card>('card').filter(obj => obj.location.name === 'table' && (!obj.parentIsAssigned || obj.parentIsDestroyed)));

    let maxZindex: number = -1;
    let hasConflict: boolean = false;
    for (let i = 0; i < objects.length; i++) {
      if (maxZindex === objects[i].zindex) {
        hasConflict = true;
      } else if (maxZindex < objects[i].zindex) {
        maxZindex = objects[i].zindex;
        hasConflict = false;
      }
    }

    if (maxZindex === this.zindex && !hasConflict) return;
    this.zindex = maxZindex + 1;

    if (this.zindex < objects.length + 256) return;
    objects.sort((a, b) => a.zindex - b.zindex);

    for (let i = 0; i < objects.length; i++) {
      objects[i].zindex = i;
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