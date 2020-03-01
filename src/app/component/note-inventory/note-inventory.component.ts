import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, Input, NgZone, ViewChild, ElementRef } from '@angular/core';

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

import { TextNote } from '@udonarium/text-note';

@Component({
  selector: 'note-inventory',
  templateUrl: './note-inventory.component.html',
  styleUrls: ['./note-inventory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteInventoryComponent implements OnInit, AfterViewInit, OnDestroy {
  inventoryTypes: string[] = ['table', 'common', 'graveyard'];
  //GM
  @Input() gameCharacter: GameCharacter = null;
  @Input() textNote: TextNote = null;
  get title(): string { return this.textNote.title; }
  get text(): string { this.calcFitHeightIfNeeded(); return this.textNote.text; }
  @ViewChild('textArea', { static: true }) textAreaElementRef: ElementRef;
  get textNotes(): TextNote[] { return this.textNoteCache.objects; }

  selectTab: string = 'table';
  selectedIdentifier: string = '';

  isEdit: boolean = false;
  private textNoteCache = new TabletopCache<TextNote>(() => ObjectStore.instance.getObjects(TextNote));
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
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService,
    private inventoryService: GameObjectInventoryService,
    private contextMenuService: ContextMenuService,
    private pointerDeviceService: PointerDeviceService

  ) { }

  ngOnInit() {
    this.panelService.title = '筆記倉庫';
    EventSystem.register(this)
      .on('SELECT_TABLETOP_OBJECT', -1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if ((ObjectStore.instance.get(event.data.identifier) instanceof TabletopObject) || (object instanceof PeerCursor)) {
          this.selectedIdentifier = event.data.identifier;
          //  console.log(event.data.identifier)
          this.changeDetector.markForCheck();
          console.log('this.selectedIdentifier', this.selectedIdentifier)
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
    console.log('this.textNote', this.textNote)
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
  getNotes(type) {
    console.log('getNotes')
    return this.textNotes;
  }
  getInventory(inventoryType: string) {
    console.log('this.inventoryService', this.inventoryService)
    console.log('this.textNotes', this.textNotes)

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

  calcFitHeightIfNeeded() {
    if (this.calcFitHeightTimer) return;
    this.ngZone.runOutsideAngular(() => {
      this.calcFitHeightTimer = setTimeout(() => {
        this.calcFitHeight();
        this.calcFitHeightTimer = null;
      }, 0);
    });
  }
  calcFitHeight() {
    let textArea: HTMLTextAreaElement = this.textAreaElementRef.nativeElement;
    textArea.style.height = '0';
    if (textArea.scrollHeight > textArea.offsetHeight) {
      textArea.style.height = textArea.scrollHeight + 'px';
    }
  }
  getGameObjects(inventoryType: string): TabletopObject[] {
    return this.getInventory(inventoryType).tabletopObjects;
  }
  private calcFitHeightTimer: NodeJS.Timer = null;
  getInventoryTags(gameObject: TextNote): DataElement[] {
    return this.getInventory(gameObject.location.name).dataElementMap.get(gameObject.identifier);
  }

  onContextMenu(e: Event, gameObject: TextNote) {
    if (document.activeElement instanceof HTMLInputElement && document.activeElement.getAttribute('type') !== 'range') return;
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;

    this.selectGameObject(gameObject);

    let position = this.pointerDeviceService.pointers[0];

    let actions: ContextMenuAction[] = [];


    /**
        if (gameObject.location.name !== 'graveyard') {
          actions.push({ name: '顯示對話組合版', action: () => { this.showChatPalette(gameObject) } });
        }
     */
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

    this.contextMenuService.open(position, actions, gameObject.title);
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

  public showDetail(gameObject: TextNote) {
    console.log('showDetail', TextNote)
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = '角色卡';
    if (gameObject.title) title += ' - ' + gameObject.title;
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

class TabletopCache<T extends TabletopObject> {
  private needsRefresh: boolean = true;

  private _objects: T[] = [];
  get objects(): T[] {
    if (this.needsRefresh) {
      this._objects = this.refreshCollector();
      this._objects = this._objects ? this._objects : [];
      this.needsRefresh = false;
    }
    return this._objects;
  }

  constructor(
    readonly refreshCollector: () => T[]
  ) { }

  refresh() {
    this.needsRefresh = true;
  }
}
