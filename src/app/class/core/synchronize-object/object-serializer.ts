import { XmlUtil } from '../system/util/xml-util';
import { Attributes } from './attributes';
import { GameObject, ObjectContext } from './game-object';
import { ObjectFactory } from './object-factory';

export interface XmlAttributes extends GameObject {
  toAttributes(): Attributes;
  parseAttributes(attributes: NamedNodeMap);
}

export interface InnerXml extends GameObject {
  innerXml(): string;
  parseInnerXml(element: Element);
}

export class ObjectSerializer {
  private static _instance: ObjectSerializer
  static get instance(): ObjectSerializer {
    if (!ObjectSerializer._instance) ObjectSerializer._instance = new ObjectSerializer();
    return ObjectSerializer._instance;
  }

  private constructor() {
    console.log('ObjectSerializer ready...');
  };

  toXml(gameObject: GameObject): string {
    let xml = '';
    let attributes = 'toAttributes' in gameObject ? (<XmlAttributes>gameObject).toAttributes() : ObjectSerializer.toAttributes(gameObject.toContext().syncData);
    let tagName = gameObject.aliasName;

    let attrStr = '';
    for (let name in attributes) {
      let attribute = XmlUtil.encodeEntityReference(attributes[name] + '');
      if (attribute == null) continue;
      attrStr += ' ' + name + '="' + attribute + '"';
    }
    xml += `<${tagName + attrStr}>`;
    xml += 'innerXml' in gameObject ? (<InnerXml>gameObject).innerXml() : '';
    xml += `</${tagName}>`;
    return xml;
  }

  static toAttributes(syncData: Object): Attributes {
    let attributes = {};
    for (let syncVar in syncData) {
      let item = syncData[syncVar];
      let key = syncVar;
      let childAttr = ObjectSerializer.make2Attributes(item, key);
      for (let name in childAttr) {
        attributes[name] = childAttr[name];
      }
    }
    return attributes;
  }

  private static make2Attributes(item: any, key: string): Attributes {
    let attributes = {};
    if (Array.isArray(item)) {
      let arrayAttributes = ObjectSerializer.array2attributes(item, key);
      for (let name in arrayAttributes) {
        attributes[name] = arrayAttributes[name];
      }
    } else if (typeof item === 'object') {
      let objAttributes = ObjectSerializer.object2attributes(item, key);
      for (let name in objAttributes) {
        attributes[name] = objAttributes[name];
      }
    } else {
      attributes[key] = item;
    }
    return attributes;
  }

  private static object2attributes(obj: any, rootKey: string): Attributes {
    let attributes = {};
    for (let objKey in obj) {
      let item = obj[objKey];
      let key = rootKey + '.' + objKey;
      let childAttr = ObjectSerializer.make2Attributes(item, key);
      for (let name in childAttr) {
        attributes[name] = childAttr[name];
      }
    }
    return attributes;
  }

  private static array2attributes(array: Array<any>, rootKey: string): Attributes {
    let attributes = {};
    let length = array.length;
    for (let i = 0; i < length; i++) {
      let item = array[i];
      let key = rootKey + '.' + i;
      let childAttr = ObjectSerializer.make2Attributes(item, key);
      for (let name in childAttr) {
        attributes[name] = childAttr[name];
      }
    }
    return attributes;
  }

  parseXml(xml: string | Element): GameObject {
    let xmlElement: Element = null;
    if (typeof xml === 'string') {
      xmlElement = XmlUtil.xml2element(xml);
    } else {
      xmlElement = xml;
    }
    if (!xmlElement) {
      console.error('xmlElementが空です');
      return null;
    }

    let gameObject: GameObject = ObjectFactory.instance.create(xmlElement.tagName);
    if (!gameObject) return null;

    if ('parseAttributes' in gameObject) {
      (<XmlAttributes>gameObject).parseAttributes(xmlElement.attributes);
    } else {
      let context: ObjectContext = gameObject.toContext();
      ObjectSerializer.parseAttributes(context.syncData, xmlElement.attributes);
      gameObject.apply(context);
    }

    gameObject.initialize();
    if ('parseInnerXml' in gameObject) {
      (<InnerXml>gameObject).parseInnerXml(xmlElement);
    }
    return gameObject;
  }

  static parseAttributes(syncData: Object, attributes: NamedNodeMap): Object {
    let length = attributes.length;
    for (let i = 0; i < length; i++) {
      let value = attributes[i].value;
      value = XmlUtil.decodeEntityReference(value);

      let split: string[] = attributes[i].name.split('.');
      let key: string | number = split[0];
      let obj: Object | Array<any> = syncData;

      if (1 < split.length) {
        ({ obj, key } = ObjectSerializer.attributes2object(split, obj, key));
      }

      let type = typeof obj[key];
      if (type !== 'string' && obj[key] != null) {
        value = JSON.parse(value);
      }
      obj[key] = value;
    }
    return syncData;
  }

  private static attributes2object(split: string[], obj: Object | any[], key: string | number) {
    // 階層構造の解析 foo.bar.0="abc" 等
    // 処理として実装こそしているが、xmlの仕様としては良くないので使用するべきではない.
    let parentObj: Object | Array<any> = null;
    let length = split.length;
    for (let i = 0; i < length; i++) {
      let index = parseInt(split[i]);
      if (parentObj && !Number.isNaN(index) && !Array.isArray(obj) && Object.keys(parentObj).length) {
        parentObj[key] = [];
        obj = parentObj[key];
      }
      key = Number.isNaN(index) ? split[i] : index;
      if (i + 1 < length) {
        if (obj[key] === undefined)
          obj[key] = typeof key === 'number' ? [] : {};
        parentObj = obj;
        obj = obj[key];
      }
    }
    return { obj, key };
  }

  private static parseInnerXml(element: Element): GameObject {
    return null;
  }
}
