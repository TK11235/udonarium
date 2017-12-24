import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';

import { Card } from '../../class/card';
import { CardStack } from '../../class/card-stack';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { EventSystem, Network } from '../../class/core/system/system';
import { ContextMenuService } from '../../service/context-menu.service';
import { ModalService } from '../../service/modal.service';
import { PanelOption, PanelService } from '../../service/panel.service';
import { PointerCoordinate, PointerDeviceService } from '../../service/pointer-device.service';
import { CardStackListComponent } from '../card-stack-list/card-stack-list.component';
import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';

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
  @ViewChild('root') rootElementRef: ElementRef;
  @Input() cardStack: CardStack = null;
  @Input() is3D: boolean = false;

  get name(): string { return this.cardStack.name; }
  get rotate(): number { return this.cardStack.rotate; }
  set rotate(rotate: number) { this.cardStack.rotate = rotate; }
  get zindex(): number { return this.cardStack.zindex; }
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

  private _posX: number = 0;
  private _posY: number = 0;
  private _posZ: number = 0;

  get posX(): number { return this._posX; }
  set posX(posX: number) { this._posX = posX; this.setUpdateTimer(); }
  get posY(): number { return this._posY; }
  set posY(posY: number) { this._posY = posY; this.setUpdateTimer(); }
  get posZ(): number { return this._posZ; }
  set posZ(posZ: number) { this._posZ = posZ; this.setUpdateTimer(); }

  private dragAreaElement: HTMLElement = null;

  private pointer: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerOffset: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerStart: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerPrev: PointerCoordinate = { x: 0, y: 0, z: 0 };

  private delta: number = 1.0;

  private startRotate: number = 0;

  private callbackOnMouseUp = (e) => this.onMouseUp(e);
  private callbackOnMouseMove = (e) => this.onMouseMove(e);

  private callbackOnRotateMouseMove = (e) => this.onRotateMouseMove(e);
  private callbackOnRotateMouseUp = (e) => this.onRotateMouseUp(e);

  isDragging: boolean = false;

  gridSize: number = 50;

  private updateInterval: NodeJS.Timer = null;

  private doubleClickTimer: NodeJS.Timer = null;
  private doubleClickPoint = { x: 0, y: 0 };

  private isAllowedToOpenContextMenu: boolean = false;

  constructor(
    private contextMenuService: ContextMenuService,
    private modalService: ModalService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.setPosition(this.cardStack);
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.isSendFromSelf || event.data.identifier !== this.cardStack.identifier) return;
        this.isDragging = false;
        this.setPosition(this.cardStack);
      }).on('SHUFFLE_CARD_STACK', -1000, event => {
        if (event.data.identifier !== this.cardStack.identifier) return;
        if (event.isSendFromSelf) this.cardStack.shuffle();
        this.animeState = 'active';
      });
  }

  ngAfterViewInit() {
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.removeMouseEventListeners();
    this.removeRotateEventListeners();
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
      let distance: number = Math.sqrt((card.location.x - this.posX) ** 2 + (card.location.y - this.posY) ** 2);
      console.log('onCardDrop Card fire', this.name, distance);
      if (distance < 50) this.cardStack.putOnTop(card);
    } else if (e.detail instanceof CardStack) {
      let cardStack: CardStack = e.detail;
      let distance: number = Math.sqrt((cardStack.location.x - this.posX) ** 2 + (cardStack.location.y - this.posY) ** 2);
      console.log('onCardDrop CardStack fire', this.cardStack.name, distance);
      if (distance < 25) {
        let cards: Card[] = this.cardStack.drawCardAll();
        cardStack.location.name = this.cardStack.location.name;
        cardStack.location.x = this.posX;
        cardStack.location.y = this.posY;
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
    this.calcLocalCoordinate();
    this.isAllowedToOpenContextMenu = true;

    this.isDragging = true;

    this.pointerOffset.y = this.posY - this.pointer.y;
    this.pointerOffset.x = this.posX - this.pointer.x;

    this.delta = 1.0;
    this.pointerStart.y = this.pointerPrev.y = this.pointer.y;
    this.pointerStart.x = this.pointerPrev.x = this.pointer.x;

    this.addMouseEventListeners();

    console.log('onSelectedGameCharacter', this.cardStack.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.cardStack.identifier, className: 'GameCharacter' });

    e.preventDefault();
  }

  onMouseUp(e: any) {
    //console.log('GameCharacterComponent mouseup !!!!');
    setTimeout(() => { this.isAllowedToOpenContextMenu = false; }, 0);
    this.isDragging = false;

    this.removeMouseEventListeners();
    this.dispatchCardDropEvent();

    let deltaX = this.posX % 25;
    let deltaY = this.posY % 25;

    this.posX += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.posY += deltaY < 12.5 ? -deltaY : 25 - deltaY;
    this.posX -= 0;
    this.posY -= 5;

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.isDragging) {
      this.calcLocalCoordinate();
      if ((this.pointerPrev.y === this.pointer.y && this.pointerPrev.x === this.pointer.x)) return;
      this.isAllowedToOpenContextMenu = false;

      let width: number = this.gridSize * 2;//this.cardStack.width;
      let height: number = this.gridSize * 3;//this.cardStack.height;

      this.posX = this.pointer.x + (this.pointerOffset.x * this.delta) + (-(width / 2) * (1.0 - this.delta));
      this.posY = this.pointer.y + (this.pointerOffset.y * this.delta) + (-(height / 2) * (1.0 - this.delta));

      let distanceY = this.pointerStart.y - this.pointer.y;
      let distanceX = this.pointerStart.x - this.pointer.x;

      let distance = 9999;//(size * 4) / (Math.sqrt(distanceY * distanceY + distanceX * distanceX) + (size * 4));

      if (distance < this.delta) {
        this.delta = distance;
      }
      this.pointerPrev.y = this.pointer.y;
      this.pointerPrev.x = this.pointer.x;
    }
  }

  onRotateMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.isAllowedToOpenContextMenu = true;
    e.stopPropagation();
    console.log('onRotateMouseDown!!!!');
    this.calcLocalCoordinate();
    this.startRotate = this.calcRotate(this.pointer, this.rotate);
    this.addRotateEventListeners();
  }

  onRotateMouseMove(e: MouseEvent) {
    e.stopPropagation();
    this.calcLocalCoordinate();
    let angle = this.calcRotate(this.pointer, this.startRotate);
    if (this.rotate !== angle) {
      this.isAllowedToOpenContextMenu = false;
    }
    this.rotate = angle;
  }

  onRotateMouseUp(e: MouseEvent) {
    this.isDragging = false;
    setTimeout(() => { this.isAllowedToOpenContextMenu = false; }, 0);
    e.stopPropagation();
    this.removeRotateEventListeners();

    this.rotate = this.rotate < 0 ? this.rotate - 22.5 : this.rotate + 22.5;
    this.rotate -= (this.rotate) % 45;
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();
    this.removeMouseEventListeners();
    this.removeRotateEventListeners();

    if (this.isAllowedToOpenContextMenu === false) return;
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
        }
      },
    ], this.name);
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
      cardStack.location.x = this.posX + 50 - (Math.random() * 100);
      cardStack.location.y = this.posY + 50 - (Math.random() * 100);
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

  private calcLocalCoordinate() {
    let coordinate = PointerDeviceService.convertToLocal(this.pointerDeviceService.pointers[0], this.dragAreaElement);
    this.pointer.y = coordinate.y;
    this.pointer.x = coordinate.x;
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
  }

  private setUpdateTimer() {
    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.cardStack.location.x = this.posX;
        this.cardStack.location.y = this.posY;
        this.cardStack.posZ = this.posZ;
        this.updateInterval = null;
      }, 66);
    }
  }

  private calcRotate(pointer: PointerCoordinate, startRotate: number): number {
    let div: HTMLDivElement = this.rootElementRef.nativeElement;
    let centerX = div.clientWidth / 2 + this.posX;
    let centerY = div.clientHeight / 2 + this.posY;
    let x = pointer.x - centerX;
    let y = pointer.y - centerY;
    let rad = Math.atan2(y, x);
    return (rad * 180 / Math.PI) - startRotate;
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
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);
  }

  private removeMouseEventListeners() {
    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);
  }

  private addRotateEventListeners() {
    document.body.addEventListener('mouseup', this.callbackOnRotateMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnRotateMouseMove, false);
  }

  private removeRotateEventListeners() {
    document.body.removeEventListener('mouseup', this.callbackOnRotateMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnRotateMouseMove, false);
  }

  private setPosition(object: CardStack) {
    this._posX = object.location.x;
    this._posY = object.location.y;
    this._posZ = object.posZ;
  }

  private showDetail(gameObject: CardStack) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 300, top: coordinate.y - 300, width: 600, height: 600 };
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
