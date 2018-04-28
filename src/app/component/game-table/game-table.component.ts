import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Card } from '../../class/card';
import { CardStack } from '../../class/card-stack';
import { FileStorage } from '../../class/core/file-storage/file-storage';
import { ImageContext, ImageFile } from '../../class/core/file-storage/image-file';
import { ObjectSerializer } from '../../class/core/synchronize-object/object-serializer';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { EventSystem } from '../../class/core/system/system';
import { GameCharacter } from '../../class/game-character';
import { GameTable, GridType } from '../../class/game-table';
import { GameTableMask } from '../../class/game-table-mask';
import { PeerCursor } from '../../class/peer-cursor';
import { TableSelecter } from '../../class/table-selecter';
import { TabletopObject } from '../../class/tabletop-object';
import { Terrain } from '../../class/terrain';
import { ContextMenuService } from '../../service/context-menu.service';
import { ModalService } from '../../service/modal.service';
import { PanelOption, PanelService } from '../../service/panel.service';
import { PointerCoordinate, PointerDeviceService } from '../../service/pointer-device.service';
import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { GameTableSettingComponent } from '../game-table-setting/game-table-setting.component';
import { TextNote } from '../../class/text-note';
import { TabletopService, } from '../../service/tabletop.service';

@Component({
  selector: 'game-table',
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.css'],
  providers: [
    TabletopService,
  ],
})
export class GameTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('root') rootElementRef: ElementRef;
  @ViewChild('gameTable') gameTable: ElementRef;
  @ViewChild('gameObjects') gameObjects: ElementRef;
  @ViewChild('gridCanvas') gridCanvas: ElementRef;

  private _emptyTable: GameTable = new GameTable('');

  get tableSelecter(): TableSelecter { return ObjectStore.instance.get<TableSelecter>('tableSelecter'); }
  get gameTableObject(): GameTable {
    let table = this.tableSelecter.viewTable;
    return table ? table : this._emptyTable;
  }

  get bgImage(): ImageFile {
    let file: ImageFile = FileStorage.instance.get(this.gameTableObject.imageIdentifier);
    return file ? file : ImageFile.Empty;
  }

  private isTransformMode: boolean = false;

  private mouseDownPositionX: number = 0;
  private mouseDownPositionY: number = 0;

  get isPointerDragging(): boolean { return this.pointerDeviceService.isDragging; }

  private viewPotisonX: number = 100;
  private viewPotisonY: number = 0;
  private viewPotisonZ: number = 0;

  private viewRotateX: number = 50;
  private viewRotateY: number = 0;
  private viewRotateZ: number = 10;

  private callbackOnMouseDown = (e) => this.onMouseDown(e);
  private callbackOnMouseUp = (e) => this.onMouseUp(e);
  private callbackOnMouseMove = (e) => this.onMouseMove(e);
  private callbackOnContextMenu = (e) => this.onContextMenu(e);

  private buttonCode: number = 0;

  private isAllowedToOpenContextMenu: boolean = true;

  private needUpdateList: { [aliasName: string]: boolean } = {};
  private _tabletopCharacters: GameCharacter[] = [];
  private _gameTableMasks: GameTableMask[] = [];
  private _cards: Card[] = [];
  private _cardStacks: CardStack[] = [];
  private _terrains: Terrain[] = [];
  private _peerCursors: PeerCursor[] = [];
  private _textNotes: TextNote[] = [];
  get tabletopCharacters(): GameCharacter[] { this.updateTabletopObjects(); return this._tabletopCharacters; }
  get gameTableMasks(): GameTableMask[] { this.updateTabletopObjects(); return this._gameTableMasks; }
  get cards(): Card[] { this.updateTabletopObjects(); return this._cards; }
  get cardStacks(): CardStack[] { this.updateTabletopObjects(); return this._cardStacks; }
  get terrains(): Terrain[] { this.updateTabletopObjects(); return this._terrains; }
  get peerCursors(): PeerCursor[] { this.updateTabletopObjects(); return this._peerCursors; }
  get textNotes(): TextNote[] { this.updateTabletopObjects(); return this._textNotes; }

  constructor(
    private ngZone: NgZone,
    private contextMenuService: ContextMenuService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService,
    private tabletopService: TabletopService,
    private modalService: ModalService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    console.log('きどう');
    this.resetUpdateList();

    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (this.needUpdateList[event.data.aliasName] === true) {
          this.needUpdateList[event.data.aliasName] = false;
        }
        if (event.data.identifier !== this.gameTableObject.identifier && event.data.identifier !== this.tableSelecter.identifier) return;
        console.log('UPDATE_GAME_OBJECT GameTableComponent ' + this.gameTableObject.identifier, this.gameTableObject);

        this.needUpdateList[GameTableMask.aliasName] = false;
        this.needUpdateList[Terrain.aliasName] = false;

        this.setGameTableGrid(this.gameTableObject.width, this.gameTableObject.height, this.gameTableObject.gridSize, this.gameTableObject.gridType, this.gameTableObject.gridColor);
      })
      .on('DELETE_GAME_OBJECT', 1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        let garbage = object ? object : ObjectStore.instance.getDeletedObject(event.data.identifier);
        if (garbage == null || garbage.aliasName.length < 1) {
          this.resetUpdateList();
        } else if (this.needUpdateList[garbage.aliasName] === true) {
          this.needUpdateList[garbage.aliasName] = false;
        }
      })
      .on('XML_PARSE', event => {
        let xml: string = event.data.xml;
        //console.log('XML_PARSE', xml); todo:立体地形の上にドロップした時の挙動
        let gameObject = ObjectSerializer.instance.parseXml(xml);
        if (gameObject instanceof TabletopObject) {
          let pointer = PointerDeviceService.convertToLocal(this.pointerDeviceService.pointers[0], this.gameObjects.nativeElement);
          gameObject.location.x = pointer.x - 25;
          gameObject.location.y = pointer.y - 25;
          this.placeToTabletop(gameObject);
          gameObject.update();
        }
      }).on('DRAG_LOCKED_OBJECT', event => {
        this.isTransformMode = true;
        this.pointerDeviceService.isDragging = false;
        let opacity: number = this.tableSelecter.gridShow ? 1.0 : 0.0;
        this.gridCanvas.nativeElement.style.opacity = opacity;
      });
    this.makeDefaultTable();
    this.makeDefaultTabletopObjects();
  }

  ngAfterViewInit() {
    this.elementRef.nativeElement.addEventListener('mousedown', this.callbackOnMouseDown, true);
    this.setGameTableGrid(this.gameTableObject.width, this.gameTableObject.height, this.gameTableObject.gridSize, this.gameTableObject.gridType, this.gameTableObject.gridColor);
    this.setTransform(0, 0, 0, 0, 0, 0);
    this.tabletopService.dragAreaElement = this.gameObjects.nativeElement;
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.removeMouseEventListeners();
    this.elementRef.nativeElement.removeEventListener('mousedown', this.callbackOnMouseDown, true);
  }

  onMouseDown(e: any) {
    this.mouseDownPositionX = this.pointerDeviceService.pointerX;
    this.mouseDownPositionY = this.pointerDeviceService.pointerY;

    this.isAllowedToOpenContextMenu = true;
    console.log('onMouseDown isAllowedToOpenContextMenu', this.isAllowedToOpenContextMenu);

    if (e.target.contains(this.gameObjects.nativeElement)) {
      this.isTransformMode = true;
      e.preventDefault();
    } else {
      this.isTransformMode = false;
      this.pointerDeviceService.isDragging = true;
      this.gridCanvas.nativeElement.style.opacity = 1.0;
    }

    this.buttonCode = e.button;

    if (!document.activeElement.contains(e.target)) {
      this.removeSelectionRanges();
      this.removeFocus();
    }
    this.addMouseEventListeners();
  }

  onMouseUp(e: any) {
    this.pointerDeviceService.isDragging = false;
    let opacity: number = this.tableSelecter.gridShow ? 1.0 : 0.0;
    this.gridCanvas.nativeElement.style.opacity = opacity;

    this.removeMouseEventListeners();
  }

  onMouseMove(e: any) {
    let x = this.pointerDeviceService.pointerX;
    let y = this.pointerDeviceService.pointerY;

    if (this.mouseDownPositionX !== x || this.mouseDownPositionX !== y) {
      this.contextMenuService.close();
    }

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
        this.isAllowedToOpenContextMenu = false;
      }

      this.mouseDownPositionX = x;
      this.mouseDownPositionY = y;

      this.setTransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ);
      return;
    }
  }

  @HostListener('wheel', ['$event'])
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

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    console.log('onKeydown', e.keyCode);
    if (document.body !== document.activeElement) return;
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

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: any) {
    if (!document.activeElement.contains(this.gameObjects.nativeElement)) return;
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    if (this.isAllowedToOpenContextMenu) {
      this.isAllowedToOpenContextMenu = false;
      let potison = this.pointerDeviceService.pointers[0];
      console.log('mouseCursor A', potison);
      this.contextMenuService.open(potison, [
        { name: 'キャラクターを作成', action: () => { this.createGameCharacter(potison); } },
        { name: 'マップマスクを作成', action: () => { this.createGameTableMask(potison); } },
        { name: '地形を作成', action: () => { this.createTerrain(potison); } },
        {
          name: '共有メモを作成', action: () => {
            this.createTextNote(potison);
          }
        },
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

  private placeToTabletop(gameObject: TabletopObject) {
    switch (gameObject.aliasName) {
      case GameTableMask.aliasName:
      case Terrain.aliasName:
        if (!this.tableSelecter || !this.tableSelecter.viewTable) return;
        this.tableSelecter.viewTable.appendChild(gameObject);
        break;
      default:
        gameObject.setLocation('table');
        break;
    }
  }

  private resetUpdateList() {
    this.needUpdateList[GameCharacter.aliasName] = false;
    this.needUpdateList[GameTableMask.aliasName] = false;
    this.needUpdateList[Card.aliasName] = false;
    this.needUpdateList[CardStack.aliasName] = false;
    this.needUpdateList[Terrain.aliasName] = false;
    this.needUpdateList[PeerCursor.aliasName] = false;
    this.needUpdateList[TextNote.aliasName] = false;
  }

  private updateTabletopObjects() {
    if (!this.needUpdateList[GameCharacter.aliasName]) {
      this.needUpdateList[GameCharacter.aliasName] = true;
      this._tabletopCharacters = ObjectStore.instance.getObjects<GameCharacter>(GameCharacter).filter((obj) => { return obj.location.name === 'table' });
    }
    if (!this.needUpdateList[GameTableMask.aliasName]) {
      this.needUpdateList[GameTableMask.aliasName] = true;
      let viewTable = this.tableSelecter.viewTable;
      this._gameTableMasks = viewTable ? viewTable.masks : [];
    }
    if (!this.needUpdateList[Card.aliasName]) {
      this.needUpdateList[Card.aliasName] = true;
      this._cards = ObjectStore.instance.getObjects<Card>(Card).filter((obj) => { return obj.location.name === 'table' });
    }
    if (!this.needUpdateList[CardStack.aliasName]) {
      this.needUpdateList[CardStack.aliasName] = true;
      this._cardStacks = ObjectStore.instance.getObjects<CardStack>(CardStack).filter((obj) => { return obj.location.name === 'table' });
    }
    if (!this.needUpdateList[Terrain.aliasName]) {
      this.needUpdateList[Terrain.aliasName] = true;
      let viewTable = this.tableSelecter.viewTable;
      this._terrains = viewTable ? viewTable.terrains : [];
    }
    if (!this.needUpdateList[PeerCursor.aliasName]) {
      this.needUpdateList[PeerCursor.aliasName] = true;
      this._peerCursors = ObjectStore.instance.getObjects<PeerCursor>(PeerCursor);
    }
    if (!this.needUpdateList[TextNote.aliasName]) {
      this.needUpdateList[TextNote.aliasName] = true;
      this._textNotes = ObjectStore.instance.getObjects<TextNote>(TextNote);
    }
  }

  createGameCharacter(potison: PointerCoordinate) {
    console.log('mouseCursor B', potison);
    let gameObject = GameCharacter.createGameCharacter('新しいキャラクター', 1, false, '');
    let pointer = PointerDeviceService.convertToLocal(potison, this.gameObjects.nativeElement);
    gameObject.location.x = pointer.x - 25;
    gameObject.location.y = pointer.y - 25;
    gameObject.update();
    this.showDetail(gameObject);
  }

  private showDetail(gameObject: GameCharacter) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  createGameTableMask(potison: PointerCoordinate) {
    console.log('createGameTableMask A');
    let viewTable = this.tableSelecter.viewTable;
    if (!viewTable) return;

    let tableMask = GameTableMask.create('マップマスク', 5, 5, 100);
    //tableMask.location.name = ObjectStore.instance.get<TableSelecter>('tableSelecter').viewTable.identifier;
    viewTable.appendChild(tableMask);

    let pointer = PointerDeviceService.convertToLocal(potison, this.gameObjects.nativeElement);
    console.log('createGameTableMask B', pointer);
    tableMask.location.x = pointer.x - 25;
    tableMask.location.y = pointer.y - 25;
    tableMask.update();
  }

  createTerrain(potison: PointerCoordinate) {
    console.log('createTerrain');

    let url: string = './assets/images/tex.jpg';
    let image: ImageFile = FileStorage.instance.get(url)
    if (!image) image = FileStorage.instance.add(url);

    let viewTable = this.tableSelecter.viewTable;
    if (!viewTable) return;

    let terrain = Terrain.create('地形', 2, 2, 2, image.identifier, image.identifier);
    viewTable.appendChild(terrain);

    let pointer = PointerDeviceService.convertToLocal(potison, this.gameObjects.nativeElement);
    terrain.location.x = pointer.x - 50;
    terrain.location.y = pointer.y - 50;
    terrain.update();
  }

  createTextNote(potison: PointerCoordinate) {
    console.log('createTextNote');
    let textNote = TextNote.create('共有メモ', 'テキストを入力してください', 5, 4, 3);

    let pointer = PointerDeviceService.convertToLocal(potison, this.gameObjects.nativeElement);
    textNote.location.x = pointer.x;
    textNote.location.y = pointer.y;
    textNote.update();
  }

  setTransform(transformX: number, transformY: number, transformZ: number, rotateX: number, rotateY: number, rotateZ: number) {
    this.viewRotateX += rotateX;
    this.viewRotateY += rotateY;
    this.viewRotateZ += rotateZ;

    this.viewPotisonX += transformX;
    this.viewPotisonY += transformY;
    this.viewPotisonZ += transformZ;

    this.gameTable.nativeElement.style.transform = 'translateZ(' + this.viewPotisonZ + 'px) translateY(' + this.viewPotisonY + 'px) translateX(' + this.viewPotisonX + 'px) rotateY(' + this.viewRotateY + 'deg) rotateX(' + this.viewRotateX + 'deg) rotateZ(' + this.viewRotateZ + 'deg) ';
  }

  private setGameTableGrid(width: number, height: number, gridSize: number = 50, gridType: GridType = GridType.SQUARE, gridColor: string = '#000000e6') {
    this.gameTable.nativeElement.style.width = width * gridSize + 'px';
    this.gameTable.nativeElement.style.height = height * gridSize + 'px';

    let canvasElement: HTMLCanvasElement = this.gridCanvas.nativeElement;
    canvasElement.width = width * gridSize;
    canvasElement.height = height * gridSize;
    let context: CanvasRenderingContext2D = canvasElement.getContext('2d');
    context.strokeStyle = gridColor;
    context.fillStyle = context.strokeStyle;
    context.lineWidth = 1;

    // 座標描画用font設定
    let fontSize: number = Math.floor(gridSize / 5);
    context.font = 'bold ' + fontSize + 'px sans-serif';
    context.textBaseline = 'top';
    context.textAlign = 'center';

    let gx: number; // グリッド用Rect描画開始位置(x)
    let gy: number; // 同上(y)

    let calcGridPosition: { (w: number, h: number): void };

    switch (gridType) {
      case GridType.HEX_VERTICAL: // ヘクス縦揃え
        calcGridPosition = (w, h) => {
          if ((w % 2) === 1) {
            gx = w * gridSize;
            gy = h * gridSize;
          } else {
            gx = w * gridSize;
            gy = h * gridSize + (gridSize / 2);
          }
        }
        break;
      case GridType.HEX_HORIZONTAL: // ヘクス横揃え(どどんとふ互換)
        calcGridPosition = (w, h) => {
          if ((h % 2) === 1) {
            gx = w * gridSize;
            gy = h * gridSize;
          } else {
            gx = w * gridSize + (gridSize / 2);
            gy = h * gridSize;
          }
        }
        break;
      default: // スクエア(default)
        calcGridPosition = (w, h) => {
          gx = w * gridSize;
          gy = h * gridSize;
        }
        break;
    }

    for (let h = 0; h <= height; h++) {
      for (let w = 0; w <= width; w++) {
        calcGridPosition(w, h);
        context.beginPath();
        context.strokeRect(gx, gy, gridSize, gridSize);
        context.fillText((w + 1).toString() + '-' + (h + 1).toString(), gx + (gridSize / 2), gy + (gridSize / 2));
      }
    }

    let opacity: number = this.tableSelecter.gridShow ? 1.0 : 0.0;
    this.gridCanvas.nativeElement.style.opacity = opacity;
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
        cardStack.putOnBottom(card);

      }
    }

    for (let i = 1; i <= 2; i++) {
      let trump: string = 'x' + (('00' + i).slice(-2));
      let url: string = './assets/images/trump/' + trump + '.gif';
      if (!FileStorage.instance.get(url)) {
        image = FileStorage.instance.add(url);
      }
      let card = Card.create('サンプルカード', url, back);
      cardStack.putOnBottom(card);
    }
  }

  private removeSelectionRanges() {
    let selection = window.getSelection();
    if (!selection.isCollapsed) {
      selection.removeAllRanges();
    }
  }

  private removeFocus() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  private addMouseEventListeners() {
    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    this.ngZone.runOutsideAngular(() => {
      document.body.addEventListener('mousemove', this.callbackOnMouseMove, true);
      document.body.addEventListener('touchmove', this.callbackOnMouseMove, true);
    });
  }

  private removeMouseEventListeners() {
    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, true);
    document.body.removeEventListener('touchmove', this.callbackOnMouseMove, true);
  }

  private makeDefaultTable() {
    let tableSelecter = new TableSelecter('tableSelecter');
    tableSelecter.initialize();

    let gameTable = new GameTable('gameTable');
    let testFile: ImageFile = null;
    let fileContext = ImageFile.createEmpty('testTableBackgroundImage_image').toContext();
    fileContext.url = './assets/images/BG10a_80.jpg';
    testFile = FileStorage.instance.add(fileContext);
    gameTable.name = '最初のテーブル';
    gameTable.imageIdentifier = testFile.identifier;
    gameTable.width = 20;
    gameTable.height = 15;
    gameTable.initialize();

    tableSelecter.viewTableIdentifier = gameTable.identifier;
  }

  private makeDefaultTabletopObjects() {
    let testCharacter: GameCharacter = null;
    let testFile: ImageFile = null;
    let fileContext: ImageContext = null;

    testCharacter = new GameCharacter('testCharacter_1');
    fileContext = ImageFile.createEmpty('testCharacter_1_image').toContext();
    fileContext.url = './assets/images/mon_052.gif';
    testFile = FileStorage.instance.add(fileContext);
    testCharacter.location.x = 5 * 50;
    testCharacter.location.y = 9 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターA', 1, false, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_2');
    testCharacter.location.x = 8 * 50;
    testCharacter.location.y = 8 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターB', 1, false, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_3');
    fileContext = ImageFile.createEmpty('testCharacter_3_image').toContext();
    fileContext.url = './assets/images/mon_128.gif';
    testFile = FileStorage.instance.add(fileContext);
    testCharacter.location.x = 4 * 50;
    testCharacter.location.y = 2 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターC', 3, false, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_4');
    fileContext = ImageFile.createEmpty('testCharacter_4_image').toContext();
    fileContext.url = './assets/images/mon_150.gif';
    testFile = FileStorage.instance.add(fileContext);
    testCharacter.location.x = 6 * 50;
    testCharacter.location.y = 11 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('キャラクターA', 1, false, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_5');
    fileContext = ImageFile.createEmpty('testCharacter_5_image').toContext();
    fileContext.url = './assets/images/mon_211.gif';
    testFile = FileStorage.instance.add(fileContext);
    testCharacter.location.x = 12 * 50;
    testCharacter.location.y = 12 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('キャラクターB', 1, false, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_6');
    fileContext = ImageFile.createEmpty('testCharacter_6_image').toContext();
    fileContext.url = './assets/images/mon_135.gif';
    testFile = FileStorage.instance.add(fileContext);
    testCharacter.initialize();
    testCharacter.location.x = 5 * 50;
    testCharacter.location.y = 13 * 50;
    testCharacter.createTestGameDataElement('キャラクターC', 1, false, testFile.identifier);
  }
}
