import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ContextMenuService } from '../../service/context-menu.service';
import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerDeviceService } from '../../service/pointer-device.service';

import { DataElement } from '../../class/data-element';
import { Card, CardState } from '../../class/card';
import { CardStack } from '../../class/card-stack';
import { Network, EventSystem, Event } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ImageFile } from '../../class/core/file-storage/image-file';

@Component({
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('tableMask') gameChar: ElementRef;

  @Input() card: Card = null;
  @Input() is3D: boolean = false;

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

  private callbackOnDragstart: any = null;

  private callbackOnCardDrop: any = (e) => this.onCardDrop(e);

  private updateIntervalFlag: boolean = true;
  private lastUpdateTimeStamp: number = 0;

  private _isDragging: boolean = false;

  get isDragging(): boolean { return this._isDragging };
  set isDragging(isDragging) {
    if (this._isDragging != isDragging) this.changeDetector.markForCheck();
    this._isDragging = isDragging;
  };

  //isDragging: boolean = false;

  private prevTop: number = 0;
  private prevLeft: number = 0;

  gridSize: number = 50;

  private $gameCharElement: JQuery = null;
  private updateInterval: NodeJS.Timer = null;

  private doubleClickTimer: NodeJS.Timer = null;
  private doubleClickPoint = { x: 0, y: 0 };

  private startRotate: number = 0;

  private allowOpenContextMenu: boolean = false;

  // private markForCheckTimer: NodeJS.Timer = null;

  constructor(
    private ngZone: NgZone,
    //private gameRoomService: GameRoomService,
    private contextMenuService: ContextMenuService,
    //private modalService: ModalService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.data.identifier === this.card.identifier) {
          this.changeDetector.markForCheck();
        } else if (event.data.aliasName === 'data') {
          this.changeDetector.markForCheck();
        }
        if (event.sendFrom === Network.peerId || event.data.identifier !== this.card.identifier) return;
        this.isDragging = false;
        this.setPosition(this.card.location.x, this.card.location.y);
      }).on('UPDATE_GAME_OBJECT', 1000, event => {
        if (event.sendFrom === Network.peerId || event.data.aliasName !== 'card') return;
        let object = ObjectStore.instance.get(event.data.identifier);
        if (!object) this.changeDetector.markForCheck();
      });
    if (!this.card.frontImage || !this.card.backImage || this.card.frontImage.state < 2 || this.card.backImage.state < 2) {
      let dummy = {};
      EventSystem.register(dummy)
        .on('SYNCHRONIZE_FILE_LIST', event => {
          if ((this.card.frontImage && 0 < this.card.frontImage.state) || (this.card.backImage && 0 < this.card.backImage.state)) {
            this.changeDetector.markForCheck();
          }
          if (this.card.frontImage && this.card.backImage && 2 <= this.card.frontImage.state && 2 <= this.card.backImage.state) {
            EventSystem.unregister(dummy);
          }
        })
        .on('UPDATE_FILE_RESOURE', -1000, event => {
          if ((this.card.frontImage && 0 < this.card.frontImage.state) || (this.card.backImage && 0 < this.card.backImage.state)) {
            this.changeDetector.markForCheck();
          }
          if (this.card.frontImage && this.card.backImage && 2 <= this.card.frontImage.state && 2 <= this.card.backImage.state) {
            EventSystem.unregister(dummy);
          }
        });
    }
  }

  ngAfterViewInit() {
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement);

    let element = this.elementRef.nativeElement;

    this.$gameCharElement = $(this.gameChar.nativeElement);

    this.setPosition(this.card.location.x, this.card.location.y);

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

    /*
    if (this.markForCheckTimer) {
      clearTimeout(this.markForCheckTimer);
      this.markForCheckTimer = null;
    }
    */
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
    if (this.card === e.detail || (e.detail instanceof Card === false && e.detail instanceof CardStack === false)) {
      //console.log('onCardDrop cancel', this.card.name, e.detail);
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    if (e.detail instanceof CardStack) {
      let cardStack: CardStack = e.detail;
      let distance: number = Math.sqrt((cardStack.location.x - this.card.location.x) ** 2 + (cardStack.location.y - this.card.location.y) ** 2);
      //console.log('onCardDrop CardStack fire', this.card.name, distance);
      if (distance < 25) {
        cardStack.location.x = this.card.location.x;
        cardStack.location.y = this.card.location.y;
        cardStack.placeToBottom(this.card);
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
      this.card.state = this.card.isVisible && !this.card.isHand ? CardState.BACK : CardState.FRONT;
      this.card.owner = '';
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
    this.card.moveToTop();
    //this.card.index = 9999;
    console.log('GameCharacterComponent mousedown !!!');
    this.allowOpenContextMenu = true;

    this.calcLocalCoordinate();

    this.isDragging = true;

    this.offsetTop = this.card.location.y - this.top;
    this.offsetLeft = this.card.location.x - this.left;

    this.delta = 1.0;
    this.startTop = this.top;
    this.startLeft = this.left;

    this.prevTop = this.top;
    this.prevLeft = this.left;

    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);

    console.log('onSelectedGameCharacter', this.card.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.card.identifier, className: 'GameCharacter' });

    e.preventDefault();
  }

  onMouseUp(e: any) {
    //this.card.index = 0;
    //console.log('GameCharacterComponent mouseup !!!!');
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    this.isDragging = false;

    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);

    let element: HTMLElement = this.elementRef.nativeElement;
    let parent = element.parentElement;
    let children = parent.children;
    let event = new CustomEvent('carddrop', { detail: this.card, bubbles: true });
    for (let i = 0; i < children.length; i++) {
      children[i].dispatchEvent(event);
    }

    let deltaX = this.card.location.x % 25;
    let deltaY = this.card.location.y % 25;

    this.card.location.x += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.card.location.y += deltaY < 12.5 ? -deltaY : 25 - deltaY;
    this.setPosition(this.card.location.x, this.card.location.y);

    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.card.update();
        this.updateInterval = null;
      }, 66);
    }

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.isDragging) {
      /*this.card.rotate += 1;*/

      this.calcLocalCoordinate();
      if ((this.prevTop === this.top && this.prevLeft === this.left)) return;
      this.allowOpenContextMenu = false;

      let width: number = this.gridSize * 2;//this.card.width;
      let height: number = this.gridSize * 3;//this.card.height;

      //this.card.location.x = this.left + (this.offsetLeft * this.delta) + (-(width / 2) * (1.0 - this.delta));
      //this.card.location.y = this.top + (this.offsetTop * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.card.location.x = this.left + (this.offsetLeft * this.delta) + (-(width / 2) * (1.0 - this.delta));
      this.card.location.y = this.top + (this.offsetTop * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.setPosition(this.card.location.x, this.card.location.y);

      if (this.updateInterval === null) {
        this.updateInterval = setTimeout(() => {
          this.card.update();
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
    let centerX = div.clientWidth / 2 + this.card.location.x;
    let centerY = div.clientHeight / 2 + this.card.location.y;
    let x = this.left - centerX;
    let y = this.top - centerY;
    //let rad = Math.atan(y / x);
    let rad = Math.atan2(y, x);

    this.startRotate = (rad * 180 / Math.PI) - this.card.rotate;
    document.body.addEventListener('mouseup', this.callbackOnRotateMouseUp);
    document.body.addEventListener('mousemove', this.callbackOnRotateMouseMove);
  }

  onRotateMouseMove(e: MouseEvent) {
    e.stopPropagation();
    this.calcLocalCoordinate();
    let div: HTMLDivElement = this.gameChar.nativeElement;
    let centerX = div.clientWidth / 2 + this.card.location.x;
    let centerY = div.clientHeight / 2 + this.card.location.y;
    let x = this.left - centerX;
    let y = this.top - centerY;
    //console.log('onRotateMouseMove!!!!', this.left, this.top, x, y, Math.atan(y / x) * 180 / Math.PI, centerX, centerY);

    //let rad = Math.atan(y / x);
    let rad = Math.atan2(y, x);
    let angle = (rad * 180 / Math.PI) - this.startRotate;
    if (this.card.rotate !== angle) {
      this.allowOpenContextMenu = false;
    }
    this.card.rotate = angle;
  }

  onRotateMouseUp(e: MouseEvent) {
    this.isDragging = false;
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    e.stopPropagation();
    document.body.removeEventListener('mouseup', this.callbackOnRotateMouseUp);
    document.body.removeEventListener('mousemove', this.callbackOnRotateMouseMove);

    this.card.rotate = this.card.rotate < 0 ? this.card.rotate - 22.5 : this.card.rotate + 22.5;
    this.card.rotate -= (this.card.rotate) % 45;
  }

  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    if (this.allowOpenContextMenu === false) return;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      (!this.card.isVisible || this.card.isHand ? {
        name: '表にする', action: () => {
          this.card.faceUp();
        }
      } : {
          name: '裏にする', action: () => {
            this.card.faceDown();
          }
        }),
      (this.card.isHand ? {
        name: '裏にする', action: () => {
          this.card.faceDown();
        }
      } : {
          name: '自分だけ見る', action: () => {
            this.card.faceDown();
            this.card.owner = Network.peerId;
          }
        }),
      { name: '重なったカードで山札を作る', action: () => { this.createStack(); } },
      { name: '詳細を表示', action: () => { this.showDetail(this.card); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.card.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.update();
        }
      },
      {
        name: '削除する', action: () => {
          this.card.destroy();
          //this.card.setLocation('graveyard');
        }
      },
    ], this.card.name);
  }

  private createStack() {
    let cardStack = CardStack.create('山札');
    cardStack.location.x = this.card.location.x;
    cardStack.location.y = this.card.location.y;
    cardStack.location.name = this.card.location.name;
    cardStack.rotate = this.card.rotate;
    cardStack.update();

    let cards: Card[] = ObjectStore.instance.getObjects(Card).filter((obj) => { return obj.location.name === this.card.location.name });

    cards.sort((a, b) => {
      if (a.zindex < b.zindex) return 1;
      if (a.zindex > b.zindex) return -1;
      return 0;
    });

    for (let card of cards) {
      let distance: number = Math.sqrt((card.location.x - this.card.location.x) ** 2 + (card.location.y - this.card.location.y) ** 2);
      if (distance < 100) cardStack.placeToBottom(card);
    }
  }

  private showDetail(gameObject: Card) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    //this.modalService.open(GameCharacterSheetComponent);
    let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  setPosition(x: number, y: number) {
    if (this.$gameCharElement) this.$gameCharElement.css('transform', 'translateZ(0.01px) translateX(' + x + 'px) translateY(' + y + 'px)');
    //if (this.$gameCharElement) this.$gameCharElement.css('transform', 'translateX(' + x + 'px) translateY(' + y + 'px)');
  }
}