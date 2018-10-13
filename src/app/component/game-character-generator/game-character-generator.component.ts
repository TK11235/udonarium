import { AfterViewInit, Component, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';

import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { ObjectSerializer } from '@udonarium/core/synchronize-object/object-serializer';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system/system';
import { GameCharacter } from '@udonarium/game-character';
import { GameTableMask } from '@udonarium/game-table-mask';
import { TableSelecter } from '@udonarium/table-selecter';

import { FileSelecterComponent } from 'component/file-selecter/file-selecter.component';
import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';

@Component({
  selector: 'game-character-generator',
  templateUrl: './game-character-generator.component.html',
  styleUrls: ['./game-character-generator.component.css']
})
export class GameCharacterGeneratorComponent implements OnInit, OnDestroy, AfterViewInit {

  name: string = "ゲームキャラクター";
  size: number = 1;
  xml: string = '';

  minSize: number = 1;
  maxSize: number = 20;

  tableBackgroundImage: ImageFile = ImageFile.createEmpty('null');

  constructor(
    private viewContainerRef: ViewContainerRef,
    private modalService: ModalService,
    private panelService:PanelService
  ) { }

  ngOnInit() {
    this.panelService.title = 'キャラクタージェネレーター'
    EventSystem.register(this)
      .on('SELECT_FILE', 0, event => {
        console.log('SELECT_FILE GameCharacterGeneratorComponent ' + event.data.fileIdentifier);

        let fileIdentifier: string = event.data.fileIdentifier;

        let file: ImageFile = ImageStorage.instance.get(fileIdentifier);
        if (file) this.tableBackgroundImage = file;

      });
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  createGameCharacter() {
    GameCharacter.createGameCharacter(this.name, this.size, this.tableBackgroundImage.identifier);
  }
  createGameTableMask() {
    let viewTable = ObjectStore.instance.get<TableSelecter>('tableSelecter').viewTable;
    if (!viewTable) return;
    let tableMask = GameTableMask.create('マップマスク', 5, 5, 100);
    viewTable.appendChild(tableMask);
  }

  createGameCharacterForXML(xml: string) {
    ObjectSerializer.instance.parseXml(xml);
  }

  openModal() {
    this.modalService.open(FileSelecterComponent);
  }
}
