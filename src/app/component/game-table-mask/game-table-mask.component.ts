import { AfterViewInit, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';

import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { EventSystem } from '@udonarium/core/system/system';
import { GameTableMask } from '@udonarium/game-table-mask';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';

import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { MovableOption } from 'directive/movable.directive';
import { ContextMenuService } from 'service/context-menu.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';

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

  gridSize: number = 50;

  movableOption: MovableOption = {};

  constructor(
    private contextMenuService: ContextMenuService,
    private panelService: PanelService,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.movableOption = {
      tabletopObject: this.gameTableMask,
      transformCssOffset: 'translateZ(0.15px)',
      colideLayers: ['terrain']
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
  onMouseDown(e: any) {
    console.log('GameCharacterComponent mousedown !!!');
    e.preventDefault();

    // TODO:もっと良い方法考える
    if (this.isLock) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', {});
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
      (this.isLock
        ? {
          name: '固定解除', action: () => {
            this.isLock = false;
            SoundEffect.play(PresetSound.switch);
          }
        }
        : {
          name: '固定する', action: () => {
            this.isLock = true;
            SoundEffect.play(PresetSound.switch);
          }
        }
      ),
      { name: 'マップマスクを編集', action: () => { this.showDetail(this.gameTableMask); } },
      {
        name: 'コピーを作る', action: () => {
          let cloneObject = this.gameTableMask.clone();
          console.log('コピー', cloneObject);
          cloneObject.location.x += this.gridSize;
          cloneObject.location.y += this.gridSize;
          cloneObject.isLock = false;
          if (this.gameTableMask.parent) this.gameTableMask.parent.appendChild(cloneObject);
          SoundEffect.play(PresetSound.put);
        }
      },
      {
        name: '削除する', action: () => {
          this.gameTableMask.destroy();
          SoundEffect.play(PresetSound.delete);
        }
      },
    ], this.name);
  }

  onMove() {
    SoundEffect.play(PresetSound.pick);
  }

  onMoved() {
    SoundEffect.play(PresetSound.put);
  }

  private adjustMinBounds(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  private showDetail(gameObject: GameTableMask) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = 'マップマスク設定';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 200, top: coordinate.y - 150, width: 400, height: 300 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }
}