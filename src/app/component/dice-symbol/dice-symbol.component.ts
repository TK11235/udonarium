import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system';
import { DiceSymbol } from '@udonarium/dice-symbol';
import { PeerCursor } from '@udonarium/peer-cursor';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { ObjectInteractGesture } from 'component/game-table/object-interact-gesture';
import { MovableOption } from 'directive/movable.directive';
import { RotableOption } from 'directive/rotable.directive';
import { ContextMenuAction, ContextMenuSeparator, ContextMenuService } from 'service/context-menu.service';
import { ImageService } from 'service/image.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { SelectionState, TabletopSelectionService } from 'service/tabletop-selection.service';

@Component({
  selector: 'dice-symbol',
  templateUrl: './dice-symbol.component.html',
  styleUrls: ['./dice-symbol.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('diceRoll', [
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
export class DiceSymbolComponent implements OnChanges, AfterViewInit, OnDestroy {
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
    return this.imageService.getEmptyOr(this.diceSymbol.imageFile);
  }

  get isMine(): boolean { return this.diceSymbol.isMine; }
  get hasOwner(): boolean { return this.diceSymbol.hasOwner; }
  get ownerName(): string { return this.diceSymbol.ownerName; }
  get isVisible(): boolean { return this.diceSymbol.isVisible; }

  get selectionState(): SelectionState { return this.selectionService.state(this.diceSymbol); }
  get isSelected(): boolean { return this.selectionState !== SelectionState.NONE; }
  get isMagnetic(): boolean { return this.selectionState === SelectionState.MAGNETIC; }

  animeState: string = 'inactive';

  private iconHiddenTimer: NodeJS.Timer = null;
  get isIconHidden(): boolean { return this.iconHiddenTimer != null };

  gridSize: number = 50;

  movableOption: MovableOption = {};
  rotableOption: RotableOption = {};

  private interactGesture: ObjectInteractGesture = null;

  constructor(
    private ngZone: NgZone,
    private panelService: PanelService,
    private contextMenuService: ContextMenuService,
    private elementRef: ElementRef<HTMLElement>,
    private changeDetector: ChangeDetectorRef,
    private selectionService: TabletopSelectionService,
    private imageService: ImageService,
    private pointerDeviceService: PointerDeviceService) { }

  ngOnChanges(): void {
    EventSystem.register(this)
      .on('ROLL_DICE_SYMBOL', event => {
        if (event.data.identifier === this.diceSymbol.identifier) {
          this.ngZone.run(() => {
            this.animeState = 'inactive';
            this.changeDetector.markForCheck();
            setTimeout(() => { this.animeState = 'active'; this.changeDetector.markForCheck(); });
          });
        }
      })
      .on(`UPDATE_GAME_OBJECT/aliasName/${PeerCursor.aliasName}`, event => {
        let object = ObjectStore.instance.get<PeerCursor>(event.data.identifier);
        if (this.diceSymbol && object && object.userId === this.diceSymbol.owner) {
          this.changeDetector.markForCheck();
        }
      })
      .on(`UPDATE_GAME_OBJECT/identifier/${this.diceSymbol?.identifier}`, event => {
        this.changeDetector.markForCheck();
      })
      .on(`UPDATE_OBJECT_CHILDREN/identifier/${this.diceSymbol?.identifier}`, event => {
        this.changeDetector.markForCheck();
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        this.changeDetector.markForCheck();
      })
      .on('UPDATE_FILE_RESOURE', event => {
        this.changeDetector.markForCheck();
      })
      .on(`UPDATE_SELECTION/identifier/${this.diceSymbol?.identifier}`, event => {
        this.changeDetector.markForCheck();
      })
      .on('DISCONNECT_PEER', event => {
        let cursor = PeerCursor.findByPeerId(event.data.peerId);
        if (!cursor || this.diceSymbol.owner === cursor.userId) this.changeDetector.markForCheck();
      });
    this.movableOption = {
      tabletopObject: this.diceSymbol,
      transformCssOffset: 'translateZ(1.0px)',
      colideLayers: ['terrain']
    };
    this.rotableOption = {
      tabletopObject: this.diceSymbol
    };
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.interactGesture = new ObjectInteractGesture(this.elementRef.nativeElement);
    });

    this.interactGesture.onstart = this.onInputStart.bind(this);
    this.interactGesture.oninteract = this.onDoubleClick.bind(this);
  }

  ngOnDestroy() {
    this.interactGesture.destroy();
    EventSystem.unregister(this);
  }

  @HostListener('dragstart', ['$event'])
  onDragstart(e: any) {
    e.stopPropagation();
    e.preventDefault();
  }

  animationShuffleDone(event: any) {
    this.animeState = 'inactive';
    this.changeDetector.markForCheck();
  }

  onInputStart(e: MouseEvent | TouchEvent) {
    this.ngZone.run(() => this.startIconHiddenTimer());
  }

  onDoubleClick() {
    if (!this.isVisible) return;
    this.ngZone.run(() => this.diceRoll());
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;
    let position = this.pointerDeviceService.pointers[0];

    let actions: ContextMenuAction[] = [];

    actions = actions.concat(this.makeSelectionContextMenu());
    actions = actions.concat(this.makeContextMenu());

    this.contextMenuService.open(position, actions, this.name);
  }

  private makeSelectionContextMenu(): ContextMenuAction[] {
    if (this.selectionService.objects.length < 1) return [];

    let actions: ContextMenuAction[] = [];

    let objectPosition = {
      x: this.diceSymbol.location.x + (this.diceSymbol.size * this.gridSize) / 2,
      y: this.diceSymbol.location.y + (this.diceSymbol.size * this.gridSize) / 2,
      z: this.diceSymbol.posZ
    };
    actions.push({ name: 'ここに集める', action: () => this.selectionService.congregate(objectPosition) });

    if (this.isSelected) {
      let selectedDiceSymbols = () => this.selectionService.objects.filter(object => object.aliasName === this.diceSymbol.aliasName) as DiceSymbol[];
      actions.push(
        {
          name: '選択したダイス', action: null, subActions: [
            {
              name: 'すべて振る', action: () => {
                let needsSound = false;
                selectedDiceSymbols().forEach(diceSymbol => {
                  if (diceSymbol.isVisible) {
                    needsSound = true;
                    EventSystem.call('ROLL_DICE_SYMBOL', { identifier: diceSymbol.identifier });
                    diceSymbol.diceRoll();
                  }
                });
                if (needsSound) SoundEffect.play(PresetSound.diceRoll1);
              }
            },
            {
              name: 'すべて公開', action: () => {
                selectedDiceSymbols().forEach(diceSymbol => diceSymbol.owner = '');
                SoundEffect.play(PresetSound.unlock);
              }
            },
            {
              name: 'すべて自分だけ見る', action: () => {
                selectedDiceSymbols().forEach(diceSymbol => diceSymbol.owner = Network.peer.userId);
                SoundEffect.play(PresetSound.lock);
              }
            },
          ]
        }
      );
    }
    actions.push(ContextMenuSeparator);
    return actions;
  }

  private makeContextMenu(): ContextMenuAction[] {
    let actions: ContextMenuAction[] = [];

    if (this.isVisible) {
      actions.push({
        name: 'ダイスを振る', action: () => {
          this.diceRoll();
        }
      });
    }
    if (actions.length) actions.push(ContextMenuSeparator);
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
          this.owner = Network.peer.userId;
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
    return actions;
  }

  onMove() {
    this.contextMenuService.close();
    SoundEffect.play(PresetSound.dicePick);
  }

  onMoved() {
    SoundEffect.play(PresetSound.dicePut);
  }

  diceRoll(): string {
    EventSystem.call('ROLL_DICE_SYMBOL', { identifier: this.diceSymbol.identifier });
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

  private startIconHiddenTimer() {
    clearTimeout(this.iconHiddenTimer);
    this.iconHiddenTimer = setTimeout(() => {
      this.iconHiddenTimer = null;
      this.changeDetector.markForCheck();
    }, 300);
    this.changeDetector.markForCheck();
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }
}
