import { Network, EventSystem } from './core/system/system';
import { SyncObject } from './core/synchronize-object/anotation';
import { GameObject } from './core/synchronize-object/game-object';
import { ObjectStore } from './core/synchronize-object/object-store';
import { ObjectSerializer, InnerXml } from './core/synchronize-object/object-serializer';
import { ObjectNode } from './core/synchronize-object/object-node';
import { ChatMessage, ChatMessageContext } from './chat-message';
import { ChatTab} from './chat-tab';

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