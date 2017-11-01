import { Network } from './core/system/system';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { ObjectNode } from './core/synchronize-object/object-node';
import { ObjectStore } from './core/synchronize-object/object-store';
import { InnerXml } from './core/synchronize-object/object-serializer';
import { FileStorage } from './core/file-storage/file-storage';
import { ImageFile } from './core/file-storage/image-file';

export interface ChatMessageContext {
  identifier?: string;
  tabIdentifier?: string;
  from?: string;
  to?: string;
  name?: string;
  text?: string;
  timestamp?: number;
  tag?: string;
  dicebot?: string;
  imageIdentifier?: string;
  responseIdentifier?: string;
}

@SyncObject('chat')
export class ChatMessage extends ObjectNode implements ChatMessageContext, InnerXml {
  @SyncVar() from: string;
  @SyncVar() to: string;
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
  private _to: string;
  private _sendTo: string[] = [];
  get sendTo(): string[] {
    if (this._to !== this.to) {
      this._to = this.to;
      this._sendTo = 0 < this.to.length ? this.to.split(/\s+/) : [];
    }
    return this._sendTo;
  }
  private _tag: string;
  private _tags: string[] = [];
  get tags(): string[] {
    if (this._tag !== this.tag) {
      this._tag = this.tag;
      this._tags = 0 < this.tag.length ? this.tag.split(/\s+/) : [];
    }
    return this._tags;
  }
  get response(): ChatMessage { return ObjectStore.instance.get<ChatMessage>(this.responseIdentifier); }
  get image(): ImageFile { return FileStorage.instance.get(this.imageIdentifier); }
  get index(): number { return this.minorIndex + this.timestamp; }
  get isDirect(): boolean { return 0 < this.sendTo.length ? true : false; }
  get isMine(): boolean { return (-1 < this.sendTo.indexOf(Network.peerContext.id)) || this.from === Network.peerContext.id ? true : false; }
  get isDisplayable(): boolean { return this.isDirect ? this.isMine : true; }
  get isSystem(): boolean { return -1 < this.tags.indexOf('system') ? true : false; }
  get isDicebot(): boolean { return this.isSystem && this.from === 'System-BCDice' ? true : false; }
  get isSecret(): boolean { return -1 < this.tags.indexOf('secret') ? true : false; }

  innerXml(): string {
    return this.isDirect ? '' : super.innerXml();
  };

  parseInnerXml(element: Element) {
    return super.parseInnerXml(element);
  };
}
