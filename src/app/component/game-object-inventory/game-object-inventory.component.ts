import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { GameObject } from '@udonarium/core/synchronize-object/game-object';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system/system';
import { DataElement } from '@udonarium/data-element';
import { DataSummarySetting, SortOrder } from '@udonarium/data-summary-setting';
import { GameCharacter } from '@udonarium/game-character';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { TabletopObject } from '@udonarium/tabletop-object';

import { ChatPaletteComponent } from 'component/chat-palette/chat-palette.component';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { ContextMenuAction, ContextMenuService } from 'service/context-menu.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';

@Component({
  selector: 'game-object-inventory',
  templateUrl: './game-object-inventory.component.html',
  styleUrls: ['./game-object-inventory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameObjectInventoryComponent implements OnInit, AfterViewInit, OnDestroy {
  inventoryTypes: string[] = ['table', 'common', 'graveyard'];

  selectTab: string = 'table';
  selectedIdentifier: string = '';

  isEdit: boolean = false;

  newLineString: string = '/';
  private newLineDataElement: DataElement = DataElement.create(this.newLineString);

  private get summarySetting(): DataSummarySetting { return DataSummarySetting.instance; }

  get sortTag(): string { return this.summarySetting.sortTag; }
  set sortTag(sortTag: string) { this.summarySetting.sortTag = sortTag; }
  get sortOrder(): SortOrder { return this.summarySetting.sortOrder; }
  set sortOrder(sortOrder: SortOrder) { this.summarySetting.sortOrder = sortOrder; }
  get dataTag(): string { return this.summarySetting.dataTag; }
  set dataTag(dataTag: string) { this.summarySetting.dataTag = dataTag; }
  get dataTags(): string[] { return this.summarySetting.dataTags; }

  get sortOrderName(): string { return this.sortOrder === SortOrder.ASC ? '昇順' : '降順'; }

  private lazyMarkTimer: NodeJS.Timer = null;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService,
    private contextMenuService: ContextMenuService,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.panelService.title = 'インベントリ';
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if (object instanceof TabletopObject || object instanceof DataElement || object instanceof DataSummarySetting) this.lazyMarkForCheck();
      })
      .on('DELETE_GAME_OBJECT', 1000, event => {
        this.changeDetector.markForCheck();
      })
      .on('SELECT_TABLETOP_OBJECT', -1000, event => {
        if (ObjectStore.instance.get(event.data.identifier) instanceof TabletopObject) {
          this.selectedIdentifier = event.data.identifier;
          this.changeDetector.markForCheck();
        }
      });
    this.inventoryTypes = ['table', 'common', Network.peerId, 'graveyard'];
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  getTabTitle(inventoryType: string) {
    switch (inventoryType) {
      case 'table':
        return 'テーブル';
      case Network.peerId:
        return '個人';
      case 'graveyard':
        return '墓場';
      default:
        return '共有';
    }
  }

  getGameObjects(inventoryType: string) {
    let identifiersArray: TabletopObject[][] = [];
    identifiersArray[0] = ObjectStore.instance.getObjects(GameCharacter);
    let gameObjects: TabletopObject[] = [];

    for (let identifiers of identifiersArray) {
      for (let identifier of identifiers) {
        switch (identifier.location.name) {
          case 'table':
            if (inventoryType === 'table') {
              gameObjects.push(identifier);
            }
            break;
          case Network.peerId:
            if (inventoryType === Network.peerId) {
              gameObjects.push(identifier);
            }
            break;
          case 'graveyard':
            if (inventoryType === 'graveyard') {
              gameObjects.push(identifier);
            }
            break;
          default:
            if (inventoryType === 'common' && !this.isPrivateLocation(identifier.location.name)) {
              gameObjects.push(identifier);
            }
            break;
        }
      }
    }

    let sortTag = this.sortTag.length ? this.sortTag.trim() : '';
    let sortOrder = this.sortOrder === 'ASC' ? -1 : 1;
    if (sortTag.length) {
      gameObjects = gameObjects.sort((a, b) => {
        let aElm = a.rootDataElement.getFirstElementByName(sortTag);
        let bElm = b.rootDataElement.getFirstElementByName(sortTag);
        if (!aElm && !bElm) return 0;
        if (!bElm) return -1;
        if (!aElm) return 1;

        let aValue = this.convertToSortableValue(aElm);
        let bValue = this.convertToSortableValue(bElm);
        if (aValue < bValue) return sortOrder;
        if (aValue > bValue) return sortOrder * -1;
        return 0;
      });
    }

    return gameObjects;
  }

  private convertToSortableValue(dataElement: DataElement): number | string {
    let value = dataElement.isNumberResource ? dataElement.currentValue : dataElement.value;
    let resultStr: string = (value + '').trim().replace(/[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    let resultNum = +resultStr;
    return Number.isNaN(resultNum) ? resultStr : resultNum;
  }

  getInventoryTags(data: DataElement): DataElement[] {
    return this.dataTags.map(tag => tag === this.newLineString ? this.newLineDataElement : data.getFirstElementByName(tag));
  }

  onContextMenu(e: Event, gameObject: GameCharacter) {
    if (document.activeElement instanceof HTMLInputElement && document.activeElement.getAttribute('type') !== 'range') return;
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;

    this.selectGameObject(gameObject);

    let potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);

    let actions: ContextMenuAction[] = [];

    actions.push({ name: '詳細を表示', action: () => { this.showDetail(gameObject); } });
    actions.push({ name: 'チャットパレットを表示', action: () => { this.showChatPalette(gameObject) } });
    actions.push({
      name: 'コピーを作る', action: () => {
        this.cloneGameObject(gameObject);
        SoundEffect.play(PresetSound.put);
      }
    });
    let locations = [
      { name: 'table', alias: 'テーブルに移動' },
      { name: 'common', alias: '共有イベントリに移動' },
      { name: Network.peerId, alias: '個人イベントリに移動' },
      { name: 'graveyard', alias: '墓場に移動' }
    ];

    for (let location of locations) {
      if (gameObject.location.name === location.name) continue;
      actions.push({
        name: location.alias, action: () => {
          gameObject.setLocation(location.name);
          SoundEffect.play(PresetSound.put);
        }
      });
    }

    if (gameObject.location.name === 'graveyard') {
      actions.push({
        name: '削除する', action: () => {
          this.deleteGameObject(gameObject);
          SoundEffect.play(PresetSound.delete);
        }
      });
    }

    this.contextMenuService.open(potison, actions, gameObject.name);
  }

  toggleEdit() {
    this.isEdit = !this.isEdit;
  }

  private cloneGameObject(gameObject: TabletopObject) {
    gameObject.clone();
  }

  private showDetail(gameObject: GameCharacter) {
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = 'キャラクターシート';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 800, top: coordinate.y - 300, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private showChatPalette(gameObject: GameCharacter) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 250, top: coordinate.y - 175, width: 500, height: 350 };
    let component = this.panelService.open<ChatPaletteComponent>(ChatPaletteComponent, option);
    component.character = gameObject;
  }

  private selectGameObject(gameObject: GameObject) {
    let aliasName: string = gameObject.aliasName;
    console.log('onSelectedGameObject <' + aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
  }

  private deleteGameObject(gameObject: GameObject) {
    gameObject.destroy();
    this.changeDetector.markForCheck();
  }

  private isPrivateLocation(location: string): boolean {
    for (let conn of Network.peerContexts) {
      if (conn.isOpen && location === conn.fullstring) {
        return true;
      }
    }
    return false;
  }

  private lazyMarkForCheck() {
    if (this.lazyMarkTimer !== null) return;
    this.lazyMarkTimer = setTimeout(() => {
      this.lazyMarkTimer = null;
      this.changeDetector.markForCheck();
    }, 16);
  }

  trackByGameObject(index: number, gameObject: GameObject) {
    return gameObject ? gameObject.identifier : index;
  }
}
