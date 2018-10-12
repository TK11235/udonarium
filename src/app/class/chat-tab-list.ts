import { ChatTab } from './chat-tab';
import { SyncObject } from './core/synchronize-object/decorator';
import { GameObject } from './core/synchronize-object/game-object';
import { ObjectNode } from './core/synchronize-object/object-node';
import { InnerXml } from './core/synchronize-object/object-serializer';
import { ObjectStore } from './core/synchronize-object/object-store';

@SyncObject('chat-tab-list')
export class ChatTabList extends ObjectNode implements InnerXml {
  // override
  initialize(needUpdate: boolean = true) { }

  innerXml(): string {
    let xml = '';
    let gameObjects: GameObject[] = ObjectStore.instance.getObjects(ChatTab);
    for (let gameObject of gameObjects.concat()) {
      xml += gameObject.toXml();
    }
    return xml;
  }

  parseInnerXml(element: Element) {
    let gameObjects: GameObject[] = ObjectStore.instance.getObjects(ChatTab);
    for (let gameObject of gameObjects.concat()) {
      gameObject.destroy();
    }
    super.parseInnerXml(element);
  }
}