import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';

import { ImageFile } from '../../class/core/file-storage/image-file';
import { EventSystem } from '../../class/core/system/system';
import { GameTableMask } from '../../class/game-table-mask';
import { ContextMenuService } from '../../service/context-menu.service';
import { PanelOption, PanelService } from '../../service/panel.service';
import { PointerCoordinate, PointerDeviceService } from '../../service/pointer-device.service';
import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';

@Component({
  selector: 'game-table-mask',
  templateUrl: './game-table-mask.component.html',
  styleUrls: ['./game-table-mask.component.css']
})
export class GameTableMaskComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() gameTableMask: GameTableMask = null;
  @Input() is3D: boolean = false;

  get name(): string { return this.gameTableMask.name; }
  get width(): number { return this.adjustMinBounds(this.gameTableMask.width); }
  get height(): number { return this.adjustMinBounds(this.gameTableMask.height); }
  get opacity(): number { return this.gameTableMask.opacity; }
  get imageFile(): ImageFile { return this.gameTableMask.imageFile; }
  get isLock(): boolean { return this.gameTableMask.isLock; }
  set isLock(isLock: boolean) { this.gameTableMask.isLock = isLock; }

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
  
  private startDragPoint: PointerCoordinate = { x: 0, y: 0 };

  private callbackOnMouseUp = (e) => this.onMouseUp(e);
  private callbackOnMouseMove = (e) => this.onMouseMove(e);

  isDragging: boolean = false;
  gridSize: number = 50;

  private updateInterval: NodeJS.Timer = null;
  private isAllowedToOpenContextMenu: boolean = false;

  constructor(
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.setPosition(this.gameTableMask);
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.isSendFromSelf || event.data.identifier !== this.gameTableMask.identifier) return;
        this.isDragging = false;
        this.setPosition(this.gameTableMask);
      });
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.removeMouseEventListeners();
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
    this.isAllowedToOpenContextMenu = true;
    this.pointer = this.calcLocalCoordinate(this.pointerDeviceService.pointers[0]);

    this.isDragging = true;

    this.pointerOffset.y = this.posY - this.pointer.y;
    this.pointerOffset.x = this.posX - this.pointer.x;

    this.delta = 1.0;
    this.pointerStart.y = this.pointerPrev.y = this.pointer.y;
    this.pointerStart.x = this.pointerPrev.x = this.pointer.x;

    console.log('onSelectedGameCharacter', this.gameTableMask.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.gameTableMask.identifier, className: 'GameCharacter' });

    this.startDragPoint = this.pointerDeviceService.pointers[0];

    e.preventDefault();

    // TODO:もっと良い方法考える
    if (this.isLock) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', {});
    } else {
      this.addMouseEventListeners();
    }
  }

  onMouseUp(e: any) {
    setTimeout(() => { this.isAllowedToOpenContextMenu = false; }, 0);
    this.isDragging = false;

    this.removeMouseEventListeners();

    let deltaX = this.posX % 25;
    let deltaY = this.posY % 25;

    this.posX += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.posY += deltaY < 12.5 ? -deltaY : 25 - deltaY;

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.startDragPoint.x !== this.pointerDeviceService.pointers[0].x || this.startDragPoint.y !== this.pointerDeviceService.pointers[0].y) {
      this.isAllowedToOpenContextMenu = false;
    }
    if (this.isDragging && !this.isLock) {
      this.pointer = this.calcLocalCoordinate(this.pointerDeviceService.pointers[0]);
      if ((this.pointerPrev.y === this.pointer.y && this.pointerPrev.x === this.pointer.x)) return;
      let width: number = this.gridSize * this.width;
      let height: number = this.gridSize * this.height;

      this.posX = this.pointer.x + (this.pointerOffset.x * this.delta) + (-(width / 2) * (1.0 - this.delta));
      this.posY = this.pointer.y + (this.pointerOffset.y * this.delta) + (-(height / 2) * (1.0 - this.delta));

      this.pointerPrev.y = this.pointer.y;
      this.pointerPrev.x = this.pointer.x;
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    this.isDragging = false;
    this.removeMouseEventListeners();

    if (this.isAllowedToOpenContextMenu === false) return;
    this.isAllowedToOpenContextMenu = false;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      (this.isLock
        ? { name: '固定解除', action: () => { this.isLock = false; } }
        : { name: '固定する', action: () => { this.isLock = true; } }
      ),
      { name: 'マップマスクを編集', action: () => { this.showDetail(this.gameTableMask); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.gameTableMask.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.update();
        }
      },
      { name: '削除する', action: () => { this.gameTableMask.destroy(); } },
    ], this.name);
  }

  private calcLocalCoordinate(pointer: PointerCoordinate): PointerCoordinate {
    let coordinate = PointerDeviceService.convertToLocal(pointer, this.dragAreaElement);
    return { x: coordinate.x, y: coordinate.y, z: coordinate.z };
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
  }

  private setPosition(object: GameTableMask) {
    this._posX = object.location.x;
    this._posY = object.location.y;
    this._posZ = object.posZ;
  }

  private setUpdateTimer() {
    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.gameTableMask.location.x = this.posX;
        this.gameTableMask.location.y = this.posY;
        this.gameTableMask.posZ = this.posZ;
        this.updateInterval = null;
      }, 66);
    }
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  private addMouseEventListeners() {
    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);
  }

  private removeMouseEventListeners() {
    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);
  }

  private showDetail(gameObject: GameTableMask) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 200, top: coordinate.y - 150, width: 400, height: 300 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }
}