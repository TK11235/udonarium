import { Component, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
//import { NgForm } from '@angular/forms';

import { FileSelecterComponent } from '../file-selecter/file-selecter.component';
import { ModalService } from '../../service/modal.service';
import { PanelService } from '../../service/panel.service';
import * as Beautify from 'vkbeautify';
//import { JSZip } from 'jszip';

import { GameCharacter } from '../../class/game-character';
import { GameTableMask } from '../../class/game-table-mask';
import { DataElement } from '../../class/data-element';
import { TabletopObject } from '../../class/tabletop-object';
import { Card, CardState } from '../../class/card';
import { Terrain } from '../../class/terrain';

import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ObjectFactory } from '../../class/core/synchronize-object/object-factory';
import { FileStorage } from '../../class/core/file-storage/file-storage';
import { FileArchiver } from '../../class/core/file-storage/file-archiver';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { MimeType } from '../../class/core/file-storage/mime-type';
import { XmlUtil } from '../../class/core/synchronize-object/xml-util';
import { SaveDataService } from '../../service/save-data.service';

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
    //private gameRoomService: GameRoomService,
    //private networkService: NetworkService,
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
      /*
      .on('SELECT_TABLETOP_OBJECT', 0, event => {
        console.log('SELECT_TABLETOP_OBJECT GameCharacterSheetComponent <' + event.data.className + '>' + event.data.identifier);

        //if (GameRoomService.getClass(event.data.className).prototype instanceof TabletopObject) {
        this.tabletopObject = <TabletopObject>ObjectStore.instance.get(event.data.identifier);
        //}
        this.panelService.title = 'キャラクターシート';
        if (this.tabletopObject instanceof GameCharacter && 0 < this.tabletopObject.name.length) {
          this.panelService.title += ' - ' + this.tabletopObject.name;
        }
      })
      */.on('DELETE_GAME_OBJECT', -1000, event => {
        if (this.tabletopObject && this.tabletopObject.identifier === event.data.identifier) {
          this.tabletopObject = null;
        }
      });
    /*
    if (!this.tabletopObject) {
      let gameObject = ObjectStore.instance.get(this.gameRoomService.selectedIdentifier);
      if (gameObject instanceof TabletopObject) {
        this.tabletopObject = gameObject;
      }
    }
    */
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
