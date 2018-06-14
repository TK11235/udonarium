import { AfterViewInit, Component, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';

import { FileStorage } from '../../class/core/file-storage/file-storage';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { ObjectSerializer } from '../../class/core/synchronize-object/object-serializer';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { EventSystem, Network } from '../../class/core/system/system';
import { GameTable, GridType } from '../../class/game-table';
import { TableSelecter } from '../../class/table-selecter';
import { ModalService } from '../../service/modal.service';
import { PanelService } from '../../service/panel.service';
import { SaveDataService } from '../../service/save-data.service';
import { FileSelecterComponent } from '../file-selecter/file-selecter.component';

@Component({
  selector: 'game-table-setting',
  templateUrl: './game-table-setting.component.html',
  styleUrls: ['./game-table-setting.component.css']
})
export class GameTableSettingComponent implements OnInit, OnDestroy, AfterViewInit {
  minSize: number = 1;
  maxSize: number = 100;
  get tableBackgroundImage(): ImageFile {
    if (!this.selectedTable) return ImageFile.Empty;
    let file = FileStorage.instance.get(this.selectedTable.imageIdentifier);
    return file ? file : ImageFile.Empty;
  }

  get tableName(): string { return this.selectedTable.name; }
  set tableName(tableName: string) { if (this.isEditable) this.selectedTable.name = tableName; }

  get tableWidth(): number { return this.selectedTable.width; }
  set tableWidth(tableWidth: number) { if (this.isEditable) this.selectedTable.width = tableWidth; }

  get tableHeight(): number { return this.selectedTable.height; }
  set tableHeight(tableHeight: number) { if (this.isEditable) this.selectedTable.height = tableHeight; }

  get tableGridColor(): string { return this.selectedTable.gridColor; }
  set tableGridColor(tableGridColor: string) { if (this.isEditable) this.selectedTable.gridColor = tableGridColor; }

  get tableGridShow(): boolean { return this.tableSelecter.gridShow; }
  set tableGridShow(tableGridShow: boolean) {
    this.tableSelecter.gridShow = tableGridShow;
    this.tableSelecter.update();
  }

  get tableGridType(): GridType { return this.selectedTable.gridType; }
  set tableGridType(gridType: GridType) { if (this.isEditable) this.selectedTable.gridType = Number(gridType); }

  get tableSelecter(): TableSelecter { return ObjectStore.instance.get<TableSelecter>('tableSelecter'); }

  selectedTable: GameTable = null;
  selectedTableXml: string = '';

  get isEmpty(): boolean { return this.tableSelecter ? (this.tableSelecter.viewTable ? false : true) : true; }
  get isDeleted(): boolean {
    if (!this.selectedTable) return true;
    return ObjectStore.instance.get<GameTable>(this.selectedTable.identifier) == null;
  }
  get isEditable(): boolean {
    return !this.isEmpty && !this.isDeleted;
  }

  constructor(
    //private gameRoomService: GameRoomService,
    private viewContainerRef: ViewContainerRef,
    private modalService: ModalService,
    private saveDataService: SaveDataService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'テーブル設定';
    this.selectedTable = this.tableSelecter.viewTable;
    EventSystem.register(this)
      .on('DELETE_GAME_OBJECT', 1000, event => {
        if (!this.selectedTable || event.data.identifier !== this.selectedTable.identifier) return;
        let object = ObjectStore.instance.get(event.data.identifier);
        if (object !== null) {
          this.selectedTableXml = object.toXml();
        }
      });
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  selectGameTable(identifier: string) {
    EventSystem.call('SELECT_GAME_TABLE', { identifier: identifier }, Network.peerId);
    this.selectedTable = ObjectStore.instance.get<GameTable>(identifier);
    this.selectedTableXml = '';
  }

  getGameTables(): GameTable[] {
    return ObjectStore.instance.getObjects(GameTable);
  }

  createGameTable() {
    let gameTable = new GameTable();
    gameTable.name = '白紙のテーブル';
    gameTable.imageIdentifier = 'testTableBackgroundImage_image';
    gameTable.initialize();
    this.selectGameTable(gameTable.identifier);
  }

  save() {
    if (!this.selectedTable) return;
    this.selectedTable.selected = true;
    this.saveDataService.saveGameObject(this.selectedTable, 'map_' + this.selectedTable.name);
  }

  delete() {
    if (!this.isEmpty && this.selectedTable) {
      this.selectedTableXml = this.selectedTable.toXml();
      this.selectedTable.destroy();
    }
    this.tableSelecter.update();
  }

  restore() {
    if (this.selectedTable && this.selectedTableXml) {
      let restoreTable = ObjectSerializer.instance.parseXml(this.selectedTableXml);
      this.selectGameTable(restoreTable.identifier);
      this.selectedTableXml = '';
    }
  }

  openModal() {
    if (this.isDeleted) return;
    this.modalService.open<string>(FileSelecterComponent).then(value => {
      if (!this.selectedTable || !value) return;
      this.selectedTable.imageIdentifier = value;
    });
  }
}

