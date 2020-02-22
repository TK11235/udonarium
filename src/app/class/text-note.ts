import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { DataElement } from './data-element';
import { TabletopObject } from './tabletop-object';
import { moveToTopmost } from './tabletop-object-util';
import { PeerCursor } from '@udonarium/peer-cursor';
import {  Network } from '@udonarium/core/system';

@SyncObject('text-note')
export class TextNote extends TabletopObject {
  @SyncVar() rotate: number = 0;
  @SyncVar() zindex: number = 0;
  @SyncVar() password: string = '';
  @SyncVar() GM: string = '';

    get GMName(): string {
    let object = PeerCursor.find(this.GM);
    return object ? object.name : '';
  }
  get hasGM(): boolean {
    if (this.GM) return true
    else return false }
  get isMine(): boolean { return PeerCursor.myCursor.name === this.GM; }
  get isDisabled(): boolean { return this.hasGM && !this.isMine; }

  get width(): number { return this.getCommonValue('width', 1); }
  get height(): number { return this.getCommonValue('height', 1); }
  get fontSize(): number { return this.getCommonValue('fontsize', 1); }
  get title(): string { return this.getCommonValue('title', ''); }
  get text(): string { return this.getCommonValue('text', ''); }
  set text(text: string) { this.setCommonValue('text', text); }

  toTopmost() {
    moveToTopmost(this);
  }

  static create(title: string, text: string, fontSize: number = 16, width: number = 1, height: number = 1, identifier?: string): TextNote {
    let object: TextNote = identifier ? new TextNote(identifier) : new TextNote();

    object.createDataElements();
    object.commonDataElement.appendChild(DataElement.create('width', width, {}, 'width_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('height', height, {}, 'height_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('fontsize', fontSize, {}, 'fontsize_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('title', title, {}, 'title_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('text', text, { type: 'note', currentValue: text }, 'text_' + object.identifier));
    object.initialize();

    return object;
  }
}