import { Component, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
//import { NgForm } from '@angular/forms';

import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';

import { Card } from '../../class/card';
import { CardStack } from '../../class/card-stack';
import { TabletopObject } from '../../class/tabletop-object';
import { GameCharacter } from '../../class/game-character';
import { GameTableMask } from '../../class/game-table-mask';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { GameObject } from '../../class/core/synchronize-object/game-object';

@Component({
  selector: 'game-object-inventory',
  templateUrl: './game-object-inventory.component.html',
  styleUrls: ['./game-object-inventory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameObjectInventoryComponent {
  //private inventoryType: string = 'table';
  inventoryTypes: string[] = ['table', 'common', 'graveyard'];
  private gameObjectsChach: { [inventoryType: string]: GameObject[] } = { 'table': [], 'common': [], 'graveyard': [] };

  private selectedIdentifier: string = '';
  private networkService = Network;

  constructor(
    private changeDetector: ChangeDetectorRef,
    //private gameRoomService: GameRoomService,
    //private networkService: NetworkService,
    private viewContainerRef: ViewContainerRef,
    private modalService: ModalService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.panelService.title = 'インベントリ';
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (ObjectStore.instance.get(event.data.identifier) instanceof TabletopObject) this.changeDetector.markForCheck();
      })
      .on('SELECT_TABLETOP_OBJECT', -1000, event => {
        if (ObjectStore.instance.get(event.data.identifier) instanceof TabletopObject) {
          this.selectedIdentifier = event.data.identifier;
          this.changeDetector.markForCheck();
        }
      });
    this.inventoryTypes = ['table', 'common', Network.peerId, 'graveyard'];
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  getGameObjects(inventoryType: string) {
    let identifiersArray: TabletopObject[][] = [];
    identifiersArray[0] = ObjectStore.instance.getObjects(GameCharacter);
    //identifiersArray[1] = ObjectStore.instance.getObjects(Card);
    //identifiersArray[2] = ObjectStore.instance.getObjects(CardStack);
    //identifiersArray[1] = ObjectStore.instance.getObjects(GameTableMask);
    let gameObjects: GameObject[] = [];

    for (let identifiers of identifiersArray) {
      for (let identifier of identifiers) {
        switch (identifier.location.name) {
          case 'table':
            if (inventoryType === 'table') {
              gameObjects.push(identifier);
            }
            break;
          case Network.peerId:
            if (inventoryType === Network.peerId) {
              gameObjects.push(identifier);
            }
            break;
          case 'graveyard':
            if (inventoryType === 'graveyard') {
              gameObjects.push(identifier);
            }
            break;
          default:
            if (inventoryType === 'common' && !this.isPrivateLocation(identifier.location.name)) {
              gameObjects.push(identifier);
            }
            break;
        }
      }
    }
    return gameObjects;
  }

  private cloneGameObject(gameObject: TabletopObject) {
    gameObject.clone();
  }

  private showDetail(gameObject: TabletopObject) {
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    //this.modalService.open(GameCharacterSheetComponent);
    let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private selectGameObject(gameObject: GameObject) {
    let aliasName: string = gameObject.aliasName;
    console.log('onSelectedGameObject <' + aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
  }

  private deleteGameObject(gameObject: GameObject) {
    gameObject.destroy();
  }

  private isPrivateLocation(location: string): boolean {
    for (let conn of Network.connections) {
      if (conn.open && location === conn.peer) {
        return true;
      }
    }
    return false;
  }
}
