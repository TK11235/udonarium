import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, HostListener, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { EventSystem, Network } from '@udonarium/core/system';
import { DiceSymbol } from '@udonarium/dice-symbol';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { MovableOption } from 'directive/movable.directive';
import { RotableOption } from 'directive/rotable.directive';
import { ContextMenuAction, ContextMenuSeparator, ContextMenuService } from 'service/context-menu.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';

@Component({
  selector: 'dice-symbol',
  templateUrl: './dice-symbol.component.html',
  styleUrls: ['./dice-symbol.component.css'],
  animations: [
    trigger('diceRoll', [
      state('active', style({ transform: '' })),
      transition('* => active', [
        animate('800ms ease', keyframes([
          style({ transform: 'scale3d(0.8, 0.8, 0.8) rotateZ(0deg)', offset: 0 }),
          style({ transform: 'scale3d(1.2, 1.2, 1.2) rotateZ(360deg)', offset: 0.5 }),
          style({ transform: 'scale3d(0.75, 0.75, 0.75) rotateZ(520deg)', offset: 0.75 }),
          style({ transform: 'scale3d(1.125, 1.125, 1.125) rotateZ(630deg)', offset: 0.875 }),
          style({ transform: 'scale3d(1.0, 1.0, 1.0) rotateZ(720deg)', offset: 1.0 })
        ]))
      ])
    ]),
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
export class DiceSymbolComponent implements OnInit, OnDestroy {
  @Input() diceSymbol: DiceSymbol = null;
  @Input() is3D: boolean = false;

  get face(): string { return this.diceSymbol.face; }
  set face(face: string) { this.diceSymbol.face = face; }
  get owner(): string { return this.diceSymbol.owner; }
  set owner(owner: string) { this.diceSymbol.owner = owner; }
  get rotate(): number { return this.diceSymbol.rotate; }
  set rotate(rotate: number) { this.diceSymbol.rotate = rotate; }

  get name(): string { return this.diceSymbol.name; }
  set name(name: string) { this.diceSymbol.name = name; }
  get size(): number { return this.adjustMinBounds(this.diceSymbol.size); }

  get faces(): string[] { return this.diceSymbol.faces; }
  get imageFile(): ImageFile {
    let image = this.diceSymbol.imageFile;
    return image ? image : this.emptyImage;
  }

  get isMine(): boolean { return this.diceSymbol.isMine; }
  get hasOwner(): boolean { return this.diceSymbol.hasOwner; }
  get ownerName(): string { return this.diceSymbol.ownerName; }
  get isVisible(): boolean { return this.diceSymbol.isVisible; }

  animeState: string = 'inactive';

  private emptyImage: ImageFile = ImageFile.Empty;
  gridSize: number = 50;

  movableOption: MovableOption = {};
  rotableOption: RotableOption = {};

  private doubleClickTimer: NodeJS.Timer = null;
  private doubleClickPoint = { x: 0, y: 0 };

  constructor(
    private ngZone: NgZone,
    private panelService: PanelService,
    private contextMenuService: ContextMenuService,
    private pointerDeviceService: PointerDeviceService) { }

  ngOnInit() {
    EventSystem.register(this)
      .on('ROLL_DICE_SYNBOL', -1000, event => {
        if (event.data.identifier === this.diceSymbol.identifier) {
          this.ngZone.run(() => {
            this.animeState = 'inactive';
            setTimeout(() => { this.animeState = 'active'; });
          });
        }
      });
    this.movableOption = {
      tabletopObject: this.diceSymbol,
      transformCssOffset: 'translateZ(0.15px)',
      colideLayers: ['terrain']
    };
    this.rotableOption = {
      tabletopObject: this.diceSymbol
    };
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  animationShuffleDone(event: any) {
    this.animeState = 'inactive';
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: any) {
    this.onDoubleClick(e);
    e.preventDefault();
  }

  onDoubleClick(e) {
    if (!this.doubleClickTimer) {
      this.doubleClickTimer = setTimeout(() => {
        clearTimeout(this.doubleClickTimer);
        this.doubleClickTimer = null;
      }, 400);
      this.doubleClickPoint = this.pointerDeviceService.pointers[0];
      return;
    }
    clearTimeout(this.doubleClickTimer);
    this.doubleClickTimer = null;
    if (this.doubleClickPoint.x === this.pointerDeviceService.pointers[0].x
      && this.doubleClickPoint.y === this.pointerDeviceService.pointers[0].y) {
      if (this.isVisible) this.diceRoll();
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;
    let position = this.pointerDeviceService.pointers[0];

    let actions: ContextMenuAction[] = [];

    if (this.isVisible) {
      actions.push({
        name: 'ダイスを振る', action: () => {
          this.diceRoll();
        }
      });
    }
    actions.push(ContextMenuSeparator);
    if (this.isMine || this.hasOwner) {
      actions.push({
        name: 'ダイスを公開', action: () => {
          this.owner = '';
          SoundEffect.play(PresetSound.unlock);
        }
      });
    }
    if (!this.isMine) {
      actions.push({
        name: '自分だけ見る', action: () => {
          this.owner = Network.peerId;
          SoundEffect.play(PresetSound.lock);
        }
      });
    }

    if (this.isVisible) {
      let subActions: ContextMenuAction[] = [];
      this.faces.forEach(face => {
        subActions.push({
          name: `${face}`, action: () => {
            this.face = face;
            SoundEffect.play(PresetSound.dicePut);
          }
        });
      });
      actions.push({ name: `ダイス目を設定`, action: null, subActions: subActions });
    }

    actions.push(ContextMenuSeparator);

    actions.push({ name: '詳細を表示', action: () => { this.showDetail(this.diceSymbol); } });
    actions.push({
      name: 'コピーを作る', action: () => {
        let cloneObject = this.diceSymbol.clone();
        cloneObject.location.x += this.gridSize;
        cloneObject.location.y += this.gridSize;
        cloneObject.update();
        SoundEffect.play(PresetSound.dicePut);
      }
    });
    actions.push({
      name: '削除する', action: () => {
        this.diceSymbol.destroy();
        SoundEffect.play(PresetSound.sweep);
      }
    });
    this.contextMenuService.open(position, actions, this.name);
  }

  onMove() {
    SoundEffect.play(PresetSound.dicePick);
  }

  onMoved() {
    SoundEffect.play(PresetSound.dicePut);
  }

  diceRoll(): string {
    EventSystem.call('ROLL_DICE_SYNBOL', { identifier: this.diceSymbol.identifier });
    SoundEffect.play(PresetSound.diceRoll1);
    return this.diceSymbol.diceRoll();
  }

  showDetail(gameObject: DiceSymbol) {
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = 'ダイスシンボル設定';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 300, top: coordinate.y - 300, width: 600, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }
}
