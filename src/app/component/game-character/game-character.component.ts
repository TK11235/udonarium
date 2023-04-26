import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { EventSystem, Network } from '@udonarium/core/system';
import { GameCharacter } from '@udonarium/game-character';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { ChatPaletteComponent } from 'component/chat-palette/chat-palette.component';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { MovableOption } from 'directive/movable.directive';
import { RotableOption } from 'directive/rotable.directive';
import { ContextMenuAction, ContextMenuSeparator, ContextMenuService } from 'service/context-menu.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { SelectionState, TabletopSelectionService } from 'service/tabletop-selection.service';

@Component({
  selector: 'game-character',
  templateUrl: './game-character.component.html',
  styleUrls: ['./game-character.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
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
export class GameCharacterComponent implements OnChanges, OnDestroy {
  @Input() gameCharacter: GameCharacter = null;
  @Input() is3D: boolean = false;

  get name(): string { return this.gameCharacter.name; }
  get size(): number { return this.adjustMinBounds(this.gameCharacter.size); }
  get imageFile(): ImageFile { return this.gameCharacter.imageFile; }
  get rotate(): number { return this.gameCharacter.rotate; }
  set rotate(rotate: number) { this.gameCharacter.rotate = rotate; }
  get roll(): number { return this.gameCharacter.roll; }
  set roll(roll: number) { this.gameCharacter.roll = roll; }

  get selectionState(): SelectionState { return this.selectionService.state(this.gameCharacter); }
  get isSelected(): boolean { return this.selectionState !== SelectionState.NONE; }
  get isMagnetic(): boolean { return this.selectionState === SelectionState.MAGNETIC; }

  gridSize: number = 50;

  movableOption: MovableOption = {};
  rotableOption: RotableOption = {};
  rollOption: RotableOption = {};

  constructor(
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private changeDetector: ChangeDetectorRef,
    private selectionService: TabletopSelectionService,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnChanges(): void {
    EventSystem.unregister(this);
    EventSystem.register(this)
      .on(`UPDATE_GAME_OBJECT/identifier/${this.gameCharacter?.identifier}`, event => {
        this.changeDetector.markForCheck();
      })
      .on(`UPDATE_OBJECT_CHILDREN/identifier/${this.gameCharacter?.identifier}`, event => {
        this.changeDetector.markForCheck();
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        this.changeDetector.markForCheck();
      })
      .on('UPDATE_FILE_RESOURE', event => {
        this.changeDetector.markForCheck();
      })
      .on(`UPDATE_SELECTION/identifier/${this.gameCharacter?.identifier}`, event => {
        this.changeDetector.markForCheck();
      });
    this.movableOption = {
      tabletopObject: this.gameCharacter,
      transformCssOffset: 'translateZ(1.0px)',
      colideLayers: ['terrain']
    };
    this.rotableOption = {
      tabletopObject: this.gameCharacter
    };
    this.rollOption = {
      tabletopObject: this.gameCharacter,
      targetPropertyName: 'roll',
    };
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  @HostListener('dragstart', ['$event'])
  onDragstart(e: any) {
    console.log('Dragstart Cancel !!!!');
    e.stopPropagation();
    e.preventDefault();
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;

    let position = this.pointerDeviceService.pointers[0];

    let menuActions: ContextMenuAction[] = [];
    menuActions = menuActions.concat(this.makeSelectionContextMenu());
    menuActions = menuActions.concat(this.makeContextMenu());
    this.contextMenuService.open(position, menuActions, this.name);
  }

  onMove() {
    this.contextMenuService.close();
    SoundEffect.play(PresetSound.piecePick);
  }

  onMoved() {
    SoundEffect.play(PresetSound.piecePut);
  }

  private makeSelectionContextMenu(): ContextMenuAction[] {
    let actions: ContextMenuAction[] = [];

    if (this.selectionService.objects.length) {
      let objectPosition = {
        x: this.gameCharacter.location.x + (this.gameCharacter.size * this.gridSize) / 2,
        y: this.gameCharacter.location.y + (this.gameCharacter.size * this.gridSize) / 2,
        z: this.gameCharacter.posZ
      };
      actions.push({ name: 'ここに集める', action: () => this.selectionService.congregate(objectPosition) });
    }

    if (this.isSelected) {
      let selectedCharacter = () => this.selectionService.objects.filter(object => object.aliasName === this.gameCharacter.aliasName) as GameCharacter[];
      actions.push(
        {
          name: '選択したキャラクター', action: null, subActions: [
            {
              name: 'すべて共有イベントリに移動', action: () => {
                selectedCharacter().forEach(gameCharacter => {
                  gameCharacter.setLocation('common')
                  this.selectionService.remove(gameCharacter);
                });
                SoundEffect.play(PresetSound.piecePut);
              }
            },
            {
              name: 'すべて個人イベントリに移動', action: () => {
                selectedCharacter().forEach(gameCharacter => {
                  gameCharacter.setLocation(Network.peerId);
                  this.selectionService.remove(gameCharacter);
                });
                SoundEffect.play(PresetSound.piecePut);
              }
            },
            {
              name: 'すべて墓場に移動', action: () => {
                selectedCharacter().forEach(gameCharacter => {
                  gameCharacter.setLocation('graveyard');
                  this.selectionService.remove(gameCharacter);
                });
                SoundEffect.play(PresetSound.sweep);
              }
            },
          ]
        }
      );
    }
    if (this.selectionService.objects.length) {
      actions.push(ContextMenuSeparator);
    }
    return actions;
  }

  private makeContextMenu(): ContextMenuAction[] {
    let actions: ContextMenuAction[] = [];

    actions.push({ name: '詳細を表示', action: () => { this.showDetail(this.gameCharacter); } });
    actions.push({ name: 'チャットパレットを表示', action: () => { this.showChatPalette(this.gameCharacter) } });
    actions.push(ContextMenuSeparator);
    actions.push({
      name: '共有イベントリに移動', action: () => {
        this.gameCharacter.setLocation('common');
        SoundEffect.play(PresetSound.piecePut);
      }
    });
    actions.push({
      name: '個人イベントリに移動', action: () => {
        this.gameCharacter.setLocation(Network.peerId);
        SoundEffect.play(PresetSound.piecePut);
      }
    });
    actions.push({
      name: '墓場に移動', action: () => {
        this.gameCharacter.setLocation('graveyard');
        SoundEffect.play(PresetSound.sweep);
      }
    });
    actions.push(ContextMenuSeparator);
    actions.push({
      name: 'コピーを作る', action: () => {
        let cloneObject = this.gameCharacter.clone();
        cloneObject.location.x += this.gridSize;
        cloneObject.location.y += this.gridSize;
        cloneObject.update();
        SoundEffect.play(PresetSound.piecePut);
      }
    });
    return actions;
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  private showDetail(gameObject: GameCharacter) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = 'キャラクターシート';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 400, top: coordinate.y - 300, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private showChatPalette(gameObject: GameCharacter) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 250, top: coordinate.y - 175, width: 615, height: 350 };
    let component = this.panelService.open<ChatPaletteComponent>(ChatPaletteComponent, option);
    component.character = gameObject;
  }
}
