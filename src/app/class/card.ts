import { element } from 'protractor';
import { ImageFile } from './core/file-storage/image-file';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { Network } from './core/system';
import { DataElement } from './data-element';
import { PeerCursor } from './peer-cursor';
import { TabletopObject } from './tabletop-object';
import { moveToTopmost } from './tabletop-object-util';

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

  get isVisibleOnTable(): boolean { return this.location.name === 'table' && (!this.parentIsAssigned || this.parentIsDestroyed); }

  get name(): string { return this.getCommonValue('name', ''); }
  get size(): number { return this.getCommonValue('size', 2); }
  set size(size: number) { this.setCommonValue('size', size); }
  get frontImage(): ImageFile { return this.getImageFile('front'); }
  get backImage(): ImageFile { return this.getImageFile('back'); }
  get frontText(): string { return this.getElementValue('表面','text', '') }
  get frontFontSize(): number { return this.getElementValue('表面','fontsize', 5); }
  get backText(): string { return this.getElementValue('裏面','text', ''); }
  get backFontSize(): number { return this.getElementValue('裏面','fontsize', 5); }

  get imageFile(): ImageFile { return this.isVisible ? this.frontImage : this.backImage; }
  get text(): string { return this.isVisible ? this.frontText : this.backText; }
  get fontSize(): number { return this.isVisible ? this.frontFontSize : this.backFontSize; }

  get ownerName(): string {
    let object = PeerCursor.findByUserId(this.owner);
    return object ? object.name : '';
  }

  get hasOwner(): boolean { return 0 < this.owner.length; }
  get isHand(): boolean { return Network.peerContext.userId === this.owner; }
  get isFront(): boolean { return this.state === CardState.FRONT; }
  get isVisible(): boolean { return this.isHand || this.isFront; }
  getDisplayElements() : DataElement[] {
    let elements : DataElement[] = new Array();
    if( this.isVisible ){
      let element = this.getElement('表面');
      if( element ) elements.push(element);
    }
    let element = this.getElement('裏面');
    if( element ) elements.push(element);
    return elements;
  }
  faceUp() {
    this.state = CardState.FRONT;
    this.owner = '';
  }

  faceDown() {
    this.state = CardState.BACK;
    this.owner = '';
  }

  toTopmost() {
    moveToTopmost(this, ['card-stack']);
  }

  static create(name: string, front: string, back: string, size: number = 2, identifier?: string): Card {
    let object: Card = null;

    if (identifier) {
      object = new Card(identifier);
    } else {
      object = new Card();
    }
    object.createDataElements();

    object.commonDataElement.appendChild(DataElement.create('name', name, {}, 'name_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('size', size, {}, 'size_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('front', front, { type: 'image' }, 'front_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('back', back, { type: 'image' }, 'back_' + object.identifier));
    let f = DataElement.create('表面', '', {}, '表面_' + object.identifier);
    f.appendChild(DataElement.create('text', '', { type: 'note' }, '表面_text_' + object.identifier));
    f.appendChild(DataElement.create('fontsize', 5, {}, '表面_fontsize_' + object.identifier));
    let b = DataElement.create('裏面', '', {}, '裏面_' + object.identifier);
    b.appendChild(DataElement.create('text', '', { type: 'note' }, '裏面_text_' + object.identifier));
    b.appendChild(DataElement.create('fontsize', 5, {}, '裏面_fontsize_' + object.identifier));
    object.rootDataElement.appendChild(f);
    object.rootDataElement.appendChild(b);

    object.initialize();

    return object;
  }

  static createMessageCard(name: string, front: string, back: string,
  frontText: string = '',frontFontSize: number = 5, backText: string = '', backFontSize:number = 5, size: number = 2, identifier?: string): Card{
    let object: Card = null;
  
    if (identifier) {
      object = new Card(identifier);
    } else {
      object = new Card();
    }
    object.createDataElements();
  
    object.commonDataElement.appendChild(DataElement.create('name', name, {}, 'name_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('size', size, {}, 'size_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('front', front, { type: 'image' }, 'front_' + object.identifier));
    object.imageDataElement.appendChild(DataElement.create('back', back, { type: 'image' }, 'back_' + object.identifier));
    let f = DataElement.create('表面', '', {}, '表面_' + object.identifier);
    f.appendChild(DataElement.create('text', frontText, { type: 'note' }, '表面_text_' + object.identifier));
    f.appendChild(DataElement.create('fontsize', frontFontSize, {}, '表面_fontsize_' + object.identifier));
    let b = DataElement.create('裏面', '', {}, '裏面_' + object.identifier);
    b.appendChild(DataElement.create('text', backText, { type: 'note' }, '裏面_text_' + object.identifier));
    b.appendChild(DataElement.create('fontsize', backFontSize, {}, '裏面_fontsize_' + object.identifier));
    object.rootDataElement.appendChild(f);
    object.rootDataElement.appendChild(b);
  
    object.initialize();
  
    return object;
  
  }
}