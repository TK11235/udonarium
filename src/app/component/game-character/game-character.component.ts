import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';

import { ImageFile } from '../../class/core/file-storage/image-file';
import { EventSystem, Network } from '../../class/core/system/system';
import { GameCharacter } from '../../class/game-character';
import { ContextMenuService } from '../../service/context-menu.service';
import { PanelOption, PanelService } from '../../service/panel.service';
import { PointerCoordinate, PointerDeviceService } from '../../service/pointer-device.service';
import { ChatPaletteComponent } from '../chat-palette/chat-palette.component';
import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';

@Component({
  selector: 'game-character',
  templateUrl: './game-character.component.html',
  styleUrls: ['./game-character.component.css'],
  animations: [
    trigger('bounceInOut', [
      state('in', style({ transform: 'scale3d(1, 1, 1)' })),
      transition('void => *', [
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
  @Input() gameCharacter: GameCharacter = null;
  @Input() is3D: boolean = false;

  get name(): string { return this.gameCharacter.name; }
  get size(): number { return this.adjustMinBounds(this.gameCharacter.size); }
  get imageFile(): ImageFile { return this.gameCharacter.imageFile; }

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

  private callbackOnMouseUp = (e) => this.onMouseUp(e);
  private callbackOnMouseMove = (e) => this.onMouseMove(e);

  isDragging: boolean = false;
  gridSize: number = 50;
  private updateInterval: NodeJS.Timer = null;
  private allowOpenContextMenu: boolean = false;
  get isPointerDragging(): boolean { return this.pointerDeviceService.isDragging; }

  constructor(
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.setPosition(this.gameCharacter);
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.isSendFromSelf || event.data.identifier !== this.gameCharacter.identifier) return;
        this.isDragging = false;
        this.setPosition(this.gameCharacter);
      });
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
    this.dragAreaElement = this.findDragAreaElement(this.elementRef.nativeElement.parentElement);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.removeMouseEventListeners();
  }

  @HostListener('dragstart', ['$event'])
  onDragstart(e: any) {
    console.log('Dragstart Cancel !!!!');
    e.stopPropagation();
    e.preventDefault();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: any) {
    console.log('GameCharacterComponent mousedown !!!', this.gameCharacter);
    e.preventDefault();

    this.allowOpenContextMenu = true;

    // TODO:もっと良い方法考える
    if (e.button === 2) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', {});
      return;
    }

    this.addMouseEventListeners();

    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: this.gameCharacter.identifier, className: this.gameCharacter.aliasName });
  }

  onMouseUp(e: any) {
    e.preventDefault();

    setTimeout(() => { this.allowOpenContextMenu = false; }, 0);
    this.isDragging = false;
    this.removeMouseEventListeners();

    let deltaX = this.posX % 25;
    let deltaY = this.posY % 25;

    this.posX += deltaX < 12.5 ? -deltaX : 25 - deltaX;
    this.posY += deltaY < 12.5 ? -deltaY : 25 - deltaY;
  }

  onMouseMove(e: any) {
    if (this.isDragging) {
      this.pointer = this.calcLocalCoordinate(e, this.pointer);
      if (this.pointerPrev.x === this.pointer.x
        && this.pointerPrev.y === this.pointer.y
        && this.pointerPrev.z === this.pointer.z) return;

      this.allowOpenContextMenu = false;

      let distance = this.calcDistance(this.pointerStart, this.pointer);
      if (distance < this.delta) this.delta = distance;

      this.pointerPrev.x = this.pointer.x;
      this.pointerPrev.y = this.pointer.y;
      this.pointerPrev.z = this.pointer.z;

      let size: number = this.gridSize * this.size;
      this.posX = this.pointer.x + (this.pointerOffset.x * this.delta) + (-(size / 2) * (1.0 - this.delta));
      this.posY = this.pointer.y + (this.pointerOffset.y * this.delta) + (-(size / 2) * (1.0 - this.delta));
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

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    this.isDragging = false;
    this.removeMouseEventListeners();

    if (this.allowOpenContextMenu === false) return;
    this.allowOpenContextMenu = false;

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
    ], this.name);
  }

  private calcDistance(start: PointerCoordinate, now: PointerCoordinate): number {
    let distanceY = start.y - now.y;
    let distanceX = start.x - now.x;
    let distanceZ = (start.z - now.z) * this.gridSize * 3;

    let ratio: number = this.size;
    ratio = ratio < 0 ? 0.01 : ratio;
    ratio = this.gridSize * 4 * 9 / (ratio + 2);

    return ratio / (Math.sqrt(distanceY * distanceY + distanceX * distanceX + distanceZ * distanceZ) + ratio);
  }

  private calcLocalCoordinate(event: Event, pointer: PointerCoordinate): PointerCoordinate {
    let isTerrain = true;
    let isCharacter = false;
    let node: HTMLElement = <HTMLElement>event.target;
    while (node) {
      if (node === this.dragAreaElement) break;
      if (node === this.elementRef.nativeElement) {
        isTerrain = false;
        isCharacter = true;
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
      coordinate.z = isCharacter ? this.pointer.z : 0;
    }

    return { x: coordinate.x, y: coordinate.y, z: 0 < coordinate.z ? coordinate.z : 0 };
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
  }

  private setPosition(object: GameCharacter) {
    this._posX = object.location.x;
    this._posY = object.location.y;
    this._posZ = object.posZ;
  }

  private setUpdateTimer() {
    if (this.updateInterval === null) {
      this.updateInterval = setTimeout(() => {
        this.gameCharacter.location.x = this.posX;
        this.gameCharacter.location.y = this.posY;
        this.gameCharacter.posZ = this.posZ;
        this.updateInterval = null;
      }, 66);
    }
  }

  private addMouseEventListeners() {
    document.body.addEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.addEventListener('mousemove', this.callbackOnMouseMove, false);
  }

  private removeMouseEventListeners() {
    document.body.removeEventListener('mouseup', this.callbackOnMouseUp, false);
    document.body.removeEventListener('mousemove', this.callbackOnMouseMove, false);
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  private showDetail(gameObject: GameCharacter) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 400, top: coordinate.y - 300, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private showChatPalette(gameObject: GameCharacter) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 250, top: coordinate.y - 175, width: 500, height: 350 };
    let component = this.panelService.open<ChatPaletteComponent>(ChatPaletteComponent, option);
    component.character = gameObject;
  }
}
