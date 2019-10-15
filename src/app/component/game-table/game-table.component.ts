import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Card } from '@udonarium/card';
import { CardStack } from '@udonarium/card-stack';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { GameObject } from '@udonarium/core/synchronize-object/game-object';
import { EventSystem } from '@udonarium/core/system';
import { DiceSymbol } from '@udonarium/dice-symbol';
import { GameCharacter } from '@udonarium/game-character';
import { FilterType, GameTable, GridType } from '@udonarium/game-table';
import { GameTableMask } from '@udonarium/game-table-mask';
import { PeerCursor } from '@udonarium/peer-cursor';
import { TableSelecter } from '@udonarium/table-selecter';
import { Terrain } from '@udonarium/terrain';
import { TextNote } from '@udonarium/text-note';

import { GameTableSettingComponent } from 'component/game-table-setting/game-table-setting.component';
import { InputHandler } from 'directive/input-handler';
import { ContextMenuAction, ContextMenuSeparator, ContextMenuService } from 'service/context-menu.service';
import { ModalService } from 'service/modal.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { TabletopService } from 'service/tabletop.service';

@Component({
  selector: 'game-table',
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.css'],
  providers: [
    TabletopService,
  ],
})
export class GameTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('root', { static: true }) rootElementRef: ElementRef<HTMLElement>;
  @ViewChild('gameTable', { static: true }) gameTable: ElementRef<HTMLElement>;
  @ViewChild('gameObjects', { static: true }) gameObjects: ElementRef<HTMLElement>;
  @ViewChild('gridCanvas', { static: true }) gridCanvas: ElementRef<HTMLCanvasElement>;

  get tableSelecter(): TableSelecter { return this.tabletopService.tableSelecter; }
  get currentTable(): GameTable { return this.tabletopService.currentTable; }

  get tableImage(): ImageFile {
    let file: ImageFile = ImageStorage.instance.get(this.currentTable.imageIdentifier);
    return file ? file : ImageFile.Empty;
  }

  get backgroundImage(): ImageFile {
    let file: ImageFile = ImageStorage.instance.get(this.currentTable.backgroundImageIdentifier);
    return file ? file : ImageFile.Empty;
  }

  get backgroundFilterType(): FilterType {
    return this.currentTable.backgroundFilterType
  }

  private isTransformMode: boolean = false;

  private currentPositionX: number = 0;
  private currentPositionY: number = 0;

  get isPointerDragging(): boolean { return this.pointerDeviceService.isDragging; }

  private viewPotisonX: number = 100;
  private viewPotisonY: number = 0;
  private viewPotisonZ: number = 0;

  private viewRotateX: number = 50;
  private viewRotateY: number = 0;
  private viewRotateZ: number = 10;

  private buttonCode: number = 0;
  private input: InputHandler = null;

  private hammer: HammerManager = null;
  private deltaHammerDeltaX: number = 0;
  private deltaHammerDeltaY = 1.0;
  private deltaHammerScale = 1.0;
  private deltaHammerRotation = 0;

  private prevHammerDeltaX: number = 0;
  private prevHammerDeltaY: number = 0;
  private prevHammerScale: number = 0;
  private prevHammerRotation: number = 0;

  private tappedPanTimer: NodeJS.Timer = null;
  private tappedPanCenter: HammerPoint = { x: 0, y: 0 };

  get characters(): GameCharacter[] { return this.tabletopService.characters; }
  get tableMasks(): GameTableMask[] { return this.tabletopService.tableMasks; }
  get cards(): Card[] { return this.tabletopService.cards; }
  get cardStacks(): CardStack[] { return this.tabletopService.cardStacks; }
  get terrains(): Terrain[] { return this.tabletopService.terrains; }
  get textNotes(): TextNote[] { return this.tabletopService.textNotes; }
  get diceSymbols(): DiceSymbol[] { return this.tabletopService.diceSymbols; }
  get peerCursors(): PeerCursor[] { return this.tabletopService.peerCursors; }

  constructor(
    private ngZone: NgZone,
    private contextMenuService: ContextMenuService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService,
    private tabletopService: TabletopService,
    private modalService: ModalService,
  ) { }

  ngOnInit() {
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.data.identifier !== this.currentTable.identifier && event.data.identifier !== this.tableSelecter.identifier) return;
        console.log('UPDATE_GAME_OBJECT GameTableComponent ' + this.currentTable.identifier);

        this.setGameTableGrid(this.currentTable.width, this.currentTable.height, this.currentTable.gridSize, this.currentTable.gridType, this.currentTable.gridColor);
      })
      .on('DRAG_LOCKED_OBJECT', event => {
        this.isTransformMode = true;
        this.pointerDeviceService.isDragging = false;
        let opacity: number = this.tableSelecter.gridShow ? 1.0 : 0.0;
        this.gridCanvas.nativeElement.style.opacity = opacity + '';
      });
    this.tabletopService.makeDefaultTable();
    this.tabletopService.makeDefaultTabletopObjects();
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.input = new InputHandler(this.elementRef.nativeElement, { capture: true });
      this.initializeHammer();
    });
    this.input.onStart = this.onInputStart.bind(this);
    this.input.onMove = this.onInputMove.bind(this);
    this.input.onEnd = this.onInputEnd.bind(this);

    this.setGameTableGrid(this.currentTable.width, this.currentTable.height, this.currentTable.gridSize, this.currentTable.gridType, this.currentTable.gridColor);
    this.setTransform(0, 0, 0, 0, 0, 0);
    this.tabletopService.dragAreaElement = this.gameObjects.nativeElement;
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.input.destroy();
    this.hammer.destroy();
  }

  initializeHammer() {
    this.hammer = new Hammer.Manager(this.rootElementRef.nativeElement, { inputClass: Hammer.TouchInput });

    let tap = new Hammer.Tap();
    let pan1p = new Hammer.Pan({ event: 'pan1p', pointers: 1, threshold: 0 });
    let pan2p = new Hammer.Pan({ event: 'pan2p', pointers: 2, threshold: 0 });
    let pinch = new Hammer.Pinch();
    let rotate = new Hammer.Rotate();

    pan1p.recognizeWith(pan2p);
    pan1p.recognizeWith(rotate);
    pan1p.recognizeWith(pinch);

    pan2p.recognizeWith(pinch);
    pan2p.recognizeWith(rotate);
    pinch.recognizeWith(rotate);

    this.hammer.add([tap, pan1p, pan2p, pinch, rotate]);

    this.hammer.on('hammer.input', this.onHammer.bind(this));
    this.hammer.on('tap', this.onTap.bind(this));
    this.hammer.on('pan1pstart', this.onTappedPanStart.bind(this));
    this.hammer.on('pan1pmove', this.onTappedPanMove.bind(this));
    this.hammer.on('pan1pend', this.onTappedPanEnd.bind(this));
    this.hammer.on('pan1pcancel', this.onTappedPanEnd.bind(this));
    this.hammer.on('pan2pmove', this.onPanMove.bind(this));
    this.hammer.on('pinchmove', this.onPinchMove.bind(this));
    this.hammer.on('rotatemove', this.onRotateMove.bind(this));
  }

  onHammer(ev: HammerInput) {
    if (ev.isFirst) {
      this.deltaHammerScale = ev.scale;
      this.deltaHammerRotation = ev.rotation;
      this.deltaHammerDeltaX = ev.deltaX;
      this.deltaHammerDeltaY = ev.deltaY;
    } else {
      this.deltaHammerScale = ev.scale - this.prevHammerScale;
      this.deltaHammerRotation = ev.rotation - this.prevHammerRotation;
      this.deltaHammerDeltaX = ev.deltaX - this.prevHammerDeltaX;
      this.deltaHammerDeltaY = ev.deltaY - this.prevHammerDeltaY;
    }
    this.prevHammerScale = ev.scale;
    this.prevHammerRotation = ev.rotation;
    this.prevHammerDeltaX = ev.deltaX;
    this.prevHammerDeltaY = ev.deltaY;

    if (this.tappedPanTimer == null || ev.eventType != Hammer.INPUT_START) return;
    let distance = (this.tappedPanCenter.x - ev.center.x) ** 2 + (this.tappedPanCenter.y - ev.center.y) ** 2;
    if (75 ** 2 < distance) {
      clearTimeout(this.tappedPanTimer);
      this.tappedPanTimer = null;
    }
  }

  onTap(ev: HammerInput) {
    this.cancelInput();
    this.tappedPanCenter = ev.center;
    this.tappedPanTimer = setTimeout(() => { this.tappedPanTimer = null; }, 400);
  }

  onTappedPanStart(ev: HammerInput) {
    if (this.tappedPanTimer == null) return;
    clearTimeout(this.tappedPanTimer);
    this.cancelInput();
  }

  onTappedPanEnd(ev: HammerInput) {
    clearTimeout(this.tappedPanTimer);
    this.tappedPanTimer = null;
  }

  onTappedPanMove(ev: HammerInput) {
    if (this.tappedPanTimer == null) {
      if (!this.isTransformMode || this.input.isGrabbing) return;

      let transformX = 0;
      let transformY = 0;
      let transformZ = 0;

      let scale = (1000 + Math.abs(this.viewPotisonZ)) / 1000;
      transformX = this.deltaHammerDeltaX * scale;
      transformY = this.deltaHammerDeltaY * scale;

      if (!this.pointerDeviceService.isAllowedToOpenContextMenu && this.contextMenuService.isShow) {
        this.ngZone.run(() => { this.contextMenuService.close(); });
      }

      this.setTransform(transformX, transformY, transformZ, 0, 0, 0);

    } else {
      clearTimeout(this.tappedPanTimer);
      this.cancelInput();

      let scale = this.deltaHammerDeltaY;
      let transformZ = scale * 7.5;

      if (750 < transformZ + this.viewPotisonZ) transformZ += 750 - (transformZ + this.viewPotisonZ);

      this.setTransform(0, 0, transformZ, 0, 0, 0);
    }
  }

  onPanMove(ev: HammerInput) {
    clearTimeout(this.tappedPanTimer);
    this.tappedPanTimer = null;
    this.cancelInput();
    let rotateX = -this.deltaHammerDeltaY / window.innerHeight * 100;

    if (80 < rotateX + this.viewRotateX) rotateX += 80 - (rotateX + this.viewRotateX);
    if (rotateX + this.viewRotateX < 0) rotateX += 0 - (rotateX + this.viewRotateX);

    this.setTransform(0, 0, 0, rotateX, 0, 0);
  }

  onPinchMove(ev: HammerInput) {
    clearTimeout(this.tappedPanTimer);
    this.tappedPanTimer = null;
    this.cancelInput();
    let transformZ = this.deltaHammerScale * 500;

    if (750 < transformZ + this.viewPotisonZ) transformZ += 750 - (transformZ + this.viewPotisonZ);

    this.setTransform(0, 0, transformZ, 0, 0, 0);
  }

  onRotateMove(ev: HammerInput) {
    clearTimeout(this.tappedPanTimer);
    this.tappedPanTimer = null;
    this.cancelInput();
    let rotateZ = this.deltaHammerRotation;
    this.setTransform(0, 0, 0, 0, 0, rotateZ);
  }

  onInputStart(e: any) {
    this.currentPositionX = this.input.pointer.x;
    this.currentPositionY = this.input.pointer.y;

    if (e.target.contains(this.gameObjects.nativeElement) || e.button === 1 || e.button === 2) {
      this.isTransformMode = true;
    } else {
      this.isTransformMode = false;
      this.pointerDeviceService.isDragging = true;
      this.gridCanvas.nativeElement.style.opacity = 1.0 + '';
    }

    this.buttonCode = e.button;

    if (!document.activeElement.contains(e.target)) {
      this.removeSelectionRanges();
      this.removeFocus();
    }
  }

  onInputEnd(e: any) {
    this.cancelInput();
  }

  onInputMove(e: any) {
    if (!this.isTransformMode || this.tappedPanTimer != null) return;

    let x = this.input.pointer.x;
    let y = this.input.pointer.y;
    let deltaX = x - this.currentPositionX;
    let deltaY = y - this.currentPositionY;

    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    if (this.buttonCode === 2) {
      rotateZ = -deltaX / 5;
      rotateX = -deltaY / 5;
    } else {
      let scale = (1000 + Math.abs(this.viewPotisonZ)) / 1000;
      transformX = deltaX * scale;
      transformY = deltaY * scale;
    }

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu && this.contextMenuService.isShow) {
      this.ngZone.run(() => { this.contextMenuService.close(); });
    }

    this.currentPositionX = x;
    this.currentPositionY = y;

    this.setTransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ);
  }

  cancelInput() {
    this.input.cancel();
    this.pointerDeviceService.isDragging = false;
    let opacity: number = this.tableSelecter.gridShow ? 1.0 : 0.0;
    this.gridCanvas.nativeElement.style.opacity = opacity + '';
  }

  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent) {
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
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;

    let menuPosition = this.pointerDeviceService.pointers[0];
    let objectPosition = this.tabletopService.calcTabletopLocalCoordinate();
    let menuActions: ContextMenuAction[] = [];

    Array.prototype.push.apply(menuActions, this.tabletopService.getContextMenuActionsForCreateObject(objectPosition));
    menuActions.push(ContextMenuSeparator);
    menuActions.push({
      name: 'テーブル設定', action: () => {
        this.modalService.open(GameTableSettingComponent);
      }
    });
    this.contextMenuService.open(menuPosition, menuActions, this.currentTable.name);
  }

  private setTransform(transformX: number, transformY: number, transformZ: number, rotateX: number, rotateY: number, rotateZ: number) {
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
    this.gridCanvas.nativeElement.style.opacity = opacity + '';
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

  trackByGameObject(index: number, gameObject: GameObject) {
    return gameObject.identifier;
  }
}
