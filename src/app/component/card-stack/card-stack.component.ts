import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { CardStackListComponent } from '../card-stack-list/card-stack-list.component';
import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ContextMenuService } from '../../service/context-menu.service';
import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerDeviceService } from '../../service/pointer-device.service';

import { CardStack } from '../../class/card-stack';
import { Card, CardState } from '../../class/card';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ImageFile } from '../../class/core/file-storage/image-file';

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
export class CardStackComponent implements OnInit {
  @ViewChild('tableMask') gameChar: ElementRef;
  @Input() cardStack: CardStack = null;
  @Input() is3D: boolean = false;

  animeState: string = 'inactive';

  private dragAreaElement: HTMLElement = null;

  private top: number = 0;
  private left: number = 0;

  private offsetTop: number = 0;
  private offsetLeft: number = 0;
  private startTop: number = 0;
  private startLeft: number = 0;
  private delta: number = 1.0;

  private callbackOnMouseDown: any = null;
  private callbackOnMouseUp: any = null;
  private callbackOnMouseMove: any = null;
  private callbackOnPanelMouseDown: any = null;

  private callbackOnRotateMouseDown: any = (e) => this.onRotateMouseDown(e);
  private callbackOnRotateMouseMove: any = (e) => this.onRotateMouseMove(e);
  private callbackOnRotateMouseUp: any = (e) => this.onRotateMouseUp(e);

  private callbackOnContextMenu: any = (e) => this.onContextMenu(e);

  private callbackOnDragstart: any = null;

  private callbackOnCardDrop: any = (e) => this.onCardDrop(e);

  private updateIntervalFlag: boolean = true;
  private lastUpdateTimeStamp: number = 0;
  isDragging: boolean = false;

  private prevTop: number = 0;
  private prevLeft: number = 0;

  gridSize: number = 50;

  private $gameCharElement: JQuery = null;
  private updateInterval: NodeJS.Timer = null;

  private doubleClickTimer: NodeJS.Timer = null;
  private doubleClickPoint = { x: 0, y: 0 };

  private startRotate: number = 0;

  private allowOpenContextMenu: boolean = false;

  constructor(
    private ngZone: NgZone,
    //private gameRoomService: GameRoomService,
    private contextMenuService: ContextMenuService,
    private modalService: ModalService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.isSendFromSelf || event.data.identifier !== this.cardStack.identifier) return;
        //console.log('UPDATE_GAME_OBJECT GameCharacterComponent ' + this.gameCharacter.identifier);
        //if (event.sender === NetworkProxy.myPeerId) return;
        this.isDragging = false;

