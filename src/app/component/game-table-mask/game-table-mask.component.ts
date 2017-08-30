import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ContextMenuService } from '../../service/context-menu.service';
import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerDeviceService } from '../../service/pointer-device.service';

import { GameTableMask } from '../../class/game-table-mask';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ImageFile } from '../../class/core/file-storage/image-file';

@Component({
  selector: 'game-table-mask',
  templateUrl: './game-table-mask.component.html',
  styleUrls: ['./game-table-mask.component.css']
})
export class GameTableMaskComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('tableMask') gameChar: ElementRef;

  @Input() gameTableMask: GameTableMask = null;
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

  private callbackOnDragstart: any = null;

  private updateIntervalFlag: boolean = true;
  private lastUpdateTimeStamp: number = 0;
  isDragging: boolean = false;

  private prevTop: number = 0;
  private prevLeft: number = 0;

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
        if (event.sendFrom === Network.peerId || event.data.identifier !== this.gameTableMask.identifier) return;
        //console.log('UPDATE_GAME_OBJECT GameCharacterComponent ' + this.gameCharacter.identifier);
        //if (event.sender === NetworkProxy.myPeerId) return;
        this.isDragging = false;

        this.setPosition(this.gameTableMask.location.x, this.gameTableMask.location.y);
        //if (event.data.identifier === this.gameCharacter.identifier) this.changeDetector.markForCheck();
      });
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement);

    let element = this.elementRef.nativeElement;

    this.$gameCharElement = $(this.gameChar.nativeElement);

    this.setPosition(this.gameTableMask.location.x, this.gameTableMask.location.y);

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

    this.offsetTop = this.gameTableMask.location.y - this.top;
    this.offsetLeft = this.gameTableMask.location.x - this.left;

    this.delta = 1.0;
    this.startTop = this.top;
    this.startLeft = this.left;

    this.prevTop = this.top;
    this.prevLeft = this.left;

    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);

    console.log('onSelectedGameCharacter', this.gameTableMask.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.gameTableMask.identifier, className: 'GameCharacter' });

    e.preventDefault();
  }

  onMouseUp(e: any) {
    //console.log('GameCharacterComponent mouseup !!!!');
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    this.isDragging = false;

    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);

    let deltaX = this.gameTableMask.location.x % 25;
    let deltaY = this.gameTableMask.location.y % 25;

    this.gameTableMask.location.x += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.gameTableMask.location.y += deltaY < 12.5 ? -deltaY : 25 - deltaY;
    this.setPosition(this.gameTableMask.location.x, this.gameTableMask.location.y);

    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.gameTableMask.update();
        this.updateInterval = null;
      }, 66);
    }

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.isDragging) {
      if (this.gameTableMask.isLock) return;
      this.calcLocalCoordinate();
      if ((this.prevTop === this.top && this.prevLeft === this.left)) return;
      this.allowOpenContextMenu = false;

      let width: number = this.gridSize * this.gameTableMask.width;
      let height: number = this.gridSize * this.gameTableMask.height;

      //this.gameTableMask.location.x = this.left + (this.offsetLeft * this.delta) + (-(width / 2) * (1.0 - this.delta));
      //this.gameTableMask.location.y = this.top + (this.offsetTop * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.gameTableMask.location.x = this.left + (this.offsetLeft * this.delta) + (-(width / 2) * (1.0 - this.delta));
      this.gameTableMask.location.y = this.top + (this.offsetTop * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.setPosition(this.gameTableMask.location.x, this.gameTableMask.location.y);

      if (this.updateInterval === null) {
        this.updateInterval = setTimeout(() => {
          this.gameTableMask.update();
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

  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();
    if (this.allowOpenContextMenu === false) return;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      { name: '詳細を表示', action: () => { this.showDetail(this.gameTableMask); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.gameTableMask.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.update();
        }
      },
      (this.gameTableMask.isLock ? {
        name: '固定解除', action: () => {
          this.gameTableMask.isLock = false;
          this.gameTableMask.update();
        }
      } : {
          name: '固定する', action: () => {
            this.gameTableMask.isLock = true;
            this.gameTableMask.update();
          }
        }),
      { name: 'このマップマスクを削除', action: () => { this.gameTableMask.destroy(); } },
    ], this.gameTableMask.name);
  }

  private showDetail(gameObject: GameTableMask) {
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