import { Component, ViewContainerRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { FileSelecterComponent } from '../file-selecter/file-selecter.component';
import { ModalService } from '../../service/modal.service';
import { PanelService } from '../../service/panel.service';

import * as Beautify from 'vkbeautify';

import { GameTable, GameTableDataContainer, GridType } from '../../class/game-table';
import { TableSelecter } from '../../class/table-selecter';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { FileStorage } from '../../class/core/file-storage/file-storage';
import { FileArchiver } from '../../class/core/file-storage/file-archiver';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { MimeType } from '../../class/core/file-storage/mime-type';
import { XmlUtil } from '../../class/core/synchronize-object/xml-util';
import { ObjectSerializer } from '../../class/core/synchronize-object/object-serializer';

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

  private selectedTable: GameTable = null;
  private selectedTableXml: string = '';

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
    let xml = this.selectedTable.toXml();

    xml = Beautify.xml(xml, 2);
    console.log(xml);

    let files: File[] = [new File([xml], 'data.xml', { type: 'text/plain' })];

    files = files.concat(this.getImageFiles(xml));
    FileArchiver.instance.save(files, 'map_' + this.selectedTable.name);
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

  private getImageFiles(xml: string): File[] {
    let xmlElement: Element = XmlUtil.xml2element('<root>' + xml + '</root>');
    let files: File[] = [];
    if (!xmlElement) return files;

    let images: { [identifier: string]: ImageFile } = {};
    let imageElements = xmlElement.querySelectorAll('*[type="image"]');

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].innerHTML;
      images[identifier] = FileStorage.instance.get(identifier);
    }

    imageElements = xmlElement.querySelectorAll('*[imageIdentifier]');

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].getAttribute('imageIdentifier');
      images[identifier] = FileStorage.instance.get(identifier);
    }
    for (let identifier in images) {
      let image = images[identifier];
      if (image && image.blob) {
        files.push(new File([image.blob], image.identifier + '.' + MimeType.extension(image.blob.type), { type: image.blob.type }));
      }
    }
    return files;
  }
}

