import { Card } from './card';
import { ImageFile } from './core/file-storage/image-file';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { ObjectStore } from './core/synchronize-object/object-store';
import { DataElement } from './data-element';
import { PeerCursor } from './peer-cursor';
import { TabletopObject } from './tabletop-object';

@SyncObject('card-stack')
export class CardStack extends TabletopObject {
  @SyncVar() rotate: number = 0;
  @SyncVar() zindex: number = 0;
  @SyncVar() owner: string = '';
  @SyncVar() isShowTotal: boolean = true;

  get name(): string { return this.getCommonValue('name', ''); }
  get ownerName(): string {
    let object = PeerCursor.find(this.owner);
    return object ? object.name : '';
  }
  get hasOwner(): boolean { return PeerCursor.find(this.owner) != null; }

  private get cardRoot(): ObjectNode {
    for (let node of this.children) {
      if (node.getAttribute('name') === 'cardRoot') return node;
    }
    return null;
  }
  get cards(): Card[] { return this.cardRoot ? <Card[]>this.cardRoot.children.concat() : []; }
  get topCard(): Card { return this.isEmpty ? null : this.cards[0]; }
  get isEmpty(): boolean { return this.cards.length < 1 }
  get imageFile(): ImageFile { return this.topCard ? this.topCard.imageFile : null; }

  shuffle(): Card[] {
    if (!this.cardRoot) return;
    let length = this.cardRoot.children.length;
    for (let card of this.cards) {
      card.index = Math.random() * length;
      card.rotate = Math.floor(Math.random() * 2) * 180;
    }
    console.log('shuffle!!!!', this.cards.length, this.cards);
    return this.cards;
  }

  drawCard(): Card {
    let card = this.topCard ? <Card>this.cardRoot.removeChild(this.topCard) : null;
    if (card) {
      card.location.name = this.location.name;
      card.location.x = this.location.x;
      card.location.y = this.location.y;
      card.posZ = this.posZ;
      card.rotate += this.rotate;
      if (360 < card.rotate) card.rotate -= 360;
      card.toTopmost();
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
      card.posZ = this.posZ;
      card.rotate += this.rotate;
      if (360 < card.rotate) card.rotate -= 360;
    }
    return cards;
  }

  faceUp() {
    if (this.topCard) this.topCard.faceUp();
  }

  faceDown() {
    if (this.topCard) this.topCard.faceDown();
  }

  faceUpAll() {
    for (let card of this.cards) {
      card.faceUp();
    }
  }

  faceDownAll() {
    for (let card of this.cards) {
      card.faceDown();
    }
  }

  uprightAll() {
    for (let card of this.cards) {
      card.rotate = 0;
    }
  }

  unifyCardsSize(size: number): void {
    for (const card of this.cards) {
      if (card.size !== size) card.size = size;
    }
  }

  putOnTop(card: Card): Card {
    if (!this.cardRoot) return;
    if (!this.topCard) return this.putOnBottom(card);
    card.owner = '';
    card.zindex = 0;
    let delta = Math.abs(card.rotate - this.rotate);
    if (180 < delta) delta = 360 - delta;
    card.rotate = delta <= 90 ? 0 : 180;
    card.location.name = this.identifier;
    card.update();
    return <Card>this.cardRoot.insertBefore(card, this.topCard);
  }

  putOnBottom(card: Card): Card {
    if (!this.cardRoot) return;
    card.owner = '';
    card.zindex = 0;
    let delta = Math.abs(card.rotate - this.rotate);
    if (180 < delta) delta = 360 - delta;
    card.rotate = delta <= 90 ? 0 : 180;
    card.location.name = this.identifier;
    card.update();
    return <Card>this.cardRoot.appendChild(card);
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