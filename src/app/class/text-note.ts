import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectStore } from './core/synchronize-object/object-store';
import { DataElement } from './data-element';
import { TabletopObject } from './tabletop-object';

@SyncObject('text-note')
export class TextNote extends TabletopObject {
  @SyncVar() rotate: number = 0;
  @SyncVar() zindex: number = 0;
  @SyncVar() password: string = '';

  get width(): number { return this.getCommonValue('width', 1); }
  get height(): number { return this.getCommonValue('height', 1); }
  get fontSize(): number { return this.getCommonValue('fontsize', 1); }
  get title(): string { return this.getCommonValue('title', ''); }
  get text(): string { return this.getCommonValue('text', ''); }
  set text(text: string) { this.setCommonValue('text', text); }

  toTopmost() {
    let objects: TextNote[] = ObjectStore.instance.getObjects('text-note');

    let maxZindex: number = -1;
    let hasConflict: boolean = false;
    for (let i = 0; i < objects.length; i++) {
      if (maxZindex === objects[i].zindex) {
        hasConflict = true;
      } else if (maxZindex < objects[i].zindex) {
        maxZindex = objects[i].zindex;
        hasConflict = false;
      }
    }

    if (maxZindex === this.zindex && !hasConflict) return;
    this.zindex = maxZindex + 1;

    if (this.zindex < objects.length + 256) return;
    objects.sort((a, b) => a.zindex - b.zindex);

    for (let i = 0; i < objects.length; i++) {
      objects[i].zindex = i;
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