import { Card } from './card';
import { ImageFile } from './core/file-storage/image-file';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { EventSystem } from './core/system';
import { DataElement } from './data-element';
import { PeerCursor } from './peer-cursor';
import { TabletopObject } from './tabletop-object';
import { moveToTopmost } from './tabletop-object-util';

@SyncObject('card-stack')
export class CardStack extends TabletopObject {
  @SyncVar() rotate: number = 0;
  @SyncVar() zindex: number = 0;
  @SyncVar() owner: string = '';
  @SyncVar() isShowTotal: boolean = true;

  get name(): string { return this.getCommonValue('name', ''); }
  get ownerName(): string {
    let object = PeerCursor.findByUserId(this.owner);
    return object ? object.name : '';
  }
  get hasOwner(): boolean { return 0 < this.owner.length; }

  private get cardRoot(): ObjectNode {
    for (let node of this.children) {
      if (node.getAttribute('name') === 'cardRoot') return node;
    }
    return null;
  }
  get cards(): Card[] { return this.cardRoot ? <Card[]>this.cardRoot.children : []; }
  get topCard(): Card { return this.isEmpty ? null : this.cards[0]; }
  get isEmpty(): boolean { return this.cards.length < 1 }
  get imageFile(): ImageFile { return this.topCard ? this.topCard.imageFile : null; }

  // ObjectNode Lifecycle
  onChildRemoved(child: ObjectNode) {
    super.onChildRemoved(child);
    if (child instanceof Card) {
      EventSystem.trigger('CARD_STACK_DECREASED', { cardStackIdentifier: this.identifier, cardIdentifier: child.identifier });
    }
  }

  shuffle(): Card[] {
    if (!this.cardRoot) return;
    let length = this.cardRoot.children.length;
    for (let card of this.cards) {
      card.index = Math.random() * length;
      card.rotate = Math.floor(Math.random() * 2) * 180;
      this.setSamePositionFor(card);
    }
    return this.cards;
  }

  drawCard(): Card {
    let card = this.topCard ? <Card>this.cardRoot.removeChild(this.topCard) : null;
    if (card) {
      card.rotate += this.rotate;
      if (360 < card.rotate) card.rotate -= 360;
      this.setSamePositionFor(card);
      card.toTopmost();
    }
    return card;
  }

  drawCardAll(): Card[] {
    let cards = this.cards;
    for (let card of cards) {
      this.cardRoot.removeChild(card);
      card.rotate += this.rotate;
      this.setSamePositionFor(card);
      if (360 < card.rotate) card.rotate -= 360;
    }
    return cards;
  }

  faceUp() {
    if (this.topCard) {
      this.topCard.faceUp();
      this.setSamePositionFor(this.topCard);
    }
  }

  faceDown() {
    if (this.topCard) {
      this.topCard.faceDown();
      this.setSamePositionFor(this.topCard);
    }
  }

  faceUpAll() {
    for (let card of this.cards) {
      card.faceUp();
      this.setSamePositionFor(card);
    }
  }

  faceDownAll() {
    for (let card of this.cards) {
      card.faceDown();
      this.setSamePositionFor(card);
    }
  }

  uprightAll() {
    for (let card of this.cards) {
      card.rotate = 0;
      this.setSamePositionFor(card);
    }
  }

  unifyCardsSize(size: number): void {
    for (const card of this.cards) {
      if (card.size !== size) card.size = size;
    }
  }

  putOnTop(card: Card): Card {
    if (!this.cardRoot) return null;
    if (!this.topCard) return this.putOnBottom(card);
    card.owner = '';
    card.zindex = 0;
    let delta = Math.abs(card.rotate - this.rotate);
    if (180 < delta) delta = 360 - delta;
    card.rotate = delta <= 90 ? 0 : 180;
    this.setSamePositionFor(card);
    return <Card>this.cardRoot.insertBefore(card, this.topCard);
  }

  putOnBottom(card: Card): Card {
    if (!this.cardRoot) return null;
    card.owner = '';
    card.zindex = 0;
    let delta = Math.abs(card.rotate - this.rotate);
    if (180 < delta) delta = 360 - delta;
    card.rotate = delta <= 90 ? 0 : 180;
    this.setSamePositionFor(card);
    return <Card>this.cardRoot.appendChild(card);
  }

  toTopmost() {
    moveToTopmost(this, ['card']);
  }

  // override
  setLocation(location: string) {
    super.setLocation(location);
    let cards = this.cards;
    for (let card of cards) card.setLocation(location);
  }

  private setSamePositionFor(card: Card) {
    card.location.name = this.location.name;
    card.location.x = this.location.x;
    card.location.y = this.location.y;
    card.posZ = this.posZ;
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