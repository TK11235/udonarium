import { GameTable, GameTableDataContainer } from './game-table';
import { EventSystem } from './core/system/system';
import { ObjectStore } from './core/synchronize-object/object-store';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { GameObject } from './core/synchronize-object/game-object';

@SyncObject('TableSelecter')
export class TableSelecter extends GameObject {
  @SyncVar() viewTableIdentifier: string = '';
  gridShow: boolean = false; // true=常時グリッド表示

  initialize(needUpdate: boolean = true) {
    super.initialize(needUpdate);
    EventSystem.register(this)
      .on('SELECT_GAME_TABLE', 0, event => {
        console.log('SELECT_GAME_TABLE ' + this.identifier);

        this.viewTable.selected = false;
        this.viewTableIdentifier = event.data.identifier;
        //this.update();

        let gameTable = this.viewTable;

        if (!gameTable) return;

        let data: GameTableDataContainer = {
          width: gameTable.width,
          height: gameTable.height,
          imageIdentifier: gameTable.imageIdentifier,
          gridSize: gameTable.gridSize,
          gridType: gameTable.gridType,
        }
        EventSystem.call('UPDATE_GAME_TABLE', data);
        gameTable.selected = true;
        //gameTable.update();
      });
  }

  get viewTable(): GameTable {
    let table: GameTable = ObjectStore.instance.get<GameTable>(this.viewTableIdentifier);
    if (!table) table = ObjectStore.instance.getObjects(GameTable)[0];
    return table;
  }
}
