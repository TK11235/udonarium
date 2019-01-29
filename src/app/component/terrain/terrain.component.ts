import { AfterViewInit, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';

import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { EventSystem } from '@udonarium/core/system';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { Terrain, TerrainViewState } from '@udonarium/terrain';

import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { MovableOption } from 'directive/movable.directive';
import { RotableOption } from 'directive/rotable.directive';
import { ContextMenuAction, ContextMenuService } from 'service/context-menu.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerCoordinate, PointerDeviceService } from 'service/pointer-device.service';
import { TabletopService } from 'service/tabletop.service';
import { DiceType } from '@udonarium/dice-symbol';

@Component({
  selector: 'terrain',
  templateUrl: './terrain.component.html',
  styleUrls: ['./terrain.component.css']
})
export class TerrainComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() terrain: Terrain = null;
  @Input() is3D: boolean = false;

  get name(): string { return this.terrain.name; }
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

  gridSize: number = 50;

  movableOption: MovableOption = {};
  rotableOption: RotableOption = {};

  constructor(
    private tabletopService: TabletopService,
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.movableOption = {
      tabletopObject: this.terrain,
      colideLayers: ['terrain']
    };
    this.rotableOption = {
      tabletopObject: this.terrain
    };
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  @HostListener('dragstart', ['$event'])
  onDragstart(e) {
    console.log('Dragstart Cancel !!!!');
    e.stopPropagation();
    e.preventDefault();
  }

  @HostListener('mousedown', ['$event'])
  onDragMouseDown(e: any) {
    console.log('TerrainComponent mousedown !!!');
    e.preventDefault();

    // TODO:もっと良い方法考える
    if (this.isLocked) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', {});
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('Terrein onContextMenu', this.pointerDeviceService.isAllowedToOpenContextMenu);
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;

    let menuPotison = this.pointerDeviceService.pointers[0];
    let objectPotison = this.tabletopService.calcTabletopLocalCoordinate();
    console.log('mouseCursor', menuPotison);
    this.contextMenuService.open(menuPotison, [
      (this.isLocked
        ? {
          name: '固定解除', action: () => {
            this.isLocked = false;
            this.terrain.update();
            SoundEffect.play(PresetSound.switch);
          }
        } : {
          name: '固定する', action: () => {
            this.isLocked = true;
            this.terrain.update();
            SoundEffect.play(PresetSound.switch);
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
          cloneObject.isLocked = false;
          if (this.terrain.parent) this.terrain.parent.appendChild(cloneObject);
          SoundEffect.play(PresetSound.lock);
        }
      },
      {
        name: '削除する', action: () => {
          this.terrain.destroy();
          SoundEffect.play(PresetSound.delete);
        }
      },
      { name: 'オブジェクト作成', action: null, subActions: this.getContextMenuSubActions(objectPotison) }
    ], this.name);
  }

  onMove() {
    SoundEffect.play(PresetSound.lock);
  }

  onMoved() {
    SoundEffect.play(PresetSound.lock);
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  private showDetail(gameObject: Terrain) {
    console.log('onSelectedGameObject <' + gameObject.aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = '地形設定';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 250, top: coordinate.y - 150, width: 500, height: 300 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private getContextMenuSubActions(potison: PointerCoordinate): ContextMenuAction[] {
    return [
      {
        name: 'キャラクターを作成', action: () => {
          let character = this.tabletopService.createGameCharacter(potison);

          EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: character.identifier, className: character.aliasName });
          let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
          let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
          component.tabletopObject = character;

          SoundEffect.play(PresetSound.put);
        }
      },
      {
        name: 'マップマスクを作成', action: () => {
          this.tabletopService.createGameTableMask(potison);
          SoundEffect.play(PresetSound.put);
        }
      },
      {
        name: '地形を作成', action: () => {
          this.tabletopService.createTerrain(potison);
          SoundEffect.play(PresetSound.lock);
        }
      },
      {
        name: '共有メモを作成', action: () => {
          this.tabletopService.createTextNote(potison);
          SoundEffect.play(PresetSound.put);
        }
      },
      {
        name: 'トランプの山札を作成', action: () => {
          this.tabletopService.createTrump(potison);
          SoundEffect.play(PresetSound.cardPut);
        }
      },
      {
        name: 'ダイスを作成', action: null, subActions: [
          {
            name: 'D4', action: () => {
              this.tabletopService.createDiceSymbol(potison, 'D4', DiceType.D4, '4_dice');
              SoundEffect.play(PresetSound.put);
            }
          },
          {
            name: 'D6', action: () => {
              this.tabletopService.createDiceSymbol(potison, 'D6', DiceType.D6, '6_dice');
              SoundEffect.play(PresetSound.put);
            }
          },
          {
            name: 'D8', action: () => {
              this.tabletopService.createDiceSymbol(potison, 'D8', DiceType.D8, '8_dice');
              SoundEffect.play(PresetSound.put);
            }
          },
          {
            name: 'D10', action: () => {
              this.tabletopService.createDiceSymbol(potison, 'D10', DiceType.D10, '10_dice');
              SoundEffect.play(PresetSound.put);
            }
          },
          {
            name: 'D10 (00-90)', action: () => {
              this.tabletopService.createDiceSymbol(potison, 'D10', DiceType.D10_10TIMES, '100_dice');
              SoundEffect.play(PresetSound.put);
            }
          },
          {
            name: 'D12', action: () => {
              this.tabletopService.createDiceSymbol(potison, 'D12', DiceType.D12, '12_dice');
              SoundEffect.play(PresetSound.put);
            }
          },
          {
            name: 'D20', action: () => {
              this.tabletopService.createDiceSymbol(potison, 'D20', DiceType.D20, '20_dice');
              SoundEffect.play(PresetSound.put);
            }
          }
        ]
      }
    ];
  }
}
