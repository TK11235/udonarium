import { GameTable } from './game-table';
import { GameCharacter } from './game-character';
import { EventSystem, Network } from './core/system/system';
import { GameTableMask } from './game-table-mask';
import { Terrain } from './terrain';
import { TableSelecter } from './table-selecter';
import { ObjectStore } from './core/synchronize-object/object-store';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { GameObject } from './core/synchronize-object/game-object';
import { ObjectSerializer, InnerXml } from './core/synchronize-object/object-serializer';
import { CardStack } from './card-stack';
import { Card } from './card';

@SyncObject('room')
export class Room extends GameObject implements InnerXml {
  // override
  initialize(needUpdate: boolean = true) { }

  innerXml(): string {
    let xml = '';
    let objects: GameObject[] = [];
    objects = objects.concat(ObjectStore.instance.getObjects(GameTable));
    objects = objects.concat(ObjectStore.instance.getObjects(GameCharacter));
    objects = objects.concat(ObjectStore.instance.getObjects(CardStack));
    objects = objects.concat(ObjectStore.instance.getObjects(Card));
    for (let object of objects) {
      xml += object.toXml();
    }
    return xml;
  }

  parseInnerXml(element: Element) {
    let objects: GameObject[] = [];
    objects = objects.concat(ObjectStore.instance.getObjects(GameTable));
    objects = objects.concat(ObjectStore.instance.getObjects(GameTableMask));
    objects = objects.concat(ObjectStore.instance.getObjects(Terrain));
    objects = objects.concat(ObjectStore.instance.getObjects(GameCharacter));
    objects = objects.concat(ObjectStore.instance.getObjects(CardStack));
    objects = objects.concat(ObjectStore.instance.getObjects(Card));
    for (let object of objects) {
      object.destroy();
    }
    for (let i = 0; i < element.children.length; i++) {
      ObjectSerializer.instance.parseXml(element.children[i]);
    }
  }
}
