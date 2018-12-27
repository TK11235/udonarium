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

  private _selectTab: string = 'table';
  get selectTab(): string { return this._selectTab; }
  set selectTab(selectTab: string) { this._selectTab = selectTab; this.isNeedUpdateDataElement = true; }

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

  private _tabletopObjectMap: Map<string, TabletopObject[]> = new Map();
  get tabletopObjectMap(): Map<string, TabletopObject[]> {
    if (this.isNeedUpdateInventory) {
      this.updateTabletopObjectMap();
      this.isNeedUpdateInventory = false;
    }
    if (this.isNeedSortInventory) {
      this.sortTabletopObjectMap();
      this.isNeedSortInventory = false;
    }
    return this._tabletopObjectMap;
  }

  private locationHash: { [identifier: string]: string } = {};

  private _dataElementMap: Map<string, DataElement[]> = new Map();
  get dataElementMap(): Map<string, DataElement[]> {
    if (this.isNeedUpdateDataElement) {
      this._dataElementMap.clear();
      let caches = this.tabletopObjectMap.get(this.selectTab);
      if (caches == null) caches = [];
      for (let object of caches) {
        if (!object.rootDataElement) continue;
        let elements = this.dataTags.map(tag => tag === this.newLineString ? this.newLineDataElement : object.rootDataElement.getFirstElementByName(tag));
        this._dataElementMap.set(object.identifier, elements);
      }
      this.isNeedUpdateDataElement = false;
    }
    return this._dataElementMap;
  }

  private isNeedUpdateInventory: boolean = true;
  private isNeedUpdateDataElement: boolean = true;
  private isNeedSortInventory: boolean = true;

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
        if (!object) return;

        if (object instanceof GameCharacter) {
          let preLocation = this.locationHash[object.identifier];
          if (object.location.name !== preLocation) {
            this.locationHash[object.identifier] = object.location.name;
            this.isNeedUpdateInventory = this.isNeedUpdateDataElement = this.isNeedSortInventory = true;
          }
          this.changeDetector.markForCheck();
        } else if (object instanceof DataElement) {
          if (this.dataTags.includes(object.name)) {
            this.isNeedUpdateDataElement = true;
          }
          if (this.sortTag === object.name) {
            this.isNeedSortInventory = true;
          }
          if (!this.isNeedUpdateDataElement && 0 < object.children.length) {
            this.isNeedUpdateDataElement = true;
          }
          this.changeDetector.markForCheck();
        } else if (object instanceof DataSummarySetting) {
          this.isNeedUpdateDataElement = this.isNeedSortInventory = true;
          this.changeDetector.markForCheck();
        }
      })
      .on('DELETE_GAME_OBJECT', 1000, event => {
        this.isNeedUpdateInventory = this.isNeedUpdateDataElement = this.isNeedSortInventory = true;
        this.changeDetector.markForCheck();
      })
      .on('SELECT_TABLETOP_OBJECT', -1000, event => {
        if (ObjectStore.instance.get(event.data.identifier) instanceof TabletopObject) {
          this.selectedIdentifier = event.data.identifier;
          this.changeDetector.markForCheck();
        }
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        if (event.isSendFromSelf) this.changeDetector.markForCheck();
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
    return this.tabletopObjectMap.get(inventoryType);
  }

  private updateTabletopObjectMap() {
    let allTabletopObjects: TabletopObject[] = ObjectStore.instance.getObjects(GameCharacter);
    this._tabletopObjectMap.clear();
    this.inventoryTypes.forEach(inventoryType => this._tabletopObjectMap.set(inventoryType, []));
    this.locationHash = {};

    for (let object of allTabletopObjects) {
      this.locationHash[object.identifier] = object.location.name;
      let caches: TabletopObject[];
      switch (object.location.name) {
        case 'table':
          caches = this._tabletopObjectMap.get('table');
          caches.push(object);
          this._tabletopObjectMap.set('table', caches);
          break;
        case Network.peerId:
          caches = this._tabletopObjectMap.get(Network.peerId);
          caches.push(object);
          this._tabletopObjectMap.set(Network.peerId, caches);
          break;
        case 'graveyard':
          caches = this._tabletopObjectMap.get('graveyard');
          caches.push(object);
          this._tabletopObjectMap.set('graveyard', caches);
          break;
        default:
          caches = this._tabletopObjectMap.get('common');
          if (!this.isPrivateLocation(object.location.name)) {
            caches.push(object);
            this._tabletopObjectMap.set('common', caches);
          }
          break;
      }
    }
  }

  private sortTabletopObjectMap() {
    let sortTag = this.sortTag.length ? this.sortTag.trim() : '';
    let sortOrder = this.sortOrder === 'ASC' ? -1 : 1;
    if (sortTag.length) {
      this._tabletopObjectMap.forEach(caches => {
        caches.sort((a, b) => {
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
      });
    }
  }

  private convertToSortableValue(dataElement: DataElement): number | string {
    let value = dataElement.isNumberResource ? dataElement.currentValue : dataElement.value;
    let resultStr: string = (value + '').trim().replace(/[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    let resultNum = +resultStr;
    return Number.isNaN(resultNum) ? resultStr : resultNum;
  }

  getInventoryTags(gameObject: GameCharacter): DataElement[] {
    return this.dataElementMap.get(gameObject.identifier);
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

  trackByGameObject(index: number, gameObject: GameObject) {
    return gameObject ? gameObject.identifier : index;
  }
}
