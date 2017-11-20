import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
//import { EventSystemProxy, EventData } from './event-system.service';
//import { NetworkProxy } from './network.service';
//import { GameRoomService } from './game-room.service';
import { GameCharacter, GameCharacterContainer } from '../../class/game-character';
//import { FileStorageProxy, FileDataContainer } from './file-storage.service';
import { DataElement } from '../../class/data-element';

import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { GameObject } from '../../class/core/synchronize-object/game-object';

@Component({
  selector: 'game-data-element, [game-data-element]',
  templateUrl: './game-data-element.component.html',
  styleUrls: ['./game-data-element.component.css']
})
export class GameDataElementComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() gameDataElement: DataElement = null;
  @Input() isEdit: boolean = false;
  // gameDataElement.currentValueだと遅い　何とかする

  constructor(
    private ngZone: NgZone,
    //private gameRoomService: GameRoomService,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (this.gameDataElement && event.data.identifier === this.gameDataElement.identifier) this.changeDetector.markForCheck();
      }).on('DELETE_GAME_OBJECT', -1000, event => {
        if (this.gameDataElement && this.gameDataElement.identifier === event.data.identifier) {
          this.gameDataElement = null;
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    //console.log('GameDataElementComponent ngOnDestroy <>' + this.gameDataElement.identifier);
  }

  ngAfterViewInit() {

  }

  addElement() {
    this.gameDataElement.appendChild(DataElement.create('タグ', '', {}));
  }

  deleteElement() {
    this.gameDataElement.destroy();
  }

  upElement() {
    let parentElement = this.gameDataElement.parent;
    let index: number = parentElement.children.indexOf(this.gameDataElement);
    if (0 < index) {
      let prevElement = parentElement.children[index - 1];
      parentElement.insertBefore(this.gameDataElement, prevElement);
    }
  }

  downElement() {
    let parentElement = this.gameDataElement.parent;
    let index: number = parentElement.children.indexOf(this.gameDataElement);
    if (index < parentElement.children.length - 1) {
      let nextElement = parentElement.children[index + 1];
      parentElement.insertBefore(nextElement, this.gameDataElement);
    }
  }

  setElementType(type: string) {
    this.gameDataElement.setAttribute('type', type);
  }
}
