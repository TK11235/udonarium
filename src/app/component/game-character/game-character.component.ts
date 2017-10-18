import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ContextMenuService } from '../../service/context-menu.service';
//import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerCoordinate, PointerDeviceService } from '../../service/pointer-device.service';
import { ChatPaletteComponent } from '../chat-palette/chat-palette.component';

import { ChatPalette } from '../../class/chat-palette';
import { GameCharacter, GameCharacterContainer } from '../../class/game-character';
import { DataElement } from '../../class/data-element';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ImageFile } from '../../class/core/file-storage/image-file';

/*import * as $ from 'jquery';*/

@Component({
  selector: 'game-character, [game-character]',
  templateUrl: './game-character.component.html',
  styleUrls: ['./game-character.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'scale3d(1, 1, 1)' })),
      transition('void => *', [
        //style({ transform: 'scale3d(0, 0, 0)' }),
        //animate(100)
        animate('600ms ease', keyframes([
          style({ transform: 'scale3d(0, 0, 0)', offset: 0 }),
          style({ transform: 'scale3d(1.5, 1.5, 1.5)', offset: 0.5 }),
          style({ transform: 'scale3d(0.75, 0.75, 0.75)', offset: 0.75 }),
          style({ transform: 'scale3d(1.125, 1.125, 1.125)', offset: 0.875 }),
          style({ transform: 'scale3d(1.0, 1.0, 1.0)', offset: 1.0 })
        ]))
      ]),
      transition('* => void', [
        animate(100, style({ transform: 'scale3d(0, 0, 0)' }))
      ])
    ])
  ]
})
export class GameCharacterComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('gameChar') gameChar: ElementRef;
  @ViewChild('gameCharImage') gameCharImage: ElementRef;
  @ViewChild('gamePanel') gamePanel: ElementRef;

  @Input() gameCharacter: GameCharacter = null;
  //@Input() top: number = 0;
  //@Input() left: number = 0;
  @Input() is3D: boolean = false;

  private dragAreaElement: HTMLElement = null;

  private top: number = 0;
  private left: number = 0;
  private depth: number = 0;

  private offsetTop: number = 0;
  private offsetLeft: number = 0;
  private startTop: number = 0;
  private startLeft: number = 0;
  private startDepth: number = 0;
  private delta: number = 1.0;

  private callbackOnMouseDown: any = null;
  private callbackOnMouseUp: any = null;
  private callbackOnMouseMove: any = null;
  private callbackOnPanelMouseDown: any = null;

  private callbackOnDragstart: any = null;

  private updateIntervalFlag: boolean = true;
  private lastUpdateTimeStamp: number = 0;
  isDragging: boolean = false;

  private prevTop: number = 0;
  private prevLeft: number = 0;
  private prevDepth: number = 0;

  gridSize: number = 50;

  private $gameCharElement: JQuery = null;

  private updateInterval: NodeJS.Timer = null;

  private allowOpenContextMenu: boolean = false;

  get isPointerDragging(): boolean { return this.pointerDeviceService.isDragging; }

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
        if (event.isSendFromSelf || event.data.identifier !== this.gameCharacter.identifier) return;
        //console.log('UPDATE_GAME_OBJECT GameCharacterComponent ' + event.sendFrom, Network.peerId);
        //if (event.sender === NetworkProxy.myPeerId) return;
        this.isDragging = false;
        //let container: GameCharacterContainer = event.data.syncData;
        this.setPosition(this.gameCharacter.location.x, this.gameCharacter.location.y, this.gameCharacter.posZ);
        //if (event.data.identifier === this.gameCharacter.identifier) this.changeDetector.markForCheck();
      });
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement.parentElement);

    let element = this.elementRef.nativeElement;

    this.$gameCharElement = $(this.gameChar.nativeElement);

    this.setPosition(this.gameCharacter.location.x, this.gameCharacter.location.y, this.gameCharacter.posZ);

    this.callbackOnMouseDown = (e) => this.onMouseDown(e);
    this.callbackOnMouseUp = (e) => this.onMouseUp(e);
    this.callbackOnMouseMove = (e) => this.onMouseMove(e);
    this.callbackOnPanelMouseDown = (e) => this.onPanelMouseDown(e);
    this.callbackOnDragstart = (e) => this.onDragstart(e);

    element.addEventListener('mousedown', this.callbackOnMouseDown, false);
    //this.gameCharImage.nativeElement.addEventListener('mousedown', this.callbackOnMouseDown, false);
    this.gamePanel.nativeElement.addEventListener('mousedown', this.callbackOnPanelMouseDown, false);
    element.addEventListener('dragstart', this.callbackOnDragstart, false);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    let element = this.elementRef.nativeElement;

    element.removeEventListener('mousedown', this.callbackOnMouseDown, false);
    //this.gameCharImage.nativeElement.removeEventListener('mousedown', this.callbackOnMouseDown, false);

    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);

    this.gamePanel.nativeElement.removeEventListener('mousedown', this.callbackOnPanelMouseDown, false);
    element.removeEventListener('dragstart', this.callbackOnDragstart, false);

    this.callbackOnMouseDown = null;
    this.callbackOnMouseUp = null;
    this.callbackOnMouseMove = null;
    this.callbackOnPanelMouseDown = null;
    this.callbackOnDragstart = null;
  }

  private calcLocalCoordinate(event: Event) {
    /*
    let coordinate: PointerCoordinate = this.pointerDeviceService.pointers[0];
    coordinate = PointerDeviceService.convertToLocal(coordinate, this.dragAreaElement);
    this.top = coordinate.y;
    this.left = coordinate.x;
    */
    let isTerrain = true;
    let isCharacter = false;
    let node: HTMLElement = <HTMLElement>event.target;
    while (node) {
      if (node === this.dragAreaElement) break;
      if (node === this.gameChar.nativeElement) {
        isTerrain = false;
        isCharacter = true;
        break;
      }
      node = node.parentElement;
    }
    if (node == null) isTerrain = false;

    let coordinate: PointerCoordinate = this.pointerDeviceService.pointers[0];
    if (!isTerrain) {
      coordinate = PointerDeviceService.convertToLocal(coordinate, this.dragAreaElement);
      coordinate.z = isCharacter ? this.depth : 0;
    } else {
      coordinate = PointerDeviceService.convertLocalToLocal(coordinate, <HTMLElement>event.target, this.dragAreaElement);
    }
    this.top = coordinate.y;
    this.left = coordinate.x;
    this.depth = 0 < coordinate.z ? coordinate.z : 0;
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
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
    /*
    this.calcLocalCoordinate(e);


    this.allowOpenContextMenu = true;

    //this.changeDetector.markForCheck();

    this.offsetTop = this.gameCharacter.location.y - this.top;
    this.offsetLeft = this.gameCharacter.location.x - this.left;

    this.delta = 1.0;
    this.startTop = this.top;
    this.startLeft = this.left;

    this.prevTop = this.top;
    this.prevLeft = this.left;
    */
    this.allowOpenContextMenu = true;

    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);

    console.log('onSelectedGameCharacter', this.gameCharacter);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.gameCharacter.identifier, className: this.gameCharacter.aliasName });

    e.preventDefault();
  }

  onMouseUp(e: any) {
    //console.log('GameCharacterComponent mouseup !!!!');
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    this.isDragging = false;
    //this.changeDetector.markForCheck();

    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);

    let deltaX = this.gameCharacter.location.x % 25;
    let deltaY = this.gameCharacter.location.y % 25;

    this.gameCharacter.location.x += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.gameCharacter.location.y += deltaY < 12.5 ? -deltaY : 25 - deltaY;
    this.gameCharacter.posZ = this.depth;
    this.setPosition(this.gameCharacter.location.x, this.gameCharacter.location.y, this.gameCharacter.posZ);

    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.gameCharacter.update();
        this.updateInterval = null;
      }, 66);
    }

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.isDragging) {
      this.calcLocalCoordinate(e);
      if ((this.prevTop === this.top && this.prevLeft === this.left && this.prevDepth === this.depth)) return;
      this.allowOpenContextMenu = false;
      let size: number = this.gridSize * this.gameCharacter.size;

      let distanceY = this.startTop - this.top;
      let distanceX = this.startLeft - this.left;
      let distanceZ = (this.startDepth - this.depth) * this.gridSize * 3;

      let ratio: number = this.gameCharacter.size;
      ratio = ratio < 0 ? 0.01 : ratio;
      ratio = this.gridSize * 4 * 9 / (ratio + 2);

      let distance = ratio / (Math.sqrt(distanceY * distanceY + distanceX * distanceX + distanceZ * distanceZ) + ratio);

      if (distance < this.delta) {
        this.delta = distance;
      }
      this.prevTop = this.top;
      this.prevLeft = this.left;
      this.prevDepth = this.depth;

      this.gameCharacter.location.x = this.left + (this.offsetLeft * this.delta) + (-(size / 2) * (1.0 - this.delta));
      this.gameCharacter.location.y = this.top + (this.offsetTop * this.delta) + (-(size / 2) * (1.0 - this.delta));
      this.gameCharacter.posZ = this.depth;
      this.setPosition(this.gameCharacter.location.x, this.gameCharacter.location.y, this.gameCharacter.posZ);

      if (this.updateInterval === null) {
        this.updateInterval = setTimeout(() => {
          this.gameCharacter.update();
          this.updateInterval = null;
        }, 66);
      }
    } else {
      this.depth = this.gameCharacter.posZ;
      this.startDepth = this.depth;
      this.prevDepth = this.depth;
      this.calcLocalCoordinate(e);

      this.isDragging = true;
      //this.allowOpenContextMenu = true;
      //this.changeDetector.markForCheck();

      this.offsetTop = this.gameCharacter.location.y - this.top;
      this.offsetLeft = this.gameCharacter.location.x - this.left;

      this.delta = 1.0;
      this.startTop = this.top;
      this.startLeft = this.left;

      this.prevTop = this.top;
      this.prevLeft = this.left;
    }
  }

  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    if (this.allowOpenContextMenu === false) return;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      { name: '詳細を表示', action: () => { this.showDetail(this.gameCharacter); } },
      { name: 'チャットパレットを表示', action: () => { this.showChatPalette(this.gameCharacter) } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.gameCharacter.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.update();
        }
      },
      { name: '共有イベントリに移動', action: () => { this.gameCharacter.setLocation('common'); } },
      { name: '個人イベントリに移動', action: () => { this.gameCharacter.setLocation(Network.peerId); } },
      { name: '墓場に移動', action: () => { this.gameCharacter.setLocation('graveyard'); } }
    ], this.gameCharacter.name);
  }

  private showDetail(gameObject: GameCharacter) {
    //console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    //EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    //this.modalService.open(GameCharacterSheetComponent);
    let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private showChatPalette(gameObject: GameCharacter) {
    let option: PanelOption = { left: 0, top: 0, width: 500, height: 350 };
    let component = this.panelService.open<ChatPaletteComponent>(ChatPaletteComponent, option);
    component.character = gameObject;
  }

  setPosition(x: number, y: number, z: number) {
    if (this.$gameCharElement) this.$gameCharElement.css('transform', 'translateZ(' + (0.01 + z) + 'px) translateX(' + x + 'px) translateY(' + y + 'px)');
    //if (this.$gameCharElement) this.$gameCharElement.css('transform', 'translateX(' + x + 'px) translateY(' + y + 'px)');
  }
}
