import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';

import { Card } from '../../class/card';
import { EventSystem, Network } from '../../class/core/system/system';
import { DataElement } from '../../class/data-element';
import { GameCharacter } from '../../class/game-character';
import { TabletopObject } from '../../class/tabletop-object';
import { Terrain } from '../../class/terrain';
import { ModalService } from '../../service/modal.service';
import { PanelService } from '../../service/panel.service';
import { SaveDataService } from '../../service/save-data.service';
import { FileSelecterComponent } from '../file-selecter/file-selecter.component';

@Component({
  selector: 'game-character-sheet',
  templateUrl: './game-character-sheet.component.html',
  styleUrls: ['./game-character-sheet.component.css']
})
export class GameCharacterSheetComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() tabletopObject: TabletopObject = null;
  private isEdit: boolean = false;

  //private gameRoomService: GameRoomService,
  private networkService = Network;

  get isCharacter(): boolean {
    return this.tabletopObject instanceof GameCharacter;
  }

  get isCard(): boolean {
    return this.tabletopObject instanceof Card;
  }

  get isTerrain(): boolean {
    return this.tabletopObject instanceof Terrain;
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private viewContainerRef: ViewContainerRef,
    private saveDataService: SaveDataService,
    private modalService: ModalService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.panelService.title = 'キャラクターシート';
    if (this.tabletopObject instanceof GameCharacter && 0 < this.tabletopObject.name.length) {
      this.panelService.title += ' - ' + this.tabletopObject.name;
    }
    EventSystem.register(this)
      .on('DELETE_GAME_OBJECT', -1000, event => {
        if (this.tabletopObject && this.tabletopObject.identifier === event.data.identifier) {
          this.tabletopObject = null;
        }
      });
  }

  ngAfterViewInit() {
    console.log(this.tabletopObject);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  toggleEditMode() {
    this.isEdit = this.isEdit ? false : true;
  }

  addDataElement() {
    if (this.tabletopObject.detailDataElement) {
      let title = DataElement.create('見出し', '', {});
      let tag = DataElement.create('タグ', '', {});
      title.appendChild(tag);
      this.tabletopObject.detailDataElement.appendChild(title);
    }
  }

  saveToXML() {
    if (!this.tabletopObject) return;

    let element = this.tabletopObject.getElement('name', this.tabletopObject.commonDataElement);
    let objectName: string = element ? <string>element.value : '';

    this.saveDataService.saveGameObject(this.tabletopObject, 'xml_' + objectName);
  }

  setLocation(locationName: string) {
    this.tabletopObject.setLocation(locationName);
  }

  openModal(name: string) {
    this.modalService.open<string>(FileSelecterComponent).then(value => {
      if (!this.tabletopObject || !this.tabletopObject.imageDataElement || !value) return;
      let element = this.tabletopObject.imageDataElement.getFirstElementByName(name);
      if (!element) return;
      element.value = value;
      element.update();
    });
  }
}
