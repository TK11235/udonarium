import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild, NgZone } from '@angular/core';

import { ImageFile } from '../../class/core/file-storage/image-file';
import { EventSystem } from '../../class/core/system/system';
import { Terrain, TerrainViewState } from '../../class/terrain';
import { ContextMenuService } from '../../service/context-menu.service';
import { PanelOption, PanelService } from '../../service/panel.service';
import { PointerCoordinate, PointerDeviceService } from '../../service/pointer-device.service';
import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { TextNote } from '../../class/text-note';
import { TabletopObject } from '../../class/tabletop-object';

@Component({
  selector: 'text-note',
  templateUrl: './text-note.component.html',
  styleUrls: ['./text-note.component.css']
})
export class TextNoteComponent implements OnInit {
  @ViewChild('root') rootElementRef: ElementRef;
  @ViewChild('textArea') textAreaElementRef: ElementRef;

  @Input() textNote: TextNote = null;
  @Input() is3D: boolean = false;

  get title(): string { return this.textNote.title; }
  get text(): string { this.calcFitHeightIfNeeded(); return this.textNote.text; }
  set text(text: string) { this.calcFitHeightIfNeeded(); this.textNote.text = text; }
  get fontSize(): number { this.calcFitHeightIfNeeded(); return this.textNote.fontSize; }
  get imageFile(): ImageFile { return this.textNote.imageFile; }
  get rotate(): number { return this.textNote.rotate; }
  set rotate(rotate: number) { this.textNote.rotate = rotate; }
  get height(): number { return this.adjustMinBounds(this.textNote.height); }
  get width(): number { return this.adjustMinBounds(this.textNote.width); }

  private _posX: number = 0;
  private _posY: number = 0;
  private _posZ: number = 0;

  get posX(): number { return this._posX; }
  set posX(posX: number) { this._posX = posX; this.setUpdateTimer(); }
  get posY(): number { return this._posY; }
  set posY(posY: number) { this._posY = posY; this.setUpdateTimer(); }
  get posZ(): number { return this._posZ; }
  set posZ(posZ: number) { this._posZ = posZ; this.setUpdateTimer(); }

  get isSelected(): boolean { return document.activeElement === this.textAreaElementRef.nativeElement; }

  private dragAreaElement: HTMLElement = null;

  private pointer: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerOffset: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerStart: PointerCoordinate = { x: 0, y: 0, z: 0 };
  private pointerPrev: PointerCoordinate = { x: 0, y: 0, z: 0 };

  private delta: number = 1.0;

  private startDragPoint: PointerCoordinate = { x: 0, y: 0 };
  private startRotate: number = 0;

  private callbackOnMouseUp = (e) => this.onMouseUp(e);
  private callbackOnMouseMove = (e) => this.onMouseMove(e);

  private callbackOnRotateMouseMove = (e) => this.onRotateMouseMove(e);
  private callbackOnRotateMouseUp = (e) => this.onRotateMouseUp(e);

  isDragging: boolean = false;
  get isPointerDragging(): boolean { return this.pointerDeviceService.isDragging; }

  gridSize: number = 50;

  private updateInterval: NodeJS.Timer = null;
  private isAllowedToOpenContextMenu: boolean = false;

  private doubleClickTimer: NodeJS.Timer = null;
  private doubleClickPoint = { x: 0, y: 0 };

  private calcFitHeightTimer: NodeJS.Timer = null;

  constructor(
    private ngZone: NgZone,
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.setPosition(this.textNote);
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.isSendFromSelf || event.data.identifier !== this.textNote.identifier) return;
        this.isDragging = false;
        this.setPosition(this.textNote);
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

