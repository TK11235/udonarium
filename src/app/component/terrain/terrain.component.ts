import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ContextMenuService } from '../../service/context-menu.service';
import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerDeviceService, PointerCoordinate } from '../../service/pointer-device.service';

import { Terrain, TerrainViewState } from '../../class/terrain';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ImageFile } from '../../class/core/file-storage/image-file';

@Component({
  selector: 'terrain',
  templateUrl: './terrain.component.html',
  styleUrls: ['./terrain.component.css']
})
export class TerrainComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('tableMask') gameChar: ElementRef;

  @Input() terrain: Terrain = null;
  //@Input() top: number = 0;
  //@Input() left: number = 0;
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
  private startRotate: number = 0;

  private callbackOnDragstart: any = null;

  private updateIntervalFlag: boolean = true;
  private lastUpdateTimeStamp: number = 0;
  isDragging: boolean = false;

  private prevTop: number = 0;
  private prevLeft: number = 0;

  private startDragPoint: PointerCoordinate = { x: 0, y: 0 };

  gridSize: number = 50;

  private $gameCharElement: JQuery = null;

  private updateInterval: NodeJS.Timer = null;
  private allowOpenContextMenu: boolean = false;

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
        if (event.isSendFromSelf || event.data.identifier !== this.terrain.identifier) return;
        //console.log('UPDATE_GAME_OBJECT GameCharacterComponent ' + this.gameCharacter.identifier);
        //if (event.sender === NetworkProxy.myPeerId) return;
        this.isDragging = false;

        this.setPosition(this.terrain.location.x, this.terrain.location.y);
        //if (event.data.identifier === this.gameCharacter.identifier) this.changeDetector.markForCheck();
      });
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement);

    let element = this.elementRef.nativeElement;

    this.$gameCharElement = $(this.gameChar.nativeElement);

    this.setPosition(this.terrain.location.x, this.terrain.location.y);

    this.callbackOnMouseDown = (e) => this.onMouseDown(e);
    this.callbackOnMouseUp = (e) => this.onMouseUp(e);
    this.callbackOnMouseMove = (e) => this.onMouseMove(e);
    this.callbackOnPanelMouseDown = (e) => this.onPanelMouseDown(e);
    this.callbackOnDragstart = (e) => this.onDragstart(e);

    element.addEventListener('mousedown', this.callbackOnMouseDown, false);
    //this.gameCharImage.nativeElement.addEventListener('mousedown', this.callbackOnMouseDown, false);
    //this.gamePanel.nativeElement.addEventListener('mousedown', this.callbackOnPanelMouseDown, false);
    element.addEventListener('dragstart', this.callbackOnDragstart, false);
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

    this.callbackOnMouseDown = null;
    this.callbackOnMouseUp = null;
    this.callbackOnMouseMove = null;
    this.callbackOnPanelMouseDown = null;
    this.callbackOnDragstart = null;
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

    //if (this.gameTableMask.isLock) return;

    this.allowOpenContextMenu = true;
    this.calcLocalCoordinate();

    this.isDragging = true;

    this.offsetTop = this.terrain.location.y - this.top;
    this.offsetLeft = this.terrain.location.x - this.left;

    this.delta = 1.0;
    this.startTop = this.top;
    this.startLeft = this.left;

    this.prevTop = this.top;
    this.prevLeft = this.left;

    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);

    console.log('onSelectedGameCharacter', this.terrain.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.terrain.identifier, className: 'GameCharacter' });

    e.preventDefault();

    this.startDragPoint = this.pointerDeviceService.pointers[0];

    // TODO:もっと良い方法考える
    if (this.terrain.isLocked) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', {});
    }
  }

  onMouseUp(e: any) {
    //console.log('GameCharacterComponent mouseup !!!!');
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    this.isDragging = false;

    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);

    let deltaX = this.terrain.location.x % 25;
    let deltaY = this.terrain.location.y % 25;

    this.terrain.location.x += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.terrain.location.y += deltaY < 12.5 ? -deltaY : 25 - deltaY;
    this.setPosition(this.terrain.location.x, this.terrain.location.y);

    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.terrain.update();
        this.updateInterval = null;
      }, 66);
    }

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.startDragPoint.x !== this.pointerDeviceService.pointers[0].x || this.startDragPoint.y !== this.pointerDeviceService.pointers[0].y) {
      this.allowOpenContextMenu = false;
    }
    if (this.isDragging) {
      if (this.terrain.isLocked) return;
      this.calcLocalCoordinate();
      if ((this.prevTop === this.top && this.prevLeft === this.left)) return;

      let width: number = this.gridSize * this.terrain.width;
      let height: number = this.gridSize * this.terrain.height;

      //this.gameTableMask.location.x = this.left + (this.offsetLeft * this.delta) + (-(width / 2) * (1.0 - this.delta));
      //this.gameTableMask.location.y = this.top + (this.offsetTop * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.terrain.location.x = this.left + (this.offsetLeft * this.delta) + (-(width / 2) * (1.0 - this.delta));
      this.terrain.location.y = this.top + (this.offsetTop * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.setPosition(this.terrain.location.x, this.terrain.location.y);

      if (this.updateInterval === null) {
        this.updateInterval = setTimeout(() => {
          this.terrain.update();
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
    let centerX = div.clientWidth / 2 + this.terrain.location.x;
    let centerY = div.clientHeight / 2 + this.terrain.location.y;
    let x = this.left - centerX;
    let y = this.top - centerY;
    //let rad = Math.atan(y / x);
    let rad = Math.atan2(y, x);

    this.startRotate = (rad * 180 / Math.PI) - this.terrain.rotate;
    document.body.addEventListener('mouseup', this.callbackOnRotateMouseUp);
    document.body.addEventListener('mousemove', this.callbackOnRotateMouseMove);
  }

  onRotateMouseMove(e: MouseEvent) {
    e.stopPropagation();
    this.calcLocalCoordinate();
    let div: HTMLDivElement = this.gameChar.nativeElement;
    let centerX = div.clientWidth / 2 + this.terrain.location.x;
    let centerY = div.clientHeight / 2 + this.terrain.location.y;
    let x = this.left - centerX;
    let y = this.top - centerY;
    //console.log('onRotateMouseMove!!!!', this.left, this.top, x, y, Math.atan(y / x) * 180 / Math.PI, centerX, centerY);

    //let rad = Math.atan(y / x);
    let rad = Math.atan2(y, x);
    let angle = (rad * 180 / Math.PI) - this.startRotate;
    if (this.terrain.rotate !== angle) {
      this.allowOpenContextMenu = false;
    }
    this.terrain.rotate = angle;
  }

  onRotateMouseUp(e: MouseEvent) {
    this.isDragging = false;
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    e.stopPropagation();
    document.body.removeEventListener('mouseup', this.callbackOnRotateMouseUp);
    document.body.removeEventListener('mousemove', this.callbackOnRotateMouseMove);

    this.terrain.rotate = this.terrain.rotate < 0 ? this.terrain.rotate - 22.5 : this.terrain.rotate + 22.5;
    this.terrain.rotate -= (this.terrain.rotate) % 45;
  }

  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();
    if (this.allowOpenContextMenu === false) return;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      (this.terrain.isLocked ? {
        name: '固定解除', action: () => {
          this.terrain.isLocked = false;
          this.terrain.update();
        }
      } : {
          name: '固定する', action: () => {
            this.terrain.isLocked = true;
            this.terrain.update();
          }
        }),
      (this.terrain.hasWall ? {
        name: '壁を非表示', action: () => {
          this.terrain.mode = TerrainViewState.FLOOR;
          if (this.terrain.height * this.terrain.width === 0) {
            this.terrain.width = this.terrain.width <= 0 ? 1 : this.terrain.width;
            this.terrain.height = this.terrain.height <= 0 ? 1 : this.terrain.height;
          }
        }
      } : {
          name: '壁を表示', action: () => {
            this.terrain.mode = TerrainViewState.ALL;
          }
        }),
      { name: '地形設定を編集', action: () => { this.showDetail(this.terrain); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.terrain.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.update();
        }
      },
      { name: '削除する', action: () => { this.terrain.destroy(); } },
    ], this.terrain.name);
  }

  private showDetail(gameObject: Terrain) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    //this.modalService.open(GameCharacterSheetComponent);
    let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  setPosition(x: number, y: number) {
    if (this.$gameCharElement) this.$gameCharElement.css('transform', 'translateZ(0.01px) translateX(' + x + 'px) translateY(' + y + 'px)');
  }
}