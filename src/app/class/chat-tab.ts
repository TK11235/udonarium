import { ChatMessage, ChatMessageContext } from './chat-message';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { InnerXml, ObjectSerializer } from './core/synchronize-object/object-serializer';
import { EventSystem } from './core/system/system';

@SyncObject('chat-tab')
export class ChatTab extends ObjectNode implements InnerXml {
  @SyncVar() name: string = 'タブ';
  get chatMessages(): ChatMessage[] { return <ChatMessage[]>this.children; }

  initialize(needUpdate: boolean = true) {
    super.initialize(needUpdate);
    EventSystem.register(this)
      .on<ChatMessageContext>('BROADCAST_MESSAGE', 200, event => {
        if (!event.isSendFromSelf) return;
        if (event.data.tabIdentifier !== this.identifier) return;
        let chat = new ChatMessage();
        let message = event.data;
        for (let key in message) {
          if (key === 'identifier') continue;
          if (key === 'tabIdentifier') continue;
          if (key === 'text') {
            chat.value = message[key];
            continue;
          }
          if (message[key] == null || message[key] === '') continue;
          chat.setAttribute(key, message[key]);
        }
        chat.initialize();
        this.appendChild(chat);

        event.data.identifier = chat.identifier;
      });
  }

  addMessage(message: ChatMessageContext) {
    message.tabIdentifier = this.identifier;
    EventSystem.call('BROADCAST_MESSAGE', message);
  }

  innerXml(): string {
    let xml = '';
    for (let child of this.children) {
      if (child instanceof ChatMessage && !child.isDisplayable) continue;
      xml += ObjectSerializer.instance.toXml(child);
    }
    return xml;
  };

  parseInnerXml(element: Element) {
    return super.parseInnerXml(element);
  };
}