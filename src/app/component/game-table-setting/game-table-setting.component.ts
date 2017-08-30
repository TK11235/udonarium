import { Component, ViewContainerRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { FileSelecterComponent } from '../file-selecter/file-selecter.component';
import { ModalService } from '../../service/modal.service';
import { PanelService } from '../../service/panel.service';

import * as Beautify from 'vkbeautify';

import { GameTable, GameTableDataContainer } from '../../class/game-table';
import { TableSelecter } from '../../class/table-selecter';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { FileStorage } from '../../class/core/file-storage/file-storage';
import { FileArchiver } from '../../class/core/file-storage/file-archiver';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { MimeType } from '../../class/core/file-storage/mime-type';

@Component({
  selector: 'game-table-setting',
  templateUrl: './game-table-setting.component.html',
  styleUrls: ['./game-table-setting.component.css']
})
export class GameTableSettingComponent implements OnInit, OnDestroy, AfterViewInit {

  _tableName: string = '';
  _tableWidth: number = 20;
  _tableHeight: number = 20;
  minSize: number = 1;
  maxSize: number = 100;
  tableBackgroundImage: ImageFile = ImageFile.createEmpty('null');

  get tableName(): string { return this._tableName };
  set tableName(tableName: string) {
    this._tableName = tableName;
    this.updateGameTableSettings();
  }

  get tableWidth(): number { return this._tableWidth };
  set tableWidth(tableWidth: number) {
    this._tableWidth = tableWidth;
    this.updateGameTableSettings();
  }

  get tableHeight(): number { return this._tableHeight };
  set tableHeight(tableHeight: number) {
    this._tableHeight = tableHeight;
    this.updateGameTableSettings();
  }

  get viewTable(): GameTable {
    return ObjectStore.instance.get<TableSelecter>('tableSelecter').viewTable;
  }

  constructor(
    //private gameRoomService: GameRoomService,
    private viewContainerRef: ViewContainerRef,
    private modalService: ModalService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'テーブル設定';
    this.update();

    EventSystem.register(this)
      /*
        .on('SELECT_FILE', 0, event => {
          console.log('SELECT_FILE GameTableSettingComponent ' + event.data.fileIdentifier);
  
          let fileIdentifier: string = event.data.fileIdentifier;
  
          let file: ImageFile = FileStorage.instance.get(fileIdentifier);
          if (file) this.tableBackgroundImage = file;
  
        })*/
      .on('SELECT_GAME_TABLE', -1000, event => {
        this.update();
      })
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  private update() {
    let gameTable = this.viewTable;
    let file = FileStorage.instance.get(gameTable.imageIdentifier);
    if (file) {
      this.tableBackgroundImage = file;
    }
    this._tableName = gameTable.name;
    this._tableHeight = gameTable.height;
    this._tableWidth = gameTable.width;
  }

  updateGameTableSettings() {
    if (this.tableWidth < this.minSize) this.tableWidth = this.minSize;
    if (this.tableHeight < this.minSize) this.tableHeight = this.minSize;
    if (this.maxSize < this.tableWidth) this.tableWidth = this.maxSize;
    if (this.maxSize < this.tableHeight) this.tableHeight = this.maxSize;

    let gameTable = this.viewTable;
    gameTable.name = this.tableName;
    gameTable.width = this.tableWidth;
    gameTable.height = this.tableHeight;
    gameTable.imageIdentifier = this.tableBackgroundImage.identifier;
    gameTable.gridSize = 50;
    gameTable.update();
  }

  selectGameTable(identifier: string) {
    EventSystem.call('SELECT_GAME_TABLE', { identifier: identifier }, Network.peerId);
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
    //let gameObjects = this.gameRoomService.getGameObjectsWithType<GameTable>('GameTable');
    //for (let identifier in gameObjects) {
    let gameTable = this.viewTable.clone();//gameObjects[identifier];
    gameTable.selected = true;
    let xml = gameTable.toXml();

    xml = Beautify.xml(xml, 2);
    console.log(xml);

    let files: File[] = [new File([xml], 'data.xml', { type: 'text/plain' })];

    let image = FileStorage.instance.get(gameTable.imageIdentifier);
    if (image.blob) {
      files.push(new File([image.blob], image.identifier + '.' + MimeType.extension(image.blob.type), { type: image.blob.type }));
    }

    FileArchiver.instance.save(files, 'map_' + gameTable.identifier);
  }

  openModal() {
    this.modalService.open<string>(FileSelecterComponent).then(value => {
      if (!this.viewTable || !value) return;
      let file: ImageFile = FileStorage.instance.get(value);
      if (file) this.tableBackgroundImage = file;
      this.viewTable.imageIdentifier = value;
    });
  }
}

