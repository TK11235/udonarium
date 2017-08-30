import { DataElement } from './data-element';
import { TabletopObject } from './tabletop-object';

import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { ObjectNode } from './core/synchronize-object/object-node';

@SyncObject('table-mask')
export class GameTableMask extends TabletopObject {
  @SyncVar() isLock: boolean = false;

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

  get opacity(): number {
    let element = this.getElement('opacity', this.commonDataElement);
    let num = element ? <number>element.currentValue / <number>element.value : 1;
    return Number.isNaN(num) ? 1 : num;
  }

  get name(): string {
    let element = this.getElement('name', this.commonDataElement);
    return element ? <string>element.value : '';
  }

  static create(name: string, width: number, height: number, opacity: number, identifier?: string): GameTableMask {
    let object: GameTableMask = null;

    if (identifier) {
      object = new GameTableMask(identifier);
    } else {
      object = new GameTableMask();
    }
    object.createDataElements();

    object.commonDataElement.appendChild(DataElement.create('name', name, {}, 'name_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('width', width, {}, 'width_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('height', width, {}, 'height_' + object.identifier));
    object.commonDataElement.appendChild(DataElement.create('opacity', opacity, { type: 'numberResource', currentValue: opacity }, 'opacity_' + object.identifier));
    object.initialize();

    /* debug */
    console.log('serializeToXmlString\n' + object.rootDataElement.toXml());
    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(object.rootDataElement.toXml(), 'application/xml');
    console.log(gameCharacterXMLDocument);
    /* debug */

    return object;
  }
}
