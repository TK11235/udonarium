import { Attributes } from './core/synchronize-object/attributes';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { CompareOption, StringUtil } from './core/system/util/string-util';

@SyncObject('data')
export class DataElement extends ObjectNode {
  @SyncVar() name: string;
  @SyncVar() type: string;
  @SyncVar() currentValue: number | string;

  get isNumberResource(): boolean { return this.type != null && this.type === 'numberResource'; }
  get isNote(): boolean { return this.type != null && this.type === 'note'; }

  public static create(name: string, value: number | string = '', attributes: Attributes = {}, identifier: string = ''): DataElement {
    let dataElement: DataElement;
    if (identifier && 0 < identifier.length) {
      dataElement = new DataElement(identifier);
    } else {
      dataElement = new DataElement();
    }
    dataElement.attributes = attributes;
    dataElement.name = name;
    dataElement.value = value;
    dataElement.initialize();

    return dataElement;
  }

  getElementsByName(name: string, option: CompareOption = CompareOption.None): DataElement[] {
    let children: DataElement[] = [];
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (StringUtil.equals(child.getAttribute('name'), name, option)) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByName(name, option));
      }
    }
    return children;
  }

  getElementsByType(type: string, option: CompareOption = CompareOption.None): DataElement[] {
    let children: DataElement[] = [];
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (StringUtil.equals(child.getAttribute('type'), type, option)) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByType(type, option));
      }
    }
    return children;
  }

  getFirstElementByName(name: string, option: CompareOption = CompareOption.None): DataElement {
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (StringUtil.equals(child.getAttribute('name'), name, option)) return child;
        let match = child.getFirstElementByName(name, option);
        if (match) return match;
      }
    }
    return null;
  }
}
