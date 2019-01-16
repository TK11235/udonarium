import { Injectable } from '@angular/core';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system';
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

  private locationHash: Map<ObjectIdentifier, LocationName> = new Map();
  private elementNameHash: Map<ObjectIdentifier, ElementName> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if (!object) return;

        if (object instanceof GameCharacter) {
          let preLocation = this.locationHash[object.identifier];
          if (object.location.name !== preLocation) {
            this.locationHash[object.identifier] = object.location.name;
            this.needUpdateObjects();
            this.needUpdateDataElement();
            this.needNeedSort();
          }
          this.callInventoryUpdate();
        } else if (object instanceof DataElement) {
          if (!this.containsInGameCharacter(object)) return;

          let preElementName = this.elementNameHash[object.identifier];
          if ((this.dataTags.includes(preElementName) || this.dataTags.includes(object.name)) && object.name !== preElementName) {
            this.elementNameHash[object.identifier] = object.name;
            this.needUpdateDataElement();
          }
          if (this.sortTag === object.name) {
            this.needNeedSort();
          }
          if (0 < object.children.length) {
            this.needUpdateDataElement();
            this.needNeedSort();
          }
          this.callInventoryUpdate();
        } else if (object instanceof DataSummarySetting) {
          this.needUpdateDataElement();
          this.needNeedSort();
          this.callInventoryUpdate();
        }
      })
      .on('DELETE_GAME_OBJECT', 1000, event => {
        delete this.locationHash[event.data.identifier];
        delete this.elementNameHash[event.data.identifier];
        this.needUpdateObjects();
        this.needUpdateDataElement();
        this.needNeedSort();
        this.callInventoryUpdate();
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

  private needUpdateObjects() {
    this.tableInventory.isNeedUpdateObjects = true;
    this.commonInventory.isNeedUpdateObjects = true;
    this.privateInventory.isNeedUpdateObjects = true;
    this.graveyardInventory.isNeedUpdateObjects = true;
  }

  private needUpdateDataElement() {
    this.tableInventory.isNeedUpdateElement = true;
    this.commonInventory.isNeedUpdateElement = true;
    this.privateInventory.isNeedUpdateElement = true;
    this.graveyardInventory.isNeedUpdateElement = true;
  }

  private needNeedSort() {
    this.tableInventory.isNeedSort = true;
    this.commonInventory.isNeedSort = true;
    this.privateInventory.isNeedSort = true;
    this.graveyardInventory.isNeedSort = true;
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
    if (this.isNeedUpdateObjects) {
      this._tabletopObjects = this.searchTabletopObjects();
      this.isNeedUpdateObjects = false;
    }
    if (this.isNeedSort) {
      this._tabletopObjects = this.sortTabletopObjects(this._tabletopObjects);
      this.isNeedSort = false;
    }
    return this._tabletopObjects;
  }

  get length(): number {
    if (this.isNeedUpdateObjects) {
      this._tabletopObjects = this.searchTabletopObjects();
      this.isNeedUpdateObjects = false;
    }
    return this._tabletopObjects.length;
  }

  private _dataElementMap: Map<ObjectIdentifier, DataElement[]> = new Map();
  get dataElementMap(): Map<ObjectIdentifier, DataElement[]> {
    if (this.isNeedUpdateElement) {
      this._dataElementMap.clear();
      let caches = this.tabletopObjects;
      for (let object of caches) {
        if (!object.rootDataElement) continue;
        let elements = this.dataTags.map(tag => tag === this.newLineString ? this.newLineDataElement : object.rootDataElement.getFirstElementByName(tag));
        this._dataElementMap.set(object.identifier, elements);
      }
      this.isNeedUpdateElement = false;
    }
    return this._dataElementMap;
  }

  isNeedUpdateObjects: boolean = true;
  isNeedUpdateElement: boolean = true;
  isNeedSort: boolean = true;

  constructor(
    readonly classifier: (object: TabletopObject) => boolean
  ) { }

  private searchTabletopObjects() {
    let objects: TabletopObject[] = ObjectStore.instance.getObjects(GameCharacter);
    let caches: TabletopObject[] = [];
    for (let object of objects) {
      if (this.classifier(object)) caches.push(object);
    }
    return caches;
  }

  private sortTabletopObjects(objects: TabletopObject[]) {
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
    let resultStr: string = (value + '').trim().replace(/[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    let resultNum = +resultStr;
    return Number.isNaN(resultNum) ? resultStr : resultNum;
  }
}