  @HostListener('dragstart', ['$event'])
  onDragstart(e) {
    console.log('Dragstart Cancel !!!!');
    e.stopPropagation();
    e.preventDefault();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: any) {
    if (this.isSelected) return;
    e.preventDefault();
    this.textNote.toTopmost();
    this.isAllowedToOpenContextMenu = true;
    this.addMouseEventListeners();

    this.startDragPoint = this.pointerDeviceService.pointers[0];
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.textNote.identifier, className: this.textNote.aliasName });
  }


  onMouseUp(e: any) {
    setTimeout(() => { this.isAllowedToOpenContextMenu = false; }, 0);
    this.isDragging = false;

    if (this.startDragPoint.x === this.pointerDeviceService.pointerX && this.startDragPoint.y === this.pointerDeviceService.pointerY && e.button === 0) {
      console.log('this.textAreaElementRef.nativeElement.focus() !!!!');
      let selection = window.getSelection();
      if (!selection.isCollapsed) selection.removeAllRanges();
      this.textAreaElementRef.nativeElement.focus();
    }
    this.removeMouseEventListeners();

    let deltaX = this.posX % 25;
    let deltaY = this.posY % 25;

    this.posX += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.posY += deltaY < 12.5 ? -deltaY : 25 - deltaY;

    e.preventDefault();
  }

  onMouseMove(e: any) {
    if (this.isDragging) {
      this.pointer = this.calcLocalCoordinate(e, this.pointer);
      if (this.pointerPrev.x === this.pointer.x
        && this.pointerPrev.y === this.pointer.y
        && this.pointerPrev.z === this.pointer.z) return;

      this.isAllowedToOpenContextMenu = false;

      let distance = this.calcDistance(this.pointerStart, this.pointer);
      if (distance < this.delta) this.delta = distance;

      this.pointerPrev.x = this.pointer.x;
      this.pointerPrev.y = this.pointer.y;
      this.pointerPrev.z = this.pointer.z;

      let widthSize: number = this.gridSize * this.width;
      this.posX = this.pointer.x + (this.pointerOffset.x * this.delta) + (-(widthSize / 2) * (1.0 - this.delta));
      this.posY = this.pointer.y + (this.pointerOffset.y * this.delta) + (-(0 / 2) * (1.0 - this.delta));
      this.posZ = this.pointer.z;
    } else {
      this.pointer.z = this.posZ;
      this.pointerStart.z = this.pointerPrev.z = this.pointer.z;
      this.pointer = this.calcLocalCoordinate(e, this.pointer);

      this.isDragging = true;

      this.pointerOffset.x = this.posX - this.pointer.x;
      this.pointerOffset.y = this.posY - this.pointer.y;

      this.pointerStart.x = this.pointerPrev.x = this.pointer.x;
      this.pointerStart.y = this.pointerPrev.y = this.pointer.y;

      this.delta = 1.0;
    }
  }

  onRotateMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.isAllowedToOpenContextMenu = true;
    e.stopPropagation();
    console.log('onRotateMouseDown!!!!');
    this.pointer = this.calcLocalCoordinate(e, this.pointer);
    this.startRotate = this.calcRotate(this.pointer, this.rotate);
    this.addRotateEventListeners();
  }

  onRotateMouseMove(e: MouseEvent) {
    e.stopPropagation();
    this.pointer = this.calcLocalCoordinate(e, this.pointer);
    let angle = this.calcRotate(this.pointer, this.startRotate);
    if (this.rotate !== angle) {
      this.isAllowedToOpenContextMenu = false;
    }
    this.rotate = angle;
  }

  onRotateMouseUp(e: MouseEvent) {
    this.isDragging = false;
    setTimeout(() => { this.isAllowedToOpenContextMenu = false; }, 0);
    e.stopPropagation();
    this.removeRotateEventListeners();

    this.rotate = this.rotate < 0 ? this.rotate - 22.5 : this.rotate + 22.5;
    this.rotate -= (this.rotate) % 45;
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('onContextMenu');
    this.removeMouseEventListeners();
    this.removeRotateEventListeners();
    if (this.isSelected) return;
    e.stopPropagation();
    e.preventDefault();

    if (this.isAllowedToOpenContextMenu === false) return;
    this.isAllowedToOpenContextMenu = false;
    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      { name: 'メモを編集', action: () => { this.showDetail(this.textNote); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.textNote.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.update();
        }
      },
      { name: '削除する', action: () => { this.textNote.destroy(); } },
    ], this.title);
  }

  private calcDistance(start: PointerCoordinate, now: PointerCoordinate): number {
    let distanceY = start.y - now.y;
    let distanceX = start.x - now.x;
    let distanceZ = (start.z - now.z) * this.gridSize * 3;

    let ratio: number = this.height;
    ratio = ratio < 0 ? 0.01 : ratio;
    ratio = this.gridSize * 4 * 9 / (ratio + 2);

    return ratio / (Math.sqrt(distanceY * distanceY + distanceX * distanceX + distanceZ * distanceZ) + ratio);
  }

  private calcLocalCoordinate(event: Event, pointer: PointerCoordinate): PointerCoordinate {
    let isTerrain = true;
    let isSelf = false;
    let node: HTMLElement = <HTMLElement>event.target;
    while (node) {
      if (node === this.dragAreaElement) break;
      if (node === this.elementRef.nativeElement) {
        isTerrain = false;
        isSelf = true;
        break;
      }
      node = node.parentElement;
    }
    if (node == null) isTerrain = false;

    let coordinate: PointerCoordinate = this.pointerDeviceService.pointers[0];

    if (isTerrain) {
      coordinate = PointerDeviceService.convertLocalToLocal(coordinate, <HTMLElement>event.target, this.dragAreaElement);
    } else {
      coordinate = PointerDeviceService.convertToLocal(coordinate, this.dragAreaElement);
      coordinate.z = isSelf ? this.pointer.z : 0;
    }

    return { x: coordinate.x, y: coordinate.y, z: 0 < coordinate.z ? coordinate.z : 0 };
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent.parentElement;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
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

  private setPosition(object: TabletopObject) {
    this._posX = object.location.x;
    this._posY = object.location.y;
    this._posZ = object.posZ;
  }

  private setUpdateTimer() {
    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.textNote.location.x = this.posX;
        this.textNote.location.y = this.posY;
        this.textNote.posZ = this.posZ;
        this.updateInterval = null;
      }, 66);
    }
  }

  calcFitHeightIfNeeded() {
    if (this.calcFitHeightTimer) return;
    this.ngZone.runOutsideAngular(() => {
      this.calcFitHeightTimer = setTimeout(() => {
        this.calcFitHeight();
        this.calcFitHeightTimer = null;
      }, 0);
    });
  }

  calcFitHeight() {
    let textArea: HTMLTextAreaElement = this.textAreaElementRef.nativeElement;
    textArea.style.height = '0';
    if (textArea.scrollHeight > textArea.offsetHeight) {
      textArea.style.height = textArea.scrollHeight + 'px';
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

  private showDetail(gameObject: TabletopObject) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 350, top: coordinate.y - 200, width: 700, height: 400 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }
}