        this.setPosition(this.cardStack.location.x, this.cardStack.location.y);
        //if (event.data.identifier === this.gameCharacter.identifier) this.changeDetector.markForCheck();
      }).on('SHUFFLE_CARD_STACK', -1000, event => {
        if (event.data.identifier !== this.cardStack.identifier) return;
        this.cardStack.shuffle();
        this.animeState = 'active';
      });
  }

  ngAfterViewInit() {
    //console.log('ngAfterViewInit', this.cardStack);
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement);

    let element = this.elementRef.nativeElement;

    this.$gameCharElement = $(this.gameChar.nativeElement);

    this.setPosition(this.cardStack.location.x, this.cardStack.location.y);

    this.callbackOnMouseDown = (e) => this.onMouseDown(e);
    this.callbackOnMouseUp = (e) => this.onMouseUp(e);
    this.callbackOnMouseMove = (e) => this.onMouseMove(e);
    this.callbackOnPanelMouseDown = (e) => this.onPanelMouseDown(e);
    this.callbackOnDragstart = (e) => this.onDragstart(e);

    element.addEventListener('mousedown', this.callbackOnMouseDown, false);
    //this.gameCharImage.nativeElement.addEventListener('mousedown', this.callbackOnMouseDown, false);
    //this.gamePanel.nativeElement.addEventListener('mousedown', this.callbackOnPanelMouseDown, false);
    element.addEventListener('dragstart', this.callbackOnDragstart, false);

    element.addEventListener('carddrop', this.callbackOnCardDrop, false);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    let element = this.elementRef.nativeElement;

    element.removeEventListener('mousedown', this.callbackOnMouseDown, false);
    //this.gameCharImage.nativeElement.removeEventListener('mousedown', this.callbackOnMouseDown, false);

    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);

    //this.gamePanel.nativeElement.removeEventListener('mousedown', this.callbackOnPanelMouseDown, false);
    element.removeEventListener('dragstart', this.callbackOnDragstart, false);

    element.removeEventListener('carddrop', this.callbackOnCardDrop, false);

    this.callbackOnMouseDown = null;
    this.callbackOnMouseUp = null;
    this.callbackOnMouseMove = null;
    this.callbackOnPanelMouseDown = null;
    this.callbackOnDragstart = null;
  }

  animationShuffleStarted(event: any) {

  }

  animationShuffleDone(event: any) {
    this.animeState = 'inactive';
  }

  private calcLocalCoordinate() {
    let coordinate = PointerDeviceService.convertToLocal(this.pointerDeviceService.pointers[0], this.dragAreaElement);
    this.top = coordinate.y;
    this.left = coordinate.x;
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
  }

  onCardDrop(e) {
    if (this.cardStack === e.detail || (e.detail instanceof Card === false && e.detail instanceof CardStack === false)) {
      console.log('onCardDrop cancel', this.cardStack.name, e.detail);
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    if (e.detail instanceof Card) {
      let card: Card = e.detail;
      let distance: number = Math.sqrt((card.location.x - this.cardStack.location.x) ** 2 + (card.location.y - this.cardStack.location.y) ** 2);
      console.log('onCardDrop Card fire', this.cardStack.name, distance);
      if (distance < 50) this.cardStack.placeToTop(card);
    } else if (e.detail instanceof CardStack) {
      let cardStack: CardStack = e.detail;
      let distance: number = Math.sqrt((cardStack.location.x - this.cardStack.location.x) ** 2 + (cardStack.location.y - this.cardStack.location.y) ** 2);
      console.log('onCardDrop CardStack fire', this.cardStack.name, distance);
      if (distance < 25) {
        /*
        let cards: Card[] = cardStack.drawCardAll();
        for (let card of cards.reverse()) this.cardStack.placeToTop(card);
        cardStack.destroy();
        */
        let cards: Card[] = this.cardStack.drawCardAll();
        cardStack.location.name = this.cardStack.location.name;
        cardStack.location.x = this.cardStack.location.x;
        cardStack.location.y = this.cardStack.location.y;
        for (let card of cards.reverse()) cardStack.placeToBottom(card);
        this.cardStack.location.name = '';
        this.cardStack.update();
        this.cardStack.destroy();
      }
    }
  }

  @HostListener('mousedown', ['$event'])
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
      }
    }
  }

  onDragstart(e) {
    console.log('Dragstart Cancel !!!!');
    e.stopPropagation();
    e.preventDefault();
  }

  onPanelMouseDown(e: MouseEvent) {
    e.stopPropagation();
    this.isDragging = false;
  }

  onMouseDown(e: any) {
    console.log('GameCharacterComponent mousedown !!!');
    this.cardStack.moveToTop();
    this.calcLocalCoordinate();
    this.allowOpenContextMenu = true;

    this.isDragging = true;

    this.offsetTop = this.cardStack.location.y - this.top;
    this.offsetLeft = this.cardStack.location.x - this.left;

    this.delta = 1.0;
    this.startTop = this.top;
    this.startLeft = this.left;

    this.prevTop = this.top;
    this.prevLeft = this.left;

    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);

    //this.elementRef.nativeElement.addEventListener('contextmenu', this.callbackOnContextMenu, false);

    console.log('onSelectedGameCharacter', this.cardStack.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.cardStack.identifier, className: 'GameCharacter' });

    e.preventDefault();
  }

  onMouseUp(e: any) {
    //console.log('GameCharacterComponent mouseup !!!!');
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    this.isDragging = false;

    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);
    //this.elementRef.nativeElement.removeEventListener('contextmenu', this.callbackOnContextMenu, false);

    let element: HTMLElement = this.elementRef.nativeElement;
    let parent = element.parentElement;
    let children = parent.children;
    let event = new CustomEvent('carddrop', { detail: this.cardStack, bubbles: true });
    for (let i = 0; i < children.length; i++) {
      children[i].dispatchEvent(event);
    }

    let deltaX = this.cardStack.location.x % 25;
    let deltaY = this.cardStack.location.y % 25;

    this.cardStack.location.x += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.cardStack.location.y += deltaY < 12.5 ? -deltaY : 25 - deltaY;
    this.cardStack.location.x -= 0;
    this.cardStack.location.y -= 5;
    this.setPosition(this.cardStack.location.x, this.cardStack.location.y);

    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.cardStack.update();
        this.updateInterval = null;
      }, 66);
    }

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.isDragging) {
      /*this.cardStack.rotate += 1;*/

      this.calcLocalCoordinate();
      if ((this.prevTop === this.top && this.prevLeft === this.left)) return;
      this.allowOpenContextMenu = false;

      let width: number = this.gridSize * 2;//this.cardStack.width;
      let height: number = this.gridSize * 3;//this.cardStack.height;

      //this.cardStack.location.x = this.left + (this.offsetLeft * this.delta) + (-(width / 2) * (1.0 - this.delta));
      //this.cardStack.location.y = this.top + (this.offsetTop * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.cardStack.location.x = this.left + (this.offsetLeft * this.delta) + (-(width / 2) * (1.0 - this.delta));
      this.cardStack.location.y = this.top + (this.offsetTop * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.setPosition(this.cardStack.location.x, this.cardStack.location.y);

      if (this.updateInterval === null) {
        this.updateInterval = setTimeout(() => {
          this.cardStack.update();
          this.updateInterval = null;
        }, 66);
      }

      let distanceY = this.startTop - this.top;
      let distanceX = this.startLeft - this.left;

      let distance = 9999;//(size * 4) / (Math.sqrt(distanceY * distanceY + distanceX * distanceX) + (size * 4));

      if (distance < this.delta) {
        this.delta = distance;
      }
      this.prevTop = this.top;
      this.prevLeft = this.left;
    }
  }

  onRotateMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.allowOpenContextMenu = true;
    e.stopPropagation();
    console.log('onRotateMouseDown!!!!');
    this.calcLocalCoordinate();
    this.startTop = this.top;
    this.startLeft = this.left;

    let div: HTMLDivElement = this.gameChar.nativeElement;
    let centerX = div.clientWidth / 2 + this.cardStack.location.x;
    let centerY = div.clientHeight / 2 + this.cardStack.location.y;
    let x = this.left - centerX;
    let y = this.top - centerY;
    //let rad = Math.atan(y / x);
    let rad = Math.atan2(y, x);

    this.startRotate = (rad * 180 / Math.PI) - this.cardStack.rotate;
    document.body.addEventListener('mouseup', this.callbackOnRotateMouseUp);
    document.body.addEventListener('mousemove', this.callbackOnRotateMouseMove);
  }

  onRotateMouseMove(e: MouseEvent) {
    e.stopPropagation();
    this.calcLocalCoordinate();
    let div: HTMLDivElement = this.gameChar.nativeElement;
    let centerX = div.clientWidth / 2 + this.cardStack.location.x;
    let centerY = div.clientHeight / 2 + this.cardStack.location.y;
    let x = this.left - centerX;
    let y = this.top - centerY;
    //console.log('onRotateMouseMove!!!!', this.left, this.top, x, y, Math.atan(y / x) * 180 / Math.PI, centerX, centerY);

    //let rad = Math.atan(y / x);
    let rad = Math.atan2(y, x);
    let angle = (rad * 180 / Math.PI) - this.startRotate;
    if (this.cardStack.rotate !== angle) {
      this.allowOpenContextMenu = false;
    }
    this.cardStack.rotate = angle;
  }

  onRotateMouseUp(e: MouseEvent) {
    this.isDragging = false;
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    e.stopPropagation();
    document.body.removeEventListener('mouseup', this.callbackOnRotateMouseUp);
    document.body.removeEventListener('mousemove', this.callbackOnRotateMouseMove);

    this.cardStack.rotate = this.cardStack.rotate < 0 ? this.cardStack.rotate - 22.5 : this.cardStack.rotate + 22.5;
    this.cardStack.rotate -= (this.cardStack.rotate) % 45;
  }

  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    if (this.allowOpenContextMenu === false) return;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      {
        name: '１枚引く', action: () => {
          let card = this.cardStack.drawCard();
          if (card) {
            card.location.x += 100 + (Math.random() * 50);
            card.location.y += 25 + (Math.random() * 50);
            card.update();
          }
        }
      },
      { name: '一番上を表にする', action: () => { this.cardStack.faceUp(); } },
      { name: '一番上を裏にする', action: () => { this.cardStack.faceDown(); } },
      { name: 'すべて表にする', action: () => { this.cardStack.faceUpAll(); } },
      { name: 'すべて裏にする', action: () => { this.cardStack.faceDownAll(); } },
      { name: 'すべて正位置にする', action: () => { this.cardStack.uprightAll(); } },
      {
        name: 'シャッフル', action: () => {
          EventSystem.call('SHUFFLE_CARD_STACK', { identifier: this.cardStack.identifier });
          //this.cardStack.shuffle();
        }
      },
      { name: 'カード一覧', action: () => { this.showStackList(this.cardStack); } },
      { name: '山札を人数分に分割する', action: () => { this.splitStack(Network.peerIds.length); } },
      { name: '山札を崩す', action: () => { this.breakStack(); } },
      { name: '詳細を表示', action: () => { this.showDetail(this.cardStack); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.cardStack.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.owner = '';
          cloneObject.update();
        }
      },
      {
        name: '山札を削除する', action: () => {
          this.cardStack.location.name = 'graveyard';
          this.cardStack.update();
          this.cardStack.destroy();
          //this.cardStack.setLocation('graveyard');
        }
      },
    ], this.cardStack.name);
  }

  private breakStack() {
    let cards = this.cardStack.drawCardAll();
    for (let card of cards.reverse()) {
      card.location.x += 25 - (Math.random() * 50);
      card.location.y += 25 - (Math.random() * 50);
      card.moveToTop();
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
      cardStack.rotate = this.cardStack.rotate;
      cardStack.update();
      cardStacks.push(cardStack);
    }

    let cards = this.cardStack.drawCardAll();
    this.cardStack.location.name = 'graveyard';
    this.cardStack.update();
    this.cardStack.destroy();

    let num = 0;
    let splitIndex = (cards.length / split) * (num + 1);
    //for (let card of cards.reverse()) {
    for (let i = 0; i < cards.length; i++) {
      cardStacks[num].placeToBottom(cards[i]);
      if (splitIndex <= i + 1) {
        num++;
        splitIndex = (cards.length / split) * (num + 1);
      }
      //if (split <= num) num = 0;
    }
  }

  private showDetail(gameObject: CardStack) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    //this.modalService.open(GameCharacterSheetComponent);
    let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private showStackList(gameObject: CardStack) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });

    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x, top: coordinate.y, width: 400, height: 600 };

    this.cardStack.owner = Network.peerId;
    let component = this.panelService.open<CardStackListComponent>(CardStackListComponent, option);
    component.cardStack = gameObject;
  }

  setPosition(x: number, y: number) {
    if (this.$gameCharElement) this.$gameCharElement.css('transform', 'translateZ(0.01px) translateX(' + x + 'px) translateY(' + y + 'px)');
  }
}
