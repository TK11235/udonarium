import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';

import { Card } from '@udonarium/card';
import { CardStack } from '@udonarium/card-stack';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { EventSystem, Network } from '@udonarium/core/system';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';

import { CardStackListComponent } from 'component/card-stack-list/card-stack-list.component';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { MovableOption } from 'directive/movable.directive';
import { RotableOption } from 'directive/rotable.directive';
import { ContextMenuSeparator, ContextMenuService } from 'service/context-menu.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';

@Component({
  selector: 'card-stack',
  templateUrl: './card-stack.component.html',
  styleUrls: ['./card-stack.component.css'],
  animations: [
    trigger('shuffle', [
      state('active', style({ transform: '' })),
      transition('* => active', [
        animate('800ms ease', keyframes([
          style({ transform: 'scale3d(0, 0, 0) rotateZ(0deg)', offset: 0 }),
          style({ transform: 'scale3d(1.2, 1.2, 1.2) rotateZ(360deg)', offset: 0.5 }),
          style({ transform: 'scale3d(0.75, 0.75, 0.75) rotateZ(520deg)', offset: 0.75 }),
          style({ transform: 'scale3d(1.125, 1.125, 1.125) rotateZ(630deg)', offset: 0.875 }),
          style({ transform: 'scale3d(1.0, 1.0, 1.0) rotateZ(720deg)', offset: 1.0 })
        ]))
      ])
    ])
  ]
})
export class CardStackComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cardStack: CardStack = null;
  @Input() is3D: boolean = false;

  get name(): string { return this.cardStack.name; }
  get rotate(): number { return this.cardStack.rotate; }
  set rotate(rotate: number) { this.cardStack.rotate = rotate; }
  get zindex(): number { return this.cardStack.zindex; }
  get isShowTotal(): boolean { return this.cardStack.isShowTotal; }
  get cards(): Card[] { return this.cardStack.cards; }
  get isEmpty(): boolean { return this.cardStack.isEmpty; }
  get size(): number {
    let card = this.cardStack.topCard;
    return (card ? card.size : 2);
  }

  get hasOwner(): boolean { return this.cardStack.hasOwner; }
  get ownerName(): string { return this.cardStack.ownerName; }

  get topCard(): Card { return this.cardStack.topCard; }
  get imageFile(): ImageFile { return this.cardStack.imageFile; }

  animeState: string = 'inactive';

  private callbackOnMouseUp = (e) => this.onMouseUp(e);

  gridSize: number = 50;

  movableOption: MovableOption = {};
  rotableOption: RotableOption = {};

  private doubleClickTimer: NodeJS.Timer = null;
  private doubleClickPoint = { x: 0, y: 0 };

  constructor(
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    EventSystem.register(this)
      .on('SHUFFLE_CARD_STACK', -1000, event => {
        if (event.data.identifier === this.cardStack.identifier) this.animeState = 'active';
      });
    this.movableOption = {
      tabletopObject: this.cardStack,
      transformCssOffset: 'translateZ(0.15px)',
      colideLayers: ['terrain']
    };
    this.rotableOption = {
      tabletopObject: this.cardStack
    };
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.removeMouseEventListeners();
  }

  animationShuffleStarted(event: any) {

  }

  animationShuffleDone(event: any) {
    this.animeState = 'inactive';
  }

  @HostListener('carddrop', ['$event'])
  onCardDrop(e) {
    if (this.cardStack === e.detail || (e.detail instanceof Card === false && e.detail instanceof CardStack === false)) {
      console.log('onCardDrop cancel', this.name, e.detail);
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    if (e.detail instanceof Card) {
      let card: Card = e.detail;
      let distance: number = Math.sqrt((card.location.x - this.cardStack.location.x) ** 2 + (card.location.y - this.cardStack.location.y) ** 2 + (card.posZ - this.cardStack.posZ) ** 2);
      console.log('onCardDrop Card fire', this.name, distance);
      if (distance < 50) this.cardStack.putOnTop(card);
    } else if (e.detail instanceof CardStack) {
      let cardStack: CardStack = e.detail;
      let distance: number = Math.sqrt((cardStack.location.x - this.cardStack.location.x) ** 2 + (cardStack.location.y - this.cardStack.location.y) ** 2 + (cardStack.posZ - this.cardStack.posZ) ** 2);
      console.log('onCardDrop CardStack fire', this.cardStack.name, distance);
      if (distance < 25) {
        let cards: Card[] = this.cardStack.drawCardAll();
        cardStack.location.name = this.cardStack.location.name;
        cardStack.location.x = this.cardStack.location.x;
        cardStack.location.y = this.cardStack.location.y;
        cardStack.posZ = this.cardStack.posZ;
        for (let card of cards) cardStack.putOnBottom(card);
        this.cardStack.location.name = '';
        this.cardStack.update();
        this.cardStack.destroy();
      }
    }
  }

  onDoubleClick(e) {
    if (!this.doubleClickTimer) {
      this.doubleClickTimer = setTimeout(() => {
        clearTimeout(this.doubleClickTimer);
        this.doubleClickTimer = null;
      }, 400);
      this.doubleClickPoint = this.pointerDeviceService.pointers[0];
      return;
    }
    clearTimeout(this.doubleClickTimer);
    this.doubleClickTimer = null;
    if (this.doubleClickPoint.x === this.pointerDeviceService.pointers[0].x
      && this.doubleClickPoint.y === this.pointerDeviceService.pointers[0].y) {
      console.log('onDoubleClick !!!!');
      let card = this.cardStack.drawCard();
      if (card) {
        card.location.x += 100 + (Math.random() * 50);
        card.location.y += 25 + (Math.random() * 50);
        card.update();
        SoundEffect.play(PresetSound.cardDraw);
      }
    }
  }

  @HostListener('dragstart', ['$event'])
  onDragstart(e) {
    console.log('Dragstart Cancel !!!!');
    e.stopPropagation();
    e.preventDefault();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: any) {
    console.log('GameCharacterComponent mousedown !!!');
    this.onDoubleClick(e);
    this.cardStack.toTopmost();

    this.addMouseEventListeners();

    console.log('onSelectedGameCharacter', this.cardStack.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.cardStack.identifier, className: 'GameCharacter' });

    e.preventDefault();
  }

  onMouseUp(e: any) {
    this.removeMouseEventListeners();
    this.dispatchCardDropEvent();
    e.preventDefault();
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();
    this.removeMouseEventListeners();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;
    let position = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', position);
    this.contextMenuService.open(position, [
      {
        name: '１枚引く', action: () => {
          let card = this.cardStack.drawCard();
          if (card) {
            card.location.x += 100 + (Math.random() * 50);
            card.location.y += 25 + (Math.random() * 50);
            card.update();
            SoundEffect.play(PresetSound.cardDraw);
          }
        }
      },
      ContextMenuSeparator,
      {
        name: '一番上を表にする', action: () => {
          this.cardStack.faceUp();
          SoundEffect.play(PresetSound.cardDraw);
        }
      },
      {
        name: '一番上を裏にする', action: () => {
          this.cardStack.faceDown();
          SoundEffect.play(PresetSound.cardDraw);
        }
      },
      ContextMenuSeparator,
      {
        name: 'すべて表にする', action: () => {
          this.cardStack.faceUpAll();
          SoundEffect.play(PresetSound.cardDraw);
        }
      },
      {
        name: 'すべて裏にする', action: () => {
          this.cardStack.faceDownAll();
          SoundEffect.play(PresetSound.cardDraw);
        }
      },
      {
        name: 'すべて正位置にする', action: () => {
          this.cardStack.uprightAll();
          SoundEffect.play(PresetSound.cardDraw);
        }
      },
      ContextMenuSeparator,
      {
        name: 'シャッフル', action: () => {
          this.cardStack.shuffle();
          SoundEffect.play(PresetSound.cardShuffle);
          EventSystem.call('SHUFFLE_CARD_STACK', { identifier: this.cardStack.identifier });
        }
      },
      { name: 'カード一覧', action: () => { this.showStackList(this.cardStack); } },
      ContextMenuSeparator,
      (this.isShowTotal
        ? { name: '枚数を非表示にする', action: () => { this.cardStack.isShowTotal = false; } }
        : { name: '枚数を表示する', action: () => { this.cardStack.isShowTotal = true; } }
      ),
      { name: 'カードサイズを揃える', action: () => { if (this.cardStack.topCard) this.cardStack.unifyCardsSize(this.cardStack.topCard.size); } },
      ContextMenuSeparator,
      {
        name: '山札を人数分に分割する', action: () => {
          this.splitStack(Network.peerIds.length);
          SoundEffect.play(PresetSound.cardDraw);
        }
      },
      {
        name: '山札を崩す', action: () => {
          this.breakStack();
          SoundEffect.play(PresetSound.cardShuffle);
        }
      },
      ContextMenuSeparator,
      { name: '詳細を表示', action: () => { this.showDetail(this.cardStack); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.cardStack.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.owner = '';
          cloneObject.update();
          SoundEffect.play(PresetSound.cardPut);
        }
      },
      {
        name: '山札を削除する', action: () => {
          this.cardStack.location.name = 'graveyard';
          this.cardStack.update();
          this.cardStack.destroy();
          SoundEffect.play(PresetSound.sweep);
        }
      },
    ], this.name);
  }

  onMove() {
    SoundEffect.play(PresetSound.cardPick);
  }

  onMoved() {
    SoundEffect.play(PresetSound.cardPut);
  }

  private breakStack() {
    let cards = this.cardStack.drawCardAll();
    for (let card of cards.reverse()) {
      card.location.x += 25 - (Math.random() * 50);
      card.location.y += 25 - (Math.random() * 50);
      card.toTopmost();
      card.update();
    }
    console.log('breakStack', cards, this.cardStack.cards);
    this.cardStack.location.name = 'graveyard';
    this.cardStack.update();
    this.cardStack.destroy();
  }

  private splitStack(split: number) {
    if (split < 2) return;
    let cardStacks: CardStack[] = [];
    for (let i = 0; i < split; i++) {
      let cardStack = CardStack.create('山札');
      cardStack.location.x = this.cardStack.location.x + 50 - (Math.random() * 100);
      cardStack.location.y = this.cardStack.location.y + 50 - (Math.random() * 100);
      cardStack.location.name = this.cardStack.location.name;
      cardStack.rotate = this.rotate;
      cardStack.update();
      cardStacks.push(cardStack);
    }

    let cards = this.cardStack.drawCardAll();
    this.cardStack.location.name = 'graveyard';
    this.cardStack.update();
    this.cardStack.destroy();

    let num = 0;
    let splitIndex = (cards.length / split) * (num + 1);
    for (let i = 0; i < cards.length; i++) {
      cardStacks[num].putOnBottom(cards[i]);
      if (splitIndex <= i + 1) {
        num++;
        splitIndex = (cards.length / split) * (num + 1);
      }
    }
  }

  private dispatchCardDropEvent() {
    let element: HTMLElement = this.elementRef.nativeElement;
    let parent = element.parentElement;
    let children = parent.children;
    let event = new CustomEvent('carddrop', { detail: this.cardStack, bubbles: true });
    for (let i = 0; i < children.length; i++) {
      children[i].dispatchEvent(event);
    }
  }

  private addMouseEventListeners() {
    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
  }

  private removeMouseEventListeners() {
    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
  }

  private showDetail(gameObject: CardStack) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = '山札設定';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 300, top: coordinate.y - 300, width: 600, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private showStackList(gameObject: CardStack) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });

    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 200, top: coordinate.y - 300, width: 400, height: 600 };

    this.cardStack.owner = Network.peerId;
    let component = this.panelService.open<CardStackListComponent>(CardStackListComponent, option);
    component.cardStack = gameObject;
  }
}
