import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, Input } from '@angular/core';

import { GameObject } from '@udonarium/core/synchronize-object/game-object';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system';
import { PeerCursor } from '@udonarium/peer-cursor';
import { DataElement } from '@udonarium/data-element';
import { SortOrder } from '@udonarium/data-summary-setting';
import { GameCharacter } from '@udonarium/game-character';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { TabletopObject } from '@udonarium/tabletop-object';


import { ChatPaletteComponent } from 'component/chat-palette/chat-palette.component';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { ContextMenuAction, ContextMenuService, ContextMenuSeparator } from 'service/context-menu.service';
import { GameObjectInventoryService } from 'service/game-object-inventory.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { DiceBot } from '@udonarium/dice-bot';

@Component({
  selector: 'game-object-inventory',
  templateUrl: './game-object-inventory.component.html',
  styleUrls: ['./game-object-inventory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameObjectInventoryComponent implements OnInit, AfterViewInit, OnDestroy {
  inventoryTypes: string[] = ['table', 'common', 'graveyard'];
  //GM
  @Input() gameCharacter: GameCharacter = null;
  @Input() tabletopObject: TabletopObject = null;
  selectTab: string = 'table';
  selectedIdentifier: string = '';

  isEdit: boolean = false;

  get sortTag(): string { return this.inventoryService.sortTag; }
  set sortTag(sortTag: string) { this.inventoryService.sortTag = sortTag; }
  get sortOrder(): SortOrder { return this.inventoryService.sortOrder; }
  set sortOrder(sortOrder: SortOrder) { this.inventoryService.sortOrder = sortOrder; }
  get dataTag(): string { return this.inventoryService.dataTag; }
  set dataTag(dataTag: string) { this.inventoryService.dataTag = dataTag; }
  get dataTags(): string[] { return this.inventoryService.dataTags; }
  get diceBotInfos() { return DiceBot.diceBotInfos }
  get gameType(): string { return this.inventoryService.gameType; }
  set gameType(gameType: string) { this.inventoryService.gameType = gameType; }
  //GM
  get GM(): string { return this.gameCharacter.GM; }
  set GM(GM: string) { this.gameCharacter.GM = GM; }
  get isMine(): boolean { return this.gameCharacter.isMine; }
  get hasGM(): boolean { return this.gameCharacter.hasGM; }
  get GMName(): string { return this.gameCharacter.GMName; }
  isDisabled(gameObject) {

    return gameObject.GM && !(PeerCursor.myCursor.name === gameObject.GM);
  }


  get sortOrderName(): string { return this.sortOrder === SortOrder.ASC ? '升序' : '降序'; }

  get newLineString(): string { return this.inventoryService.newLineString; }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService,
    private inventoryService: GameObjectInventoryService,
    private contextMenuService: ContextMenuService,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.panelService.title = '倉庫';
    EventSystem.register(this)
      .on('SELECT_TABLETOP_OBJECT', -1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if ((ObjectStore.instance.get(event.data.identifier) instanceof TabletopObject) || (object instanceof PeerCursor && PeerCursor.myCursor.name === this.gameCharacter.GM)) {
          this.selectedIdentifier = event.data.identifier;
          //  console.log(event.data.identifier)
          this.changeDetector.markForCheck();
        }
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        if (event.isSendFromSelf) this.changeDetector.markForCheck();
      })
      .on('UPDATE_INVENTORY', event => {
        if (event.isSendFromSelf) this.changeDetector.markForCheck();
      })
      .on('OPEN_NETWORK', event => {
        this.inventoryTypes = ['table', 'common', Network.peerId, 'graveyard'];
        if (!this.inventoryTypes.includes(this.selectTab)) {
          this.selectTab = Network.peerId;
        }
      }).on('DISCONNECT_PEER', event => {
        //GM
        if (this.gameCharacter.GM === PeerCursor.myCursor.name) this.changeDetector.markForCheck();
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
        return '桌面';
      case Network.peerId:
        return '個人倉庫';
      case 'graveyard':
        return '墓場';
      default:
        return '共有倉庫';
    }
  }

  getInventory(inventoryType: string) {
    switch (inventoryType) {
      case 'table':
        return this.inventoryService.tableInventory;
      case Network.peerId:
        return this.inventoryService.privateInventory;
      case 'graveyard':
        return this.inventoryService.graveyardInventory;
      default:
        return this.inventoryService.commonInventory;
    }
  }

  getGameObjects(inventoryType: string): TabletopObject[] {
    return this.getInventory(inventoryType).tabletopObjects;
  }

  getInventoryTags(gameObject: GameCharacter): DataElement[] {
    return this.getInventory(gameObject.location.name).dataElementMap.get(gameObject.identifier);
  }

  onContextMenu(e: Event, gameObject: GameCharacter) {
    if (document.activeElement instanceof HTMLInputElement && document.activeElement.getAttribute('type') !== 'range') return;
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;

    this.selectGameObject(gameObject);

    let position = this.pointerDeviceService.pointers[0];

    let actions: ContextMenuAction[] = [];


    actions.push({ name: '顯示詳情', action: () => { this.showDetail(gameObject); } });
    if (gameObject.location.name !== 'graveyard') {
      actions.push({ name: '顯示對話組合版', action: () => { this.showChatPalette(gameObject) } });
    }

    actions.push(ContextMenuSeparator);
    let locations = [
      { name: 'table', alias: '移動到桌面' },
      { name: 'common', alias: '移動到共有倉庫' },
      { name: Network.peerId, alias: '移動到個人倉庫' },
      { name: 'graveyard', alias: '移動到墓場' }
    ];
    for (let location of locations) {
      if (gameObject.location.name === location.name) continue;
      actions.push({
        name: location.alias, action: () => {
          gameObject.setLocation(location.name);
          SoundEffect.play(PresetSound.piecePut);
        }
      });
    }

    if (gameObject.location.name === 'graveyard') {
      actions.push({
        name: '刪除', action: () => {
          this.deleteGameObject(gameObject);
          SoundEffect.play(PresetSound.sweep);
        }
      });
    }
    actions.push(ContextMenuSeparator);
    actions.push({
      name: '複製', action: () => {
        this.cloneGameObject(gameObject);
        SoundEffect.play(PresetSound.piecePut);
      }
    });

    this.contextMenuService.open(position, actions, gameObject.name);
  }

  toggleEdit() {
    this.isEdit = !this.isEdit;
  }

  cleanInventory() {
    let tabTitle = this.getTabTitle(this.selectTab);
    let gameObjects = this.getGameObjects(this.selectTab);
    if (!confirm(`${tabTitle}存在的${gameObjects.length}個檔案要永久刪除？`)) return;
    for (const gameObject of gameObjects) {
      this.deleteGameObject(gameObject);
    }
    SoundEffect.play(PresetSound.sweep);
  }

  private cloneGameObject(gameObject: TabletopObject) {
    gameObject.clone();
  }

  public showDetail(gameObject: GameCharacter) {
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = '角色卡';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 800, top: coordinate.y - 300, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private showChatPalette(gameObject: GameCharacter) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 250, top: coordinate.y - 175, width: 630, height: 350 };
    let component = this.panelService.open<ChatPaletteComponent>(ChatPaletteComponent, option);
    component.character = gameObject;
  }

  selectGameObject(gameObject: GameObject) {
    let aliasName: string = gameObject.aliasName;
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
  }
  movetotable(gameObject: GameCharacter) {
    //console.log(gameObject)
    gameObject.setLocation('table');
    SoundEffect.play(PresetSound.lock);
  }
  movetocommon(gameObject: GameCharacter) {
    gameObject.setLocation('common');
    SoundEffect.play(PresetSound.lock);
  }
  movetoid(gameObject: GameCharacter) {
    gameObject.setLocation(Network.peerId);
    SoundEffect.play(PresetSound.lock);
  }
  movetograveyard(gameObject: GameCharacter) {
    gameObject.setLocation('graveyard');
    SoundEffect.play(PresetSound.lock);
  }
  changePosZ(Z: number, gameObject: GameCharacter) {
    if (Z < 0)
      Z = 0
    if (Z > 500)
      Z = 500
    gameObject.posZ = Z;
    SoundEffect.play(PresetSound.lock);
  }
  PosZplus100(gameObject: GameCharacter) {
    gameObject.posZ = Number(gameObject.posZ) + Number(100);
    SoundEffect.play(PresetSound.lock);
  }
  PosZ0(gameObject: GameCharacter) {
    gameObject.posZ = 0;
    SoundEffect.play(PresetSound.lock);
  }

  private deleteGameObject(gameObject: GameObject) {
    gameObject.destroy();
    this.changeDetector.markForCheck();
  }

  trackByGameObject(index: number, gameObject: GameObject) {
    return gameObject ? gameObject.identifier : index;
  }

  onChangeGameType(gameType: string) {
    console.log('onChangeGameType ready');
    DiceBot.getHelpMessage(this.gameType).then(help => {
      console.log('onChangeGameType done\n' + help + this.gameType);
    });
  }
}

