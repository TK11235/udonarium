import { DataElement } from './data-element';
import { ObjectStore } from './core/synchronize-object/object-store';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { GameObject } from './core/synchronize-object/game-object';
import { ObjectNode } from './core/synchronize-object/object-node';
import { ObjectSerializer, InnerXml } from './core/synchronize-object/object-serializer';
import { FileStorage } from './core/file-storage/file-storage';
import { ImageFile } from './core/file-storage/image-file';

export interface TabletopLocation {
  name: string;
  x: number;
  y: number;
}

@SyncObject('TabletopObject')
export class TabletopObject extends ObjectNode {
  @SyncVar() location: TabletopLocation = {
    name: 'table',
    x: 0,
    y: 0
  };

  private _imageFile: ImageFile = ImageFile.createEmpty('null');
  private _dataElements: { [name: string]: DataElement } = {};

  // GameDataElement getter/setter
  get rootDataElement(): DataElement {
    for (let node of this.children) {
      if (node.getAttribute('name') === this.aliasName) return <DataElement>node;
    }
    return null;
  }

  get imageDataElement(): DataElement { return this.getElement('image'); }
  get commonDataElement(): DataElement { return this.getElement('common'); }
  get detailDataElement(): DataElement { return this.getElement('detail'); }

  get imageFile(): ImageFile {
    if (!this.imageDataElement) return this._imageFile;
    let imageIdElement: DataElement = this.imageDataElement.getFirstElementByName('imageIdentifier');
    if (imageIdElement && this._imageFile.identifier !== imageIdElement.value) {
      let file: ImageFile = FileStorage.instance.get(<string>imageIdElement.value);
      if (file) this._imageFile = file;
    }
    return this._imageFile;
  }

  static createTabletopObject(name: string, identifier?: string): TabletopObject {

    let gameObject: TabletopObject = new TabletopObject(identifier);
    gameObject.createDataElements();

    /* debug */
    console.log('serializeToXmlString\n' + gameObject.rootDataElement.toXml());
    let domParser: DOMParser = new DOMParser();
    let xmlDocument: Document = domParser.parseFromString(gameObject.rootDataElement.toXml(), 'application/xml');
    console.log(xmlDocument);
    /* debug */

    return gameObject;
  }

  protected createDataElements() {
    this.initialize();
    let aliasName: string = this.aliasName;
    //console.log('rootDataElement??1', this, this.rootDataElement);
    if (!this.rootDataElement) {
      let rootElement = DataElement.create(aliasName, '', {}, aliasName + '_' + this.identifier);
      this.appendChild(rootElement);
    }

    if (!this.imageDataElement) {
      this.rootDataElement.appendChild(DataElement.create('image', '', {}, 'image_' + this.identifier));
      this.imageDataElement.appendChild(DataElement.create('imageIdentifier', '', { type: 'image' }, 'imageIdentifier_' + this.identifier));
    }
    if (!this.commonDataElement) this.rootDataElement.appendChild(DataElement.create('common', '', {}, 'common_' + this.identifier));
    if (!this.detailDataElement) this.rootDataElement.appendChild(DataElement.create('detail', '', {}, 'detail_' + this.identifier));
  }

  getElement(name: string, from: DataElement = this.rootDataElement): DataElement {
    //if (!from) return null;
    /*
    if (this._dataElements[name] && this._dataElements[name].parent && this._dataElements[name].parent.identifier !== from.identifier) {
      this._dataElements[name] = null;
    }
    */
    if (!this._dataElements[name] && from) {
      let element: DataElement = from.getFirstElementByName(name);
      if (element) {
        this._dataElements[name] = element;
      }
    }
    return this._dataElements[name] ? this._dataElements[name] : null;
  }

  setLocation(location: string) {
    this.location.name = location;
    this.update();
  }
}
