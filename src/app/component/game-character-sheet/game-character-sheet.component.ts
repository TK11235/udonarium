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

import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ObjectFactory } from '../../class/core/synchronize-object/object-factory';
import { FileStorage } from '../../class/core/file-storage/file-storage';
import { FileArchiver } from '../../class/core/file-storage/file-archiver';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { MimeType } from '../../class/core/file-storage/mime-type';

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

  get isCard(): boolean {
    return this.tabletopObject instanceof Card;
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    //private gameRoomService: GameRoomService,
    //private networkService: NetworkService,
    private viewContainerRef: ViewContainerRef,
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
      this.tabletopObject.detailDataElement.appendChild(DataElement.create('タグ', '', {}));
    }
  }

  saveToXML() {
    if (!this.tabletopObject) return;

    let files: File[] = [];
    let xml: string = this.tabletopObject.toXml();
    xml = Beautify.xml(xml, 2);

    let element = this.tabletopObject.getElement('name', this.tabletopObject.commonDataElement);
    let name: string = element ? <string>element.value : '';

    files.push(new File([xml], 'data.xml', { type: 'text/plain' }));

    /*
    let image = this.tabletopObject.imageFile;
    if (image.blob) {
      files.push(new File([image.blob], image.identifier + '.' + MimeType.extension(image.blob.type), { type: image.blob.type }));
    }
    */
    files = files.concat(this.getImageFiles(xml));

    FileArchiver.instance.save(files, 'xml_' + name);
  }

  private getImageFiles(xml: string): File[] {
    let xmlElement: Element = this.xml2element(xml);
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

  private xml2element(xml: string) {
    let domParser: DOMParser = new DOMParser();
    let xmlDocument: Document = null;
    try {
      xmlDocument = domParser.parseFromString(xml, 'application/xml');
      if (xmlDocument.getElementsByTagName('parsererror').length) {
        xmlDocument = null;
      }
    } catch (error) {
      console.error(error);
    }
    if (!xmlDocument) {
      console.error('XMLのパースに失敗しました');
      return null;
    }
    return xmlDocument.documentElement;
  }

  setLocation(locationName: string) {
    this.tabletopObject.setLocation(locationName);
  }

  openModal(name: string) {
    this.modalService.open<string>(FileSelecterComponent).then(value => {
      if (!this.tabletopObject || !value) return;
      let element = this.tabletopObject.imageDataElement.getFirstElementByName(name);
      if (!element) return;
      element.value = value;
      element.update();
    });
  }
}
