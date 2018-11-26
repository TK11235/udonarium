import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { Card, CardState } from '@udonarium/card';
import { CardStack } from '@udonarium/card-stack';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system/system';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';

import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { MovableOption } from 'directive/movable.directive';
import { RotableOption } from 'directive/rotable.directive';
import { ContextMenuService } from 'service/context-menu.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';

@Component({
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit, OnDestroy, AfterViewInit {
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

  gridSize: number = 50;

  movableOption: MovableOption = {};
  rotableOption: RotableOption = {};

  private doubleClickTimer: NodeJS.Timer = null;
  private doubleClickPoint = { x: 0, y: 0 };

  private callbackOnMouseUp = (e) => this.onMouseUp(e);

  constructor(
    private contextMenuService: ContextMenuService,
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
        if (event.isSendFromSelf || event.data.identifier !== this.card.identifier) return;
      })
      .on('UPDATE_GAME_OBJECT', 1000, event => {
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
    this.movableOption = {
      tabletopObject: this.card,
      transformCssOffset: 'translateZ(0.15px)',
      colideLayers: ['terrain']
    };
    this.rotableOption = {
      tabletopObject: this.card
    };
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.removeMouseEventListeners();
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
      let distance: number = Math.sqrt((cardStack.location.x - this.card.location.x) ** 2 + (cardStack.location.y - this.card.location.y) ** 2 + (cardStack.posZ - this.card.posZ) ** 2);
      //console.log('onCardDrop CardStack fire', this.card.name, distance);
      if (distance < 25) {
        cardStack.location.x = this.card.location.x;
        cardStack.location.y = this.card.location.y;
        cardStack.posZ = this.card.posZ;
        cardStack.putOnBottom(this.card);
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
      SoundEffect.play(PresetSound.cardDraw);
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
    this.card.toTopmost();
    console.log('GameCharacterComponent mousedown !!!');

    this.addMouseEventListeners();

    e.preventDefault();
  }

  onMouseUp(e: any) {
    console.log('onMouseUp Card !!!!');
    e.preventDefault();
    this.dispatchCardDropEvent();
    this.removeMouseEventListeners();
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();
    this.removeMouseEventListeners();
    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      (!this.isVisible || this.isHand
        ? {
          name: '表にする', action: () => {
            this.card.faceUp();
            SoundEffect.play(PresetSound.cardDraw);
          }
        }
        : {
          name: '裏にする', action: () => {
            this.card.faceDown();
            SoundEffect.play(PresetSound.cardDraw);
          }
        }
      ),
      (this.isHand
        ? {
          name: '裏にする', action: () => {
            this.card.faceDown();
            SoundEffect.play(PresetSound.cardDraw);
          }
        }
        : {
          name: '自分だけ見る', action: () => {
            SoundEffect.play(PresetSound.cardDraw);
            this.card.faceDown();
            this.owner = Network.peerId;
          }
        }),
      {
        name: '重なったカードで山札を作る', action: () => {
          this.createStack();
          SoundEffect.play(PresetSound.cardPut);
        }
      },
      { name: 'カードを編集', action: () => { this.showDetail(this.card); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.card.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.update();
          SoundEffect.play(PresetSound.cardPut);
        }
      },
      {
        name: '削除する', action: () => {
          this.card.destroy();
          SoundEffect.play(PresetSound.delete);
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

  private addMouseEventListeners() {
    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
  }

  private removeMouseEventListeners() {
    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
  }

  private createStack() {
    let cardStack = CardStack.create('山札');
    cardStack.location.x = this.card.location.x;
    cardStack.location.y = this.card.location.y;
    cardStack.location.name = this.card.location.name;
    cardStack.rotate = this.rotate;
    cardStack.update();

    let cards: Card[] = ObjectStore.instance.getObjects<Card>(Card).filter((obj) => { return obj.location.name === this.card.location.name });

    cards.sort((a, b) => {
      if (a.zindex < b.zindex) return 1;
      if (a.zindex > b.zindex) return -1;
      return 0;
    });

    for (let card of cards) {
      let distance: number = Math.sqrt((card.location.x - this.card.location.x) ** 2 + (card.location.y - this.card.location.y) ** 2);
      if (distance < 100) cardStack.putOnBottom(card);
    }
  }

  private dispatchCardDropEvent() {
    console.log('dispatchCardDropEvent');
    let element: HTMLElement = this.elementRef.nativeElement;
    let parent = element.parentElement;
    let children = parent.children;
    let event = new CustomEvent('carddrop', { detail: this.card, bubbles: true });
    for (let i = 0; i < children.length; i++) {
      children[i].dispatchEvent(event);
    }
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  private showDetail(gameObject: Card) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = 'カード設定';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 300, top: coordinate.y - 300, width: 600, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }
}