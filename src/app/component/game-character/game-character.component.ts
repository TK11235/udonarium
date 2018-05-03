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
import { MovableOption } from '../../directive/movable.directive';
import { RotableOption } from '../../directive/rotable.directive';

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
  get rotate(): number { return this.gameCharacter.rotate; }
  set rotate(rotate: number) { this.gameCharacter.rotate = rotate; }

  gridSize: number = 50;

  movableOption: MovableOption = {};
  rotableOption: RotableOption = {};

  constructor(
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.movableOption = {
      tabletopObject: this.gameCharacter,
      colideLayers: ['terrain']
    };
    this.rotableOption = {
      tabletopObject: this.gameCharacter
    };
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    EventSystem.unregister(this);
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

    // TODO:もっと良い方法考える
    if (e.button === 2) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', {});
      return;
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;

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
