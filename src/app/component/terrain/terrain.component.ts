import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, HostListener, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
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

  @ViewChild('root') rootElementRef: ElementRef;

  @Input() terrain: Terrain = null;
  @Input() is3D: boolean = false;

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

  private callbackOnMouseUp = (e) => this.onMouseUp(e);;
  private callbackOnMouseMove = (e) => this.onMouseMove(e);;

  private callbackOnRotateMouseMove = (e) => this.onRotateMouseMove(e);
  private callbackOnRotateMouseUp = (e) => this.onRotateMouseUp(e);
  private startRotate: number = 0;

  isDragging: boolean = false;

  private startDragPoint: PointerCoordinate = { x: 0, y: 0 };

  gridSize: number = 50;

  private updateInterval: NodeJS.Timer = null;
  private allowOpenContextMenu: boolean = false;

  get name(): string { return this.terrain.name; }
  get rotate(): number { return this.terrain.rotate; }
  set rotate(rotate: number) { this.terrain.rotate = rotate; }
  get mode(): TerrainViewState { return this.terrain.mode; }
  set mode(mode: TerrainViewState) { this.terrain.mode = mode; }

  get isLocked(): boolean { return this.terrain.isLocked; }
  set isLocked(isLocked: boolean) { this.terrain.isLocked = isLocked; }
  get hasWall(): boolean { return this.terrain.hasWall; }
  get hasFloor(): boolean { return this.terrain.hasFloor; }

  get wallImage(): ImageFile { return this.terrain.wallImage; }
  get floorImage(): ImageFile { return this.terrain.floorImage; }

  get height(): number { return this.adjustMinBounds(this.terrain.height); }
  get width(): number { return this.adjustMinBounds(this.terrain.width); }
  get depth(): number { return this.adjustMinBounds(this.terrain.depth); }

  constructor(
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.setPosition(this.terrain);
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.isSendFromSelf || event.data.identifier !== this.terrain.identifier) return;
        this.isDragging = false;
        this.setPosition(this.terrain);
      });
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

  @HostListener('dragstart', ['$event'])
  onDragstart(e) {
    console.log('Dragstart Cancel !!!!');
    e.stopPropagation();
    e.preventDefault();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: any) {
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

    console.log('onSelectedGameCharacter', this.terrain.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.terrain.identifier, className: 'GameCharacter' });

    e.preventDefault();

    this.startDragPoint = this.pointerDeviceService.pointers[0];

    // TODO:もっと良い方法考える
    if (this.isLocked) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', {});
    }
  }

  onMouseUp(e: any) {
    //console.log('GameCharacterComponent mouseup !!!!');
    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
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
      this.allowOpenContextMenu = false;
    }
    if (this.isDragging) {
      if (this.isLocked) return;
      this.calcLocalCoordinate();
      if ((this.pointerPrev.y === this.pointer.y && this.pointerPrev.x === this.pointer.x)) return;

      let width: number = this.gridSize * this.width;
      let height: number = this.gridSize * this.height;

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
    if (this.rotate !== angle) {
      this.allowOpenContextMenu = false;
    }
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
      (this.isLocked
        ? {
          name: '固定解除', action: () => {
            this.isLocked = false;
            this.terrain.update();
          }
        } : {
          name: '固定する', action: () => {
            this.isLocked = true;
            this.terrain.update();
          }
        }),
      (this.hasWall
        ? {
          name: '壁を非表示', action: () => {
            this.mode = TerrainViewState.FLOOR;
            if (this.depth * this.width === 0) {
              this.terrain.width = this.width <= 0 ? 1 : this.width;
              this.terrain.depth = this.depth <= 0 ? 1 : this.depth;
            }
          }
        } : {
          name: '壁を表示', action: () => {
            this.mode = TerrainViewState.ALL;
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
    ], this.name);
  }

  private showDetail(gameObject: Terrain) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 250, top: coordinate.y - 150, width: 500, height: 300 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private setPosition(object: Terrain) {
    this._posX = object.location.x;
    this._posY = object.location.y;
    this._posZ = object.posZ;
  }

  private calcRotate(pointer: PointerCoordinate, startRotate: number): number {
    let div: HTMLDivElement = this.rootElementRef.nativeElement;
    let centerX = div.clientWidth / 2 + this.posX;
    let centerY = div.clientHeight / 2 + this.posY;
    let x = pointer.x - centerX;
    let y = pointer.y - centerY;
    let rad = Math.atan2(y, x);
    return (rad * 180 / Math.PI) - startRotate;
  }

  private setUpdateTimer() {
    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.terrain.location.x = this.posX;
        this.terrain.location.y = this.posY;
        this.terrain.posZ = this.posZ;
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

  private addRotateEventListeners() {
    document.body.addEventListener('mouseup', this.callbackOnRotateMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnRotateMouseMove, false);
  }

  private removeRotateEventListeners() {
    document.body.removeEventListener('mouseup', this.callbackOnRotateMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnRotateMouseMove, false);
  }
}