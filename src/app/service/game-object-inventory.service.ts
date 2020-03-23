import { Injectable } from '@angular/core';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system';
import { StringUtil } from '@udonarium/core/system/util/string-util';
import { DataElement } from '@udonarium/data-element';
import { DataSummarySetting, SortOrder } from '@udonarium/data-summary-setting';
import { GameCharacter } from '@udonarium/game-character';
import { TabletopObject } from '@udonarium/tabletop-object';

type ObjectIdentifier = string;
type LocationName = string;
type ElementName = string;

@Injectable({
  providedIn: 'root'
})
export class GameObjectInventoryService {
  private get summarySetting(): DataSummarySetting { return DataSummarySetting.instance; }

  get sortTag(): string { return this.summarySetting.sortTag; }
  set sortTag(sortTag: string) { this.summarySetting.sortTag = sortTag; }
  get sortOrder(): SortOrder { return this.summarySetting.sortOrder; }
  set sortOrder(sortOrder: SortOrder) { this.summarySetting.sortOrder = sortOrder; }
  get dataTag(): string { return this.summarySetting.dataTag; }
  set dataTag(dataTag: string) { this.summarySetting.dataTag = dataTag; }
  get dataTags(): string[] { return this.summarySetting.dataTags; }

  tableInventory: ObjectInventory = new ObjectInventory(object => { return object.location.name === 'table'; });
  commonInventory: ObjectInventory = new ObjectInventory(object => { return !this.isAnyLocation(object.location.name); });
  privateInventory: ObjectInventory = new ObjectInventory(object => { return object.location.name === Network.peerId; });
  graveyardInventory: ObjectInventory = new ObjectInventory(object => { return object.location.name === 'graveyard'; });

  private locationMap: Map<ObjectIdentifier, LocationName> = new Map();
  private tagNameMap: Map<ObjectIdentifier, ElementName> = new Map();

  readonly newLineString: string = '/';
  readonly newLineDataElement: DataElement = DataElement.create(this.newLineString);

  constructor() {
    this.initialize();
  }

  private initialize() {
    EventSystem.register(this)
      .on('OPEN_NETWORK', event => { this.refresh(); })
      .on('CONNECT_PEER', event => { this.refresh(); })
      .on('DISCONNECT_PEER', event => { this.refresh(); })
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if (!object) return;

        if (object instanceof GameCharacter) {
          let prevLocation = this.locationMap.get(object.identifier);
          if (object.location.name !== prevLocation) {
            this.locationMap.set(object.identifier, object.location.name);
            this.refresh();
          }
        } else if (object instanceof DataElement) {
          if (!this.containsInGameCharacter(object)) return;

          let prevName = this.tagNameMap.get(object.identifier);
          if ((this.dataTags.includes(prevName) || this.dataTags.includes(object.name)) && object.name !== prevName) {
            this.tagNameMap.set(object.identifier, object.name);
            this.refreshDataElements();
          }
          if (this.sortTag === object.name) {
            this.refreshSort();
          }
          if (0 < object.children.length) {
            this.refreshDataElements();
            this.refreshSort();
          }
          this.callInventoryUpdate();
        } else if (object instanceof DataSummarySetting) {
          this.refreshDataElements();
          this.refreshSort();
          this.callInventoryUpdate();
        }
      })
      .on('DELETE_GAME_OBJECT', 1000, event => {
        this.locationMap.delete(event.data.identifier);
        this.tagNameMap.delete(event.data.identifier);
        this.refresh();
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        if (event.isSendFromSelf) this.callInventoryUpdate();
      });
  }

  private containsInGameCharacter(element: DataElement): boolean {
    let parent = element.parent;
    let aliasName = GameCharacter.aliasName;
    while (parent) {
      if (parent.aliasName === aliasName) return true;
      parent = parent.parent;
    }
    return false;
  }

  private refresh() {
    this.refreshObjects();
    this.refreshDataElements();
    this.refreshSort();
    this.callInventoryUpdate();
  }

  private refreshObjects() {
    this.tableInventory.refreshObjects();
    this.commonInventory.refreshObjects();
    this.privateInventory.refreshObjects();
    this.graveyardInventory.refreshObjects();
  }

  private refreshDataElements() {
    this.tableInventory.refreshDataElements();
    this.commonInventory.refreshDataElements();
    this.privateInventory.refreshDataElements();
    this.graveyardInventory.refreshDataElements();
  }

  private refreshSort() {
    this.tableInventory.refreshSort();
    this.commonInventory.refreshSort();
    this.privateInventory.refreshSort();
    this.graveyardInventory.refreshSort();
  }

  private callInventoryUpdate() {
    EventSystem.trigger('UPDATE_INVENTORY', null);
  }

  private isAnyLocation(location: string): boolean {
    if (location === 'table' || location === Network.peerId || location === 'graveyard') return true;
    for (let conn of Network.peerContexts) {
      if (conn.isOpen && location === conn.fullstring) {
        return true;
      }
    }
    return false;
  }
}

class ObjectInventory {
  newLineString: string = '/';
  private newLineDataElement: DataElement = DataElement.create(this.newLineString);

  private get summarySetting(): DataSummarySetting { return DataSummarySetting.instance; }

  get sortTag(): string { return this.summarySetting.sortTag; }
  set sortTag(sortTag: string) { this.summarySetting.sortTag = sortTag; }

  get sortOrder(): SortOrder { return this.summarySetting.sortOrder; }
  set sortOrder(sortOrder: SortOrder) { this.summarySetting.sortOrder = sortOrder; }

  get dataTag(): string { return this.summarySetting.dataTag; }
  set dataTag(dataTag: string) { this.summarySetting.dataTag = dataTag; }

  get dataTags(): string[] { return this.summarySetting.dataTags; }

  private _tabletopObjects: TabletopObject[] = [];
  get tabletopObjects(): TabletopObject[] {
    if (this.needsRefreshObjects) {
      this._tabletopObjects = this.searchTabletopObjects();
      this.needsRefreshObjects = false;
    }
    if (this.needsSort) {
      this._tabletopObjects = this.sortTabletopObjects(this._tabletopObjects);
      this.needsSort = false;
    }
    return this._tabletopObjects;
  }

  get length(): number {
    if (this.needsRefreshObjects) {
      this._tabletopObjects = this.searchTabletopObjects();
      this.needsRefreshObjects = false;
    }
    return this._tabletopObjects.length;
  }

  private _dataElementMap: Map<ObjectIdentifier, DataElement[]> = new Map();
  get dataElementMap(): Map<ObjectIdentifier, DataElement[]> {
    if (this.needsRefreshElements) {
      this._dataElementMap.clear();
      let caches = this.tabletopObjects;
      for (let object of caches) {
        if (!object.rootDataElement) continue;
        let elements = this.dataTags.map(tag => tag === this.newLineString ? this.newLineDataElement : object.rootDataElement.getFirstElementByName(tag));
        this._dataElementMap.set(object.identifier, elements);
      }
      this.needsRefreshElements = false;
    }
    return this._dataElementMap;
  }

  private needsRefreshObjects: boolean = true;
  private needsRefreshElements: boolean = true;
  private needsSort: boolean = true;

  constructor(
    readonly classifier: (object: TabletopObject) => boolean
  ) { }

  refreshObjects() {
    this.needsRefreshObjects = true;
  }

  refreshDataElements() {
    this.needsRefreshElements = true;
  }

  refreshSort() {
    this.needsSort = true;
  }

  private searchTabletopObjects(): TabletopObject[] {
    let objects: TabletopObject[] = ObjectStore.instance.getObjects(GameCharacter);
    let caches: TabletopObject[] = [];
    for (let object of objects) {
      if (this.classifier(object)) caches.push(object);
    }
    return caches;
  }

  private sortTabletopObjects(objects: TabletopObject[]): TabletopObject[] {
    let sortTag = this.sortTag.length ? this.sortTag.trim() : '';
    let sortOrder = this.sortOrder === 'ASC' ? -1 : 1;
    if (sortTag.length < 1) return objects;

    objects.sort((a, b) => {
      let aElm = a.rootDataElement.getFirstElementByName(sortTag);
      let bElm = b.rootDataElement.getFirstElementByName(sortTag);
      if (!aElm && !bElm) return 0;
      if (!bElm) return -1;
      if (!aElm) return 1;

      let aValue = this.convertToSortableValue(aElm);
      let bValue = this.convertToSortableValue(bElm);
      if (aValue < bValue) return sortOrder;
      if (aValue > bValue) return sortOrder * -1;
      return 0;
    });
    return objects;
  }

  private convertToSortableValue(dataElement: DataElement): number | string {
    let value = dataElement.isNumberResource ? dataElement.currentValue : dataElement.value;
    let resultStr = StringUtil.toHalfWidth((value + '').trim());
    let resultNum = +resultStr;
    return Number.isNaN(resultNum) ? resultStr : resultNum;
  }
}
