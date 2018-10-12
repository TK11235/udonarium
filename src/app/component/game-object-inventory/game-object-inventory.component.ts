import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewContainerRef } from '@angular/core';

import { GameObject } from '@udonarium/core/synchronize-object/game-object';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system/system';
import { DataElement } from '@udonarium/data-element';
import { GameCharacter } from '@udonarium/game-character';
import { TabletopObject } from '@udonarium/tabletop-object';

import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { ModalService } from 'service/modal.service';
import { PanelOption, PanelService } from 'service/panel.service';

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
        let object = ObjectStore.instance.get(event.data.identifier);
        if (object instanceof TabletopObject || object instanceof DataElement) this.changeDetector.markForCheck();
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
    for (let conn of Network.peerContexts) {
      if (conn.isOpen && location === conn.fullstring) {
        return true;
      }
    }
    return false;
  }
}
