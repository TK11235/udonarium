import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ObjectNode } from '@udonarium/core/synchronize-object/object-node';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { Terrain, TerrainViewState } from '@udonarium/terrain';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { InputHandler } from 'directive/input-handler';
import { MovableOption } from 'directive/movable.directive';
import { RotableOption } from 'directive/rotable.directive';
import { ContextMenuSeparator, ContextMenuService } from 'service/context-menu.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { TabletopService } from 'service/tabletop.service';
import { PeerCursor } from '@udonarium/peer-cursor';
import {  Network } from '@udonarium/core/system';


@Component({
  selector: 'terrain',
  templateUrl: './terrain.component.html',
  styleUrls: ['./terrain.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TerrainComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() terrain: Terrain = null;
  @Input() is3D: boolean = false;

  //GM
  get GM(): string { return this.terrain.GM; }
  set GM(GM: string) { this.terrain.GM = GM; }
  get isMine(): boolean { return this.terrain.isMine; }
  get hasGM(): boolean { return this.terrain.hasGM; }
  get GMName(): string { return this.terrain.GMName; }
  get isDisabled(): boolean { return this.terrain.isDisabled; }

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

  private input: InputHandler = null;

  constructor(
    private tabletopService: TabletopService,
    private contextMenuService: ContextMenuService,
    private elementRef: ElementRef<HTMLElement>,
    private panelService: PanelService,
    private changeDetector: ChangeDetectorRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if (!this.terrain || !object) return;
        if (this.terrain === object || (object instanceof ObjectNode && this.terrain.contains(object))|| (object instanceof PeerCursor && object.peerId === this.terrain.GM)) {
          this.changeDetector.markForCheck();
        }
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        this.changeDetector.markForCheck();
      })
      .on('UPDATE_FILE_RESOURE', -1000, event => {
        this.changeDetector.markForCheck();
      }).on('DISCONNECT_PEER', event => {
        //GM
        if (this.terrain.GM === event.data.peer) this.changeDetector.markForCheck();
      });
    this.movableOption = {
      tabletopObject: this.terrain,
      colideLayers: ['terrain']
    };
    this.rotableOption = {
      tabletopObject: this.terrain
    };
  }

  ngAfterViewInit() {
    this.input = new InputHandler(this.elementRef.nativeElement);
    this.input.onStart = this.onInputStart.bind(this);
  }

  ngOnDestroy() {
    this.input.destroy();
    EventSystem.unregister(this);
  }

  @HostListener('dragstart', ['$event'])
  onDragstart(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  onInputStart(e: any) {
    this.input.cancel();

    // TODO:もっと良い方法考える
    if (this.isLocked) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', {});
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;

    let menuPosition = this.pointerDeviceService.pointers[0];
    let objectPosition = this.tabletopService.calcTabletopLocalCoordinate();
    this.contextMenuService.open(menuPosition, [
      (this.isLocked
        ? {
          name: '固定解除', action: () => {
            this.isLocked = false;
            SoundEffect.play(PresetSound.unlock);
          }
        } : {
          name: '固定', action: () => {
            this.isLocked = true;
            SoundEffect.play(PresetSound.lock);
          }
        }),
      ContextMenuSeparator,
      (!this.isMine
        ? {
          name: 'GM圖層-只供自己看見', action: () => {
            this.GM = PeerCursor.myCursor.name;
            SoundEffect.play(PresetSound.lock);
          }
        } : {
          name: '回到普通圖層', action: () => {
            this.GM = '';
            SoundEffect.play(PresetSound.unlock);
          }
        }),
      ContextMenuSeparator,
      (this.hasWall
        ? {
          name: '隱藏牆壁', action: () => {
            this.mode = TerrainViewState.FLOOR;
            if (this.depth * this.width === 0) {
              this.terrain.width = this.width <= 0 ? 1 : this.width;
              this.terrain.depth = this.depth <= 0 ? 1 : this.depth;
            }
          }
        } : {
          name: '顯示牆壁', action: () => {
            this.mode = TerrainViewState.ALL;
          }
        }),
      ContextMenuSeparator,
      { name: '編輯地形設定', action: () => { this.showDetail(this.terrain); } },
      {
        name: '複製', action: () => {
          let cloneObject = this.terrain.clone();
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.isLocked = false;
          if (this.terrain.parent) this.terrain.parent.appendChild(cloneObject);
          SoundEffect.play(PresetSound.blockPut);
        }
      },
      {
        name: '刪除', action: () => {
          this.terrain.destroy();
          SoundEffect.play(PresetSound.sweep);
        }
      },
      ContextMenuSeparator,
      { name: '新增物件', action: null, subActions: this.tabletopService.getContextMenuActionsForCreateObject(objectPosition) }
    ], this.name);
  }

  onMove() {
    SoundEffect.play(PresetSound.blockPick);
  }

  onMoved() {
    SoundEffect.play(PresetSound.blockPut);
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  public showDetail(gameObject: Terrain) {
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = '設定地形';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 250, top: coordinate.y - 150, width: 500, height: 300 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }
}
