import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { EventSystem } from './core/system/system';
import { ObjectNode } from './core/synchronize-object/object-node';
import { ObjectStore } from './core/synchronize-object/object-store';
import { FileStorage } from './core/file-storage/file-storage';
import { ImageFile } from './core/file-storage/image-file';
import { TabletopObject } from './tabletop-object';
import { Card } from './card';
import { DataElement } from './data-element';
import { PeerCursor } from './peer-cursor';

@SyncObject('card-stack')
export class CardStack extends TabletopObject {
  @SyncVar() rotate: number = 0;
  @SyncVar() zindex: number = 0;
  @SyncVar() owner: string = '';

  private get cardRoot(): ObjectNode {
    for (let node of this.children) {
      if (node.getAttribute('name') === 'cardRoot') return node;
    }
    return null;
  }

  get hasOwner(): boolean {
    return PeerCursor.find(this.owner) != null;//ObjectStore.instance.get<PeerCursor>(this.owner) != null;
  }

  get ownerName(): string {
    let object = PeerCursor.find(this.owner);//ObjectStore.instance.get<PeerCursor>(this.owner);
    return object ? object.name : '';
  }

  get name(): string {
    let element = this.getElement('name', this.commonDataElement);
    return element ? <string>element.value : '';
  }

  get cards(): Card[] { return this.cardRoot ? <Card[]>this.cardRoot.children.concat() : []; }
  get topCard(): Card { return 0 < this.cards.length ? this.cards[0] : null; }
  get imageFile(): ImageFile { return this.topCard ? this.topCard.imageFile : null; }

  shuffle() {
    for (let card of this.cards) {
      card.shuffle();
      card.rotate = Math.floor(Math.random() * 2) * 180;
    }
    this.cardRoot.updateChildren();
    console.log('shuffle!!!!', this.cards.length, this.cards);
  }

  drawCard(): Card {
    let card = this.topCard ? <Card>this.cardRoot.removeChild(this.topCard) : null;
    if (card) {
      card.location.name = this.location.name;
      card.location.x = this.location.x;
      card.location.y = this.location.y;
      card.rotate += this.rotate;
      if (360 < card.rotate) card.rotate -= 360;
      card.moveToTop();
      card.update();
    }
    console.log('drawCard', card, this.topCard);
    return card;
  }

  drawCardAll(): Card[] {
    let cards = this.cards;
    for (let card of cards) {
      this.cardRoot.removeChild(card);
      card.location.name = this.location.name;
      card.location.x = this.location.x;
      card.location.y = this.location.y;
      card.rotate += this.rotate;
      if (360 < card.rotate) card.rotate -= 360;
    }
    return cards;
  }

  faceUp() {
    if (!this.topCard) return;
    this.topCard.faceUp();
  }

  faceDown() {
    if (!this.topCard) return;
    this.topCard.faceDown();
  }

  faceUpAll() {
    if (this.cards.length < 1) return;
    for (let card of this.cards) {
      card.faceUp();
    }
  }

  faceDownAll() {
    if (this.cards.length < 1) return;
    for (let card of this.cards) {
      card.faceDown();
    }
  }

  uprightAll() {
    for (let card of this.cards) {
      card.rotate = 0;
    }
  }

  placeToTop(card: Card): Card {
    if (!this.topCard) return this.placeToBottom(card);
    card.owner = '';
    card.zindex = 0;
    let delta = Math.abs(card.rotate - this.rotate);
    if (180 < delta) delta = 360 - delta;
    card.rotate = delta <= 90 ? 0 : 180;
    //card.rotate = this.rotate;
    card.location.name = this.identifier;
    card.update();
    return <Card>this.cardRoot.insertBefore(card, this.topCard);
  }

  placeToBottom(card: Card): Card {
    card.owner = '';
    card.zindex = 0;
    let delta = Math.abs(card.rotate - this.rotate);
    if (180 < delta) delta = 360 - delta;
    card.rotate = delta <= 90 ? 0 : 180;
    //card.rotate = this.rotate;
    card.location.name = this.identifier;
    card.update();
    return <Card>this.cardRoot.appendChild(card);
  }

  moveToTop() {
    let object: any[] = ObjectStore.instance.getObjects(CardStack);
    object = object.concat(ObjectStore.instance.getObjects(Card));
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

  static create(name: string, identifier?: string): CardStack {
    let object: CardStack = null;

    if (identifier) {
      object = new CardStack(identifier);
    } else {
      object = new CardStack();
    }
    object.createDataElements();
    object.commonDataElement.appendChild(DataElement.create('name', name, {}, 'name_' + object.identifier));
    let cardRoot = new ObjectNode('cardRoot_' + object.identifier);
    cardRoot.setAttribute('name', 'cardRoot');
    cardRoot.initialize();
    object.appendChild(cardRoot);
    object.initialize();

    return object;
  }
}