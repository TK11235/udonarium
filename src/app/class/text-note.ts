import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { TabletopObject } from './tabletop-object';
import { DataElement } from './data-element';
import { ObjectStore } from './core/synchronize-object/object-store';

@SyncObject('text-note')
export class TextNote extends TabletopObject {
  @SyncVar() rotate: number = 0;
  @SyncVar() zindex: number = 0;
  @SyncVar() password: string = '';

  get width(): number {
    let element = this.getElement('width', this.commonDataElement);
    let num = element ? +element.value : 0;
    return Number.isNaN(num) ? 1 : num;
  }

  get height(): number {
    let element = this.getElement('height', this.commonDataElement);
    let num = element ? +element.value : 0;
    return Number.isNaN(num) ? 1 : num;
  }

  get fontSize(): number {
    let element = this.getElement('fontsize', this.commonDataElement);
    let num = element ? +element.value : 0;
    return Number.isNaN(num) ? 1 : num;
  }

  get title(): string {
    let element = this.getElement('title', this.commonDataElement);
    return element ? <string>element.value : '';
  }

  get text(): string {
    let element = this.getElement('text', this.commonDataElement);
    return element ? <string>element.value : '';
  }

  set text(text: string) {
    let element = this.getElement('text', this.commonDataElement);
    if (!element) return;
    element.value = text;
  }

  toTopmost() {
    let object: any[] = ObjectStore.instance.getObjects('text-note');
    object.sort((a, b) => {
      if (a.zindex < b.zindex) return -1;
      if (a.zindex > b.zindex) return 1;
      return 0;
    });
    let last = object[object.length - 1];
    if (last === this) return;
    let max = last.zindex;
    if (this.zindex <= max) this.zindex = max + 1;

    if (object.length * 16 < max) {
      for (let i = 0; i < object.length; i++) {
        object[i].zindex = i;
      }
    }
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