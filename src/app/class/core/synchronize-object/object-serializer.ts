import { Attributes } from './attributes';
import { GameObject, ObjectContext } from './game-object';
import { ObjectFactory } from './object-factory';
import { XmlUtil } from './xml-util';

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
    xml += '<' + tagName + attrStr + '>';
    xml += 'innerXml' in gameObject ? (<InnerXml>gameObject).innerXml() : '';
    xml += '</' + tagName + '>';
    return xml;
  }

  static toAttributes(syncData: Object): Attributes {
    let attributes = {};
    for (let syncVar in syncData) {
      if (Array.isArray(syncData[syncVar])) {
        console.warn('Array', syncData[syncVar]);
        let arrayAttributes = ObjectSerializer.array2attributes(syncData[syncVar], syncVar);
        for (let name in arrayAttributes) {
          attributes[name] = arrayAttributes[name];
        }
      } else if (typeof syncData[syncVar] === 'object') {
        let objAttributes = ObjectSerializer.object2attributes(syncData[syncVar], syncVar);
        for (let name in objAttributes) {
          attributes[name] = objAttributes[name];
        }
      } else {
        attributes[syncVar] = syncData[syncVar];
      }
    }
    return attributes;
  }

  private static object2attributes(obj: any, rootKey: string): Attributes {
    let attributes = {};
    for (let key in obj) {
      if (Array.isArray(obj[key])) {
        let arrayAttributes = ObjectSerializer.array2attributes(obj[key], key);
        for (let name in arrayAttributes) {
          attributes[name] = arrayAttributes[name];
        }
      }
      if (typeof obj[key] === 'object') {
        let childAttributes = ObjectSerializer.object2attributes(obj[key], key);
        for (let name in childAttributes) {
          attributes[name] = childAttributes[name];
        }
      } else {
        attributes[rootKey + '.' + key] = obj[key];
      }
    }
    return attributes;
  }

  private static array2attributes(array: Array<any>, rootKey: string): Attributes {
    let attributes = {};
    for (let i = 0; i < array.length; i++) {
      let item = array[i];
      let key = rootKey + '.' + i;
      if (Array.isArray(item)) {
        let arrayAttributes = ObjectSerializer.array2attributes(item, key);
        for (let name in arrayAttributes) {
          attributes[name] = arrayAttributes[name];
        }
      } else if (typeof item === 'object') {
        let childAttributes = ObjectSerializer.object2attributes(item, key);
        for (let name in childAttributes) {
          attributes[name] = childAttributes[name];
        }
      } else {
        attributes[key] = item;
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
    for (let i = 0; i < attributes.length; i++) {
      let value = attributes[i].value;
      value = XmlUtil.decodeEntityReference(value);

      let split: string[] = attributes[i].name.split('.');
      let key: string | number = split[0];
      let obj: Object | Array<any> = syncData;
      let parentObj: Object | Array<any> = null;

      if (1 < split.length) {
        // 階層構造の解析 foo.bar.0="abc" 等
        // 処理として実装こそしているが、xmlの仕様としては良くないので使用するべきではない.
        for (let j = 0; j < split.length; j++) {
          let index = parseInt(split[j]);
          if (parentObj && !Number.isNaN(index) && !Array.isArray(obj) && Object.keys(parentObj).length) {
            parentObj[key] = [];
            obj = parentObj[key];
          }
          key = Number.isNaN(index) ? split[j] : index;
          if (j + 1 < split.length) {
            if (obj[key] === undefined) obj[key] = typeof key === 'number' ? [] : {};
            parentObj = obj;
            obj = obj[key];
          }
        }
      }

      let type = typeof obj[key];
      if (type !== 'string' && obj[key] != null) {
        let json = JSON.parse(value);
        value = json;
      }
      obj[key] = value;
    }
    return syncData;
  }

  private static parseInnerXml(element: Element): GameObject {
    return null;
  }
}
