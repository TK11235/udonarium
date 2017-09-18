import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
  OnInit, OnDestroy, NgZone, ViewChild, AfterViewInit, ElementRef
} from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { ContextMenuService } from '../../service/context-menu.service';
import { PointerDeviceService, PointerCoordinate } from '../../service/pointer-device.service';
import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';

import { GameTableSettingComponent } from '../game-table-setting/game-table-setting.component';
import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ChatPaletteComponent } from '../chat-palette/chat-palette.component';

import { ChatPalette } from '../../class/chat-palette';
import { Card } from '../../class/card';
import { CardStack } from '../../class/card-stack';
import { TabletopObject } from '../../class/tabletop-object';
import { GameTable } from '../../class/game-table';
import { GameCharacter } from '../../class/game-character';
import { GameTableMask } from '../../class/game-table-mask';
import { TableSelecter } from '../../class/table-selecter';
import { ObjectSerializer } from '../../class/core/synchronize-object/object-serializer';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { FileStorage } from '../../class/core/file-storage/file-storage';
import { ImageFile, ImageContext } from '../../class/core/file-storage/image-file';

/*import * as $ from 'jquery';*/

@Component({
  selector: 'game-table',
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.css'],
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
export class GameTableComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('gameTableBase') gameTableBase: ElementRef;
  @ViewChild('gameTable') gameTable: ElementRef;
  //@ViewChild('gameBackgroundImage') gameBackgroundImage: ElementRef;
  @ViewChild('gameObjects') gameObjects: ElementRef;
  @ViewChild('gridCanvas') gridCanvas: ElementRef;

  private _gameTableObject: GameTable = null;

  get gameTableObject(): GameTable {
    let table = ObjectStore.instance.get<TableSelecter>('tableSelecter').viewTable;
    if (table && table !== this._gameTableObject) {
      this._gameTableObject = table;
      this.setGameTableGrid(this._gameTableObject.width, this._gameTableObject.height, this._gameTableObject.gridSize);
    }
    return this._gameTableObject;
  }

  //private imageIdentifier: string = '';
  /*
  get file(): ImageFile {
    let file: ImageFile = FileStorage.instance.get(this.gameTableObject.imageIdentifier);
    return file ? file : ImageFile.Empty;
  }
  */

  bgImage: ImageFile = ImageFile.Empty;

  private isTransformMode: boolean = false;

  private mouseDownPositionX: number = 0;
  private mouseDownPositionY: number = 0;

  private viewPotisonX: number = 100;
  private viewPotisonY: number = 0;
  private viewPotisonZ: number = 0;

  private viewRotateX: number = 50;
  private viewRotateY: number = 0;
  private viewRotateZ: number = 10;

  private callbackOnMouseDown: any = null;
  private callbackOnMouseUp: any = null;
  private callbackOnMouseMove: any = null;
  private callbackOnWheel: any = null;
  private callbackOnKeyDown: any = null;
  private callbackOnContextMenu: any = null;

  private buttonCode: number = 0;

  private _tabletopCharacterIdentifiers: string[] = [];
  private _tabletopCharacters: GameCharacter[] = [];

  private allowOpenContextMenu: boolean = true;

  constructor(
    private ngZone: NgZone,
    //private gameRoomService: GameRoomService,
    private contextMenuService: ContextMenuService,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private pointerDeviceService: PointerDeviceService,
    private modalService: ModalService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    console.log('きどう');
    let testCharacter: GameCharacter = null;
    let testFile: ImageFile = null;

    let tableSelecter = new TableSelecter('tableSelecter');
    tableSelecter.initialize();

    /*
    this.gameTableObject = new GameTable('gameTable');
    testFile = FileStorageProxy.addUrl('images/field001.gif', 'testTableBackgroundImage_image');
    this.gameTableObject.syncData.imageIdentifier = testFile.identifier;
    this.gameTableObject.initialize();
    this.file = testFile;
    */

    let gameTable = new GameTable('gameTable');
    let fileContext = ImageFile.createEmpty('testTableBackgroundImage_image').toContext();
    fileContext.url = './assets/images/BG10a_80.jpg';
    testFile = FileStorage.instance.add(fileContext);
    gameTable.name = '最初のテーブル';
    gameTable.imageIdentifier = testFile.identifier;
    gameTable.width = 20;
    gameTable.height = 15;
    gameTable.initialize();
    //this.imageIdentifier = testFile.identifier;

    tableSelecter.viewTableIdentifier = gameTable.identifier;

    testCharacter = new GameCharacter('testCharacter_1');
    fileContext = ImageFile.createEmpty('testCharacter_1_image').toContext();
    fileContext.url = './assets/images/mon_052.gif';
    testFile = FileStorage.instance.add(fileContext);
    //testCharacter.syncData.imageIdentifier = testFile.identifier;
    testCharacter.location.x = 5 * 50;
    testCharacter.location.y = 9 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターA', 1, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_2');
    testCharacter.location.x = 8 * 50;
    testCharacter.location.y = 8 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターB', 1, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_3');
    fileContext = ImageFile.createEmpty('testCharacter_3_image').toContext();
    fileContext.url = './assets/images/mon_128.gif';
    testFile = FileStorage.instance.add(fileContext);
    //testCharacter.syncData.imageIdentifier = testFile.identifier;
    testCharacter.location.x = 4 * 50;
    testCharacter.location.y = 2 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターC', 3, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_4');
    fileContext = ImageFile.createEmpty('testCharacter_4_image').toContext();
    fileContext.url = './assets/images/mon_150.gif';
    testFile = FileStorage.instance.add(fileContext);
    //testCharacter.syncData.imageIdentifier = testFile.identifier;
    testCharacter.location.x = 6 * 50;
    testCharacter.location.y = 11 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('キャラクターA', 1, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_5');
    fileContext = ImageFile.createEmpty('testCharacter_5_image').toContext();
    fileContext.url = './assets/images/mon_211.gif';
    testFile = FileStorage.instance.add(fileContext);
    //testCharacter.syncData.imageIdentifier = testFile.identifier;
    testCharacter.location.x = 12 * 50;
    testCharacter.location.y = 12 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('キャラクターB', 1, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_6');
    fileContext = ImageFile.createEmpty('testCharacter_6_image').toContext();
    fileContext.url = './assets/images/mon_135.gif';
    testFile = FileStorage.instance.add(fileContext);
    //testCharacter.syncData.imageIdentifier = testFile.identifier;
    testCharacter.initialize();
    testCharacter.location.x = 5 * 50;
    testCharacter.location.y = 13 * 50;
    testCharacter.createTestGameDataElement('キャラクターC', 1, testFile.identifier);

    //this.createTrump();
    //document.body.addEventListener('mousemove', this.callcack);
    //document.body.addEventListener('touchmove', this.callcack);

    /*
    var element = document.getElementById('game-table');
    var $char1 = $('#game-char-1-dodai');
    element.addEventListener('mousemove', (e) => this.onMove(e), true);
    element.addEventListener('touchmove', (e) => this.onMove(e), true);
    */

    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {

        if (event.data.identifier !== this.gameTableObject.identifier) return;
        console.log('UPDATE_GAME_OBJECT GameTableComponent ' + this.gameTableObject.identifier, this.gameTableObject);

        let file: ImageFile = FileStorage.instance.get(this.gameTableObject.imageIdentifier);
        if (file) this.bgImage = file;

        this.setGameTableGrid(this.gameTableObject.width, this.gameTableObject.height, this.gameTableObject.gridSize);
      })
      .on('XML_PARSE', event => {
        let xml: string = event.data.xml;
        //console.log('XML_PARSE', xml);
        let gameObject = ObjectSerializer.instance.parseXml(xml);
        if (gameObject instanceof TabletopObject) {
          let pointer = PointerDeviceService.convertToLocal(this.pointerDeviceService.pointers[0], this.gameObjects.nativeElement);
          gameObject.location.x = pointer.x - 25;
          gameObject.location.y = pointer.y - 25;
          gameObject.update();
        }
      });
    /*
    .on('UPDATE_GAME_OBJECT', -1000, event => {
      if (event.data.className === 'GameCharacter' || event.data.className === 'GameDataElement') this.changeDetector.markForCheck();
    });
    */
  }

  ngAfterViewInit() {
    let gameTableElement = this.gameTableBase.nativeElement;

    //$gameTableElement.css('background-image', 'url(' + this.tableBackgroundImageURI + ')');

    this.callbackOnMouseDown = (e) => this.onMouseDown(e);
    this.callbackOnMouseUp = (e) => this.onMouseUp(e);
    this.callbackOnMouseMove = (e) => this.onMouseMove(e);

    this.callbackOnWheel = (e) => this.onWheel(e);
    this.callbackOnKeyDown = (e) => this.onKeydown(e);

    this.callbackOnContextMenu = (e) => this.onContextMenu(e);

    //gameTableElement.addEventListener('mousemove', (e) => this.onMove(e), true);
    //gameTableElement.addEventListener('touchmove', (e) => this.onMove(e), true);

    gameTableElement.addEventListener('mousedown', this.callbackOnMouseDown, true);
    this.elementRef.nativeElement.addEventListener('wheel', this.callbackOnWheel, false);
    document.addEventListener('keydown', this.callbackOnKeyDown, false);
    this.gameObjects.nativeElement.addEventListener('contextmenu', this.callbackOnContextMenu, false);

    /*
    this.context = canvas.getContext("2d");
    this.tick();
    */

    this.setGameTableGrid(this.gameTableObject.width, this.gameTableObject.height, this.gameTableObject.gridSize);
    this.setTransform(0, 0, 0, 0, 0, 0);
    this.gameTableObject.update();
    /*
    setTimeout(() => {
      let data: GameTableDataContainer = {
        width: 40,
        height: 10,
        imageIdentifier: FileStorageProxy.getFile('testCharacter_3_image').identifier,
        gridSize: this.gridSize,
      }
      let event: EventData = new EventData('UPDATE_GAME_TABLE', data);
      EventSystemProxy.callEvent(event);
    }, 5000);
    */
    let file: ImageFile = FileStorage.instance.get(this.gameTableObject.imageIdentifier);
    if (file) this.bgImage = file;
  }

  ngOnDestroy() {
    EventSystem.unregister(this);

    let gameTableElement = this.gameTableBase.nativeElement;
    gameTableElement.removeEventListener('mousedown', this.callbackOnMouseDown, true);
    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, true);
    document.body.removeEventListener('touchmove', this.callbackOnMouseMove, true);

    this.elementRef.nativeElement.removeEventListener('wheel', this.callbackOnWheel, false);
    document.removeEventListener('keydown', this.callbackOnKeyDown, false);

    this.gameObjects.nativeElement.removeEventListener('contextmenu', this.callbackOnContextMenu, false);

    this.callbackOnMouseDown = null;
    this.callbackOnMouseUp = null;
    this.callbackOnMouseMove = null;

    this.callbackOnWheel = null;
    this.callbackOnKeyDown = null;

    this.callbackOnContextMenu = null;
  }

  // getTabletopCharactersだと遅い　何とかする
  getTabletopCharacters(): GameCharacter[] {
    return ObjectStore.instance.getObjects(GameCharacter).filter((obj) => { return obj.location.name === 'table' });
  }

  getGameTableMasks(): GameTableMask[] {
    return ObjectStore.instance.getObjects(GameTableMask).filter((obj) => { return obj.location.name === this.gameTableObject.identifier });
  }

  getCards(): Card[] {
    return ObjectStore.instance.getObjects(Card).filter((obj) => { return obj.location.name === 'table' });
  }

  getCardStacks(): CardStack[] {
    return ObjectStore.instance.getObjects(CardStack).filter((obj) => { return obj.location.name === 'table' });
  }

  onMouseDown(e: any) {
    this.mouseDownPositionX = e.touches ? e.changedTouches[0].pageX : e.pageX;
    this.mouseDownPositionY = e.touches ? e.changedTouches[0].pageY : e.pageY;

    this.allowOpenContextMenu = true;
    console.log('onMouseDown allowOpenContextMenu', this.allowOpenContextMenu);

    if (e.target === this.gameTableBase.nativeElement
      || e.target === this.gameTable.nativeElement
      || e.target === this.gameObjects.nativeElement
      || e.target === this.gridCanvas.nativeElement) {
      //|| e.target === this.gameBackgroundImage.nativeElement
      //|| e.target === this.gameBackgroundImage.nativeElement) {
      this.isTransformMode = true;
      e.preventDefault();
    } else {
      this.isTransformMode = false;
      $(this.gridCanvas.nativeElement).css('opacity', 1.0);
    }

    this.buttonCode = e.button;
    switch (this.buttonCode) {
      case 0:
        console.log('Left button clicked.');
        break;

      case 1:
        console.log('Middle button clicked.');
        break;

      case 2:
        console.log('Right button clicked.');
        break;

      default:
        console.log('Unexpected code: ' + this.buttonCode);
    }

    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, true);
    document.body.addEventListener('touchmove', this.callbackOnMouseMove, true);
    //e.preventDefault();
  }

  onMouseUp(e: any) {
    //console.log('onMouseUp');

    $(this.gridCanvas.nativeElement).css('opacity', 0.0);

    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, true);
    document.body.removeEventListener('touchmove', this.callbackOnMouseMove, true);
    //e.preventDefault();
    //$('#app-ui-layer').css('opacity', 1.0);
  }

  onMouseMove(e: any) {
    let x = e.touches ? e.changedTouches[0].pageX : e.pageX;
    let y = e.touches ? e.changedTouches[0].pageY : e.pageY;

    if (this.isTransformMode) {
      let transformX = 0;
      let transformY = 0;
      let transformZ = 0;

      let rotateX = 0;
      let rotateY = 0;
      let rotateZ = 0;

      if (this.buttonCode === 2) {
        rotateZ = (this.mouseDownPositionX - x) / 5;
        rotateX = (this.mouseDownPositionY - y) / 5;
      } else {
        let scale = (1000 + Math.abs(this.viewPotisonZ)) / 1000;
        transformX = -(this.mouseDownPositionX - x) * scale;
        transformY = -(this.mouseDownPositionY - y) * scale;
      }

      if (this.mouseDownPositionX !== x || this.mouseDownPositionY !== y) {
        //$('#app-ui-layer').css('opacity', 0.2);
        this.allowOpenContextMenu = false;
      }

      this.mouseDownPositionX = x;
      this.mouseDownPositionY = y;

      //console.log('onMouseMove', x, y);
      this.setTransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ);
      return;
    }
  }

  onWheel(e: WheelEvent) {
    console.log('onWheel', e.deltaY);
    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    if (e.deltaY < 0) {
      transformZ = 150;
    } else if (0 < e.deltaY) {
      transformZ = -150;
    }

    this.setTransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ);
  }

  onKeydown(e: KeyboardEvent) {
    console.log('onKeydown', e.keyCode);
    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    if (e.keyCode === 37) {//←
      if (e.shiftKey) {
        rotateZ = -2;
      } else {
        transformX = 10;
      }
    }
    if (e.keyCode === 38) {//↑
      if (e.shiftKey) {
        rotateX = -2;
      } else {
        transformY = 10;
      }
    }
    if (e.keyCode === 39) {//→
      if (e.shiftKey) {
        rotateZ = 2;
      } else {
        transformX = -10;
      }
    }
    if (e.keyCode === 40) {//↓
      if (e.shiftKey) {
        rotateX = 2;
      } else {
        transformY = -10;
      }
    }
    this.setTransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ);
  }

  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    if (this.allowOpenContextMenu) {
      let potison = this.pointerDeviceService.pointers[0];
      console.log('mouseCursor A', potison);
      this.contextMenuService.open(potison, [
        { name: 'キャラクターを作成', action: () => { this.createGameCharacter(potison); } },
        { name: 'マップマスクを作成', action: () => { this.createGameTableMask(potison); } },
        {
          name: 'テーブル設定', action: () => {
            this.modalService.open(GameTableSettingComponent);
          }
        },
        {
          name: 'トランプの山札を作る', action: () => {
            this.createTrump(potison);
          }
        }
      ], this.gameTableObject.name);
    }
  }

  createGameCharacter(potison: PointerCoordinate) {
    console.log('mouseCursor B', potison);
    let gameObject = GameCharacter.createGameCharacter('新しいキャラクター', 1, '');
    let pointer = PointerDeviceService.convertToLocal(potison, this.gameObjects.nativeElement);
    gameObject.location.x = pointer.x - 25;
    gameObject.location.y = pointer.y - 25;
    gameObject.update();
    this.showDetail(gameObject);
  }

  private showDetail(gameObject: GameCharacter) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    //this.modalService.open(GameCharacterSheetComponent);
    let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  createGameTableMask(potison: PointerCoordinate) {
    console.log('createGameTableMask A');
    let tableMask = GameTableMask.create('マップマスク', 5, 5, 100);
    tableMask.location.name = ObjectStore.instance.get<TableSelecter>('tableSelecter').viewTable.identifier;

    let pointer = PointerDeviceService.convertToLocal(potison, this.gameObjects.nativeElement);
    console.log('createGameTableMask B', pointer);
    tableMask.location.x = pointer.x - 25;
    tableMask.location.y = pointer.y - 25;
    tableMask.update();
  }

  setTransform(transformX: number, transformY: number, transformZ: number, rotateX: number, rotateY: number, rotateZ: number) {
    this.viewRotateX += rotateX;
    this.viewRotateY += rotateY;
    this.viewRotateZ += rotateZ;

    let ax = -this.viewRotateX * Math.PI / 180.0;
    let ay = -this.viewRotateY * Math.PI / 180.0;
    let az = -this.viewRotateZ * Math.PI / 180.0;

    let x = transformX;
    let y = transformY;
    let z = transformZ;
    let x2, x3, y2, y3, z2, z3;

    /*
        //--Y Axis Rotation
        z2 = z * Math.cos(ay) - x * Math.sin(ay);
        x2 = z * Math.sin(ay) + x * Math.cos(ay);
        y2 = y;
        //--X Axis Rotation
        y3 = y2 * Math.cos(ax) - z2 * Math.sin(ax);
        z3 = y2 * Math.sin(ax) + z2 * Math.cos(ax);
        x3 = x2;
        //--Z Axis Rotation
        x = x3 * Math.cos(az) - y3 * Math.sin(az);
        y = x3 * Math.sin(az) + y3 * Math.cos(az);
        z = z3;
    */

    this.viewPotisonX += x;
    this.viewPotisonY += y;
    this.viewPotisonZ += z;
    //$(this.gameTable.nativeElement).css('transform-origin',''+this.viewPotisonX+'px '+ this.viewPotisonY+'px '+ this.viewPotisonZ+'px'); 
    //$(this.gameTable.nativeElement).css('transform-origin',''+this.viewPotisonX+'px '+ this.viewPotisonY+'px 0'); 

    //$(this.gameTable.nativeElement).css('transform', 'rotateY(' + this.viewRotateY + 'deg) rotateX(' + this.viewRotateX + 'deg) rotateZ(' + this.viewRotateZ + 'deg) translateZ(' + this.viewPotisonZ + 'px) translateY(' + this.viewPotisonY + 'px) translateX(' + this.viewPotisonX + 'px) ');

    $(this.gameTable.nativeElement).css('transform', 'translateZ(' + this.viewPotisonZ + 'px) translateY(' + this.viewPotisonY + 'px) translateX(' + this.viewPotisonX + 'px) rotateY(' + this.viewRotateY + 'deg) rotateX(' + this.viewRotateX + 'deg) rotateZ(' + this.viewRotateZ + 'deg) ');
  }

  private setGameTableGrid(width: number, height: number, gridSize: number = 50) {
    let $gameTableElement = $(this.gameTable.nativeElement);
    $gameTableElement.css('width', width * gridSize);
    $gameTableElement.css('height', height * gridSize);

    let canvasElement: HTMLCanvasElement = this.gridCanvas.nativeElement;// document.getElementById('line');
    canvasElement.width = width * gridSize;
    canvasElement.height = height * gridSize;
    let context: CanvasRenderingContext2D = canvasElement.getContext('2d');
    context.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    context.lineWidth = 2;
    for (let i = 0; i <= height; i++) {
      context.beginPath();
      context.moveTo(0, i * gridSize);
      context.lineTo(width * gridSize, i * gridSize);
      context.stroke();
    }

    for (let i = 0; i <= width; i++) {
      context.beginPath();
      context.moveTo(i * gridSize, 0);
      context.lineTo(i * gridSize, height * gridSize);
      context.stroke();
    }
  }

  private createTrump(potison: PointerCoordinate) {
    let pointer = PointerDeviceService.convertToLocal(potison, this.gameObjects.nativeElement);
    let cardStack = CardStack.create('トランプ山札');
    cardStack.location.x = pointer.x - 25;
    cardStack.location.y = pointer.y - 25;
    cardStack.update();

    let fileContext: ImageContext;
    let image: ImageFile;

    let back: string = './assets/images/trump/z02.gif';
    if (!FileStorage.instance.get(back)) {
      image = FileStorage.instance.add(back);
    }

    let names: string[] = ['c', 'd', 'h', 's'];

    for (let name of names) {
      for (let i = 1; i <= 13; i++) {
        let trump: string = name + (('00' + i).slice(-2));
        let url: string = './assets/images/trump/' + trump + '.gif';
        if (!FileStorage.instance.get(url)) {
          image = FileStorage.instance.add(url);
        }
        let card = Card.create('サンプルカード', url, back);
        cardStack.placeToBottom(card);

      }
    }

    for (let i = 1; i <= 2; i++) {
      let trump: string = 'x' + (('00' + i).slice(-2));
      let url: string = './assets/images/trump/' + trump + '.gif';
      if (!FileStorage.instance.get(url)) {
        image = FileStorage.instance.add(url);
      }
      let card = Card.create('サンプルカード', url, back);
      cardStack.placeToBottom(card);
    }
  }
}

export interface GameTableDataContainer {
  width: number;
  height: number;
  imageIdentifier: string;
  gridSize: number;
}
