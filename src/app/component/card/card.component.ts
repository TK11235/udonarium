import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ContextMenuService } from '../../service/context-menu.service';
import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerDeviceService, PointerCoordinate } from '../../service/pointer-device.service';

import { DataElement } from '../../class/data-element';
import { Card, CardState } from '../../class/card';
import { CardStack } from '../../class/card-stack';
import { Network, EventSystem, Event } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ImageFile } from '../../class/core/file-storage/image-file';

@Component({
  selector: 'card, [card]',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('root') rootElementRef: ElementRef;

  @Input() card: Card = null;
  @Input() is3D: boolean = false;

  get name(): string { return this.card.name; }
  get state(): CardState { return this.card.state; }
  set state(state: CardState) { this.card.state = state; }
  get rotate(): number { return this.card.rotate; }
  set rotate(rotate: number) { this.card.rotate = rotate; }
  get owner(): string { return this.card.owner; }
  set owner(owner: string) { this.card.owner = owner; }
  get zindex(): number { return this.card.zindex; }
  get size(): number { return this.adjustMinBounds(this.card.size); }

  get isHand(): boolean { return this.card.isHand; }
  get isFront(): boolean { return this.card.isFront; }
  get isVisible(): boolean { return this.card.isVisible; }
  get hasOwner(): boolean { return this.card.hasOwner; }
  get ownerName(): string { return this.card.ownerName; }

  get imageFile(): ImageFile { return this.card.imageFile; }
  get frontImage(): ImageFile { return this.card.frontImage; }
  get backImage(): ImageFile { return this.card.backImage; }

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

  private callbackOnMouseUp: any = (e) => this.onMouseUp(e);
  private callbackOnMouseMove: any = (e) => this.onMouseMove(e);

  private callbackOnRotateMouseMove: any = (e) => this.onRotateMouseMove(e);
  private callbackOnRotateMouseUp: any = (e) => this.onRotateMouseUp(e);

  private _isDragging: boolean = false;

  get isDragging(): boolean { return this._isDragging };
  set isDragging(isDragging) {
    if (this._isDragging != isDragging) this.changeDetector.markForCheck();
    this._isDragging = isDragging;
  };

  gridSize: number = 50;

  private updateInterval: NodeJS.Timer = null;

  private doubleClickTimer: NodeJS.Timer = null;
  private doubleClickPoint = { x: 0, y: 0 };

  private startRotate: number = 0;

  private allowOpenContextMenu: boolean = false;

  constructor(
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.setPosition(this.card);
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.data.identifier === this.card.identifier) {
          this.changeDetector.markForCheck();
        } else if (event.data.aliasName === 'data') {
          this.changeDetector.markForCheck();
        }
        if (event.isSendFromSelf || event.data.identifier !== this.card.identifier) return;
        this.isDragging = false;
        this.setPosition(this.card);
      }).on('UPDATE_GAME_OBJECT', 1000, event => {
        if (event.isSendFromSelf || event.data.aliasName !== 'card') return;
        let object = ObjectStore.instance.get(event.data.identifier);
        if (!object) this.changeDetector.markForCheck();
      });
    if (!this.frontImage || !this.backImage || this.frontImage.state < 2 || this.backImage.state < 2) {
      let dummy = {};
      EventSystem.register(dummy)
        .on('SYNCHRONIZE_FILE_LIST', event => {
          if ((this.frontImage && 0 < this.frontImage.state) || (this.backImage && 0 < this.backImage.state)) {
            this.changeDetector.markForCheck();
          }
          if (this.frontImage && this.backImage && 2 <= this.frontImage.state && 2 <= this.backImage.state) {
            EventSystem.unregister(dummy);
          }
        })
        .on('UPDATE_FILE_RESOURE', -1000, event => {
          if ((this.frontImage && 0 < this.frontImage.state) || (this.backImage && 0 < this.backImage.state)) {
            this.changeDetector.markForCheck();
          }
          if (this.frontImage && this.backImage && 2 <= this.frontImage.state && 2 <= this.backImage.state) {
            EventSystem.unregister(dummy);
          }
        });
    }
  }

  ngAfterViewInit() {
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.removeMouseEventListeners();
    this.removeRotateEventListeners();
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

  @HostListener('carddrop', ['$event'])
  onCardDrop(e) {
    if (this.card === e.detail || (e.detail instanceof Card === false && e.detail instanceof CardStack === false)) {
      //console.log('onCardDrop cancel', this.card.name, e.detail);
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    if (e.detail instanceof CardStack) {
      let cardStack: CardStack = e.detail;
      let distance: number = Math.sqrt((cardStack.location.x - this.posX) ** 2 + (cardStack.location.y - this.posY) ** 2);
      //console.log('onCardDrop CardStack fire', this.card.name, distance);
      if (distance < 25) {
        cardStack.location.x = this.posX;
        cardStack.location.y = this.posY;
        cardStack.placeToBottom(this.card);
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
      this.state = this.isVisible && !this.isHand ? CardState.BACK : CardState.FRONT;
      this.owner = '';
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
    this.onDoubleClick(e);
    this.card.moveToTop();
    console.log('GameCharacterComponent mousedown !!!');
    this.allowOpenContextMenu = true;

    this.calcLocalCoordinate();

    this.isDragging = true;

    this.pointerOffset.y = this.posY - this.pointer.y;
    this.pointerOffset.x = this.posX - this.pointer.x;

    this.delta = 1.0;
    this.pointerStart.y = this.pointerPrev.y = this.pointer.y;
    this.pointerStart.x = this.pointerPrev.x = this.pointer.x;

    this.addMouseEventListeners();

    console.log('onSelectedGameCharacter', this.card.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.card.identifier, className: 'GameCharacter' });

    e.preventDefault();
  }

  onMouseUp(e: any) {
    //console.log('GameCharacterComponent mouseup !!!!');
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    this.isDragging = false;

    this.removeMouseEventListeners();
    this.dispatchCardDropEvent();

    let deltaX = this.posX % 25;
    let deltaY = this.posY % 25;

    this.posX += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.posY += deltaY < 12.5 ? -deltaY : 25 - deltaY;

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.isDragging) {
      this.calcLocalCoordinate();
      if ((this.pointerPrev.y === this.pointer.y && this.pointerPrev.x === this.pointer.x)) return;
      this.allowOpenContextMenu = false;

      let width: number = this.gridSize * 2;//this.card.width;
      let height: number = this.gridSize * 3;//this.card.height;

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
    this.allowOpenContextMenu = true;
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
    if (this.rotate !== angle) this.allowOpenContextMenu = false;
    this.rotate = angle;
  }

  onRotateMouseUp(e: MouseEvent) {
    this.isDragging = false;
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
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

    if (this.allowOpenContextMenu === false) return;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      (!this.isVisible || this.isHand
        ? { name: '表にする', action: () => { this.card.faceUp(); } }
        : { name: '裏にする', action: () => { this.card.faceDown(); } }
      ),
      (this.isHand
        ? { name: '裏にする', action: () => { this.card.faceDown(); } }
        : {
          name: '自分だけ見る', action: () => {
            this.card.faceDown();
            this.owner = Network.peerId;
          }
        }),
      { name: '重なったカードで山札を作る', action: () => { this.createStack(); } },
      { name: 'カードを編集', action: () => { this.showDetail(this.card); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.card.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.update();
        }
      },
      { name: '削除する', action: () => { this.card.destroy(); } },
    ], this.name);
  }

  private createStack() {
    let cardStack = CardStack.create('山札');
    cardStack.location.x = this.posX;
    cardStack.location.y = this.posY;
    cardStack.location.name = this.card.location.name;
    cardStack.rotate = this.rotate;
    cardStack.update();

    let cards: Card[] = ObjectStore.instance.getObjects(Card).filter((obj) => { return obj.location.name === this.card.location.name });

    cards.sort((a, b) => {
      if (a.zindex < b.zindex) return 1;
      if (a.zindex > b.zindex) return -1;
      return 0;
    });

    for (let card of cards) {
      let distance: number = Math.sqrt((card.location.x - this.posX) ** 2 + (card.location.y - this.posY) ** 2);
      if (distance < 100) cardStack.placeToBottom(card);
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

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  private showDetail(gameObject: Card) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 300, top: coordinate.y - 300, width: 600, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private dispatchCardDropEvent() {
    let element: HTMLElement = this.elementRef.nativeElement;
    let parent = element.parentElement;
    let children = parent.children;
    let event = new CustomEvent('carddrop', { detail: this.card, bubbles: true });
    for (let i = 0; i < children.length; i++) {
      children[i].dispatchEvent(event);
    }
  }

  calcRotate(pointer: PointerCoordinate, startRotate: number): number {
    let div: HTMLDivElement = this.rootElementRef.nativeElement;
    let centerX = div.clientWidth / 2 + this.posX;
    let centerY = div.clientHeight / 2 + this.posY;
    let x = pointer.x - centerX;
    let y = pointer.y - centerY;
    let rad = Math.atan2(y, x);
    return (rad * 180 / Math.PI) - startRotate;
  }

  private setPosition(object: Card) {
    this._posX = object.location.x;
    this._posY = object.location.y;
    this._posZ = object.posZ;
  }

  private setUpdateTimer() {
    this.changeDetector.markForCheck();
    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.card.location.x = this.posX;
        this.card.location.y = this.posY;
        this.card.posZ = this.posZ;
        this.updateInterval = null;
      }, 66);
    }
  }
}