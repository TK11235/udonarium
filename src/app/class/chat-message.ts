import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { ObjectNode } from './core/synchronize-object/object-node';
import { ObjectStore } from './core/synchronize-object/object-store';
import { FileStorage } from './core/file-storage/file-storage';
import { ImageFile } from './core/file-storage/image-file';

export interface ChatMessageContext {
  identifier?: string;
  tabIdentifier?: string;
  from?: string;
  name?: string;
  text?: string;
  timestamp?: number;
  tag?: string;
  dicebot?: string;
  imageIdentifier?: string;
  responseIdentifier?: string;
}

@SyncObject('chat')
export class ChatMessage extends ObjectNode implements ChatMessageContext {
  @SyncVar() from: string;
  @SyncVar() name: string;
  @SyncVar() tag: string;
  @SyncVar() dicebot: string;
  @SyncVar() imageIdentifier: string;
  @SyncVar() responseIdentifier: string;

  get tabIdentifier(): string { return this.parent.identifier; }
  get text(): string { return <string>this.value }
  get timestamp(): number {
    let timestamp = this.getAttribute('timestamp');
    let num = timestamp ? +timestamp : 0;
    return Number.isNaN(num) ? 1 : num;
  }

  get response(): ChatMessage { return ObjectStore.instance.get<ChatMessage>(this.responseIdentifier); }
  get image(): ImageFile { return FileStorage.instance.get(this.imageIdentifier); }

  protected get index(): number {
    return this.minorIndex + this.timestamp;
  }
}