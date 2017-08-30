import { GameObject, ObjectContext } from './game-object';
import { ObjectFactory } from './object-factory';
import { EventSystem } from '../system/system';
import { Attributes } from './attributes';

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
      let attribute = (attributes[name] + '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (attribute == null) continue;
      attrStr += ' ' + name + '="' + attribute + '"';
    }
    xml += '<' + tagName + attrStr + '>';
    xml += 'innerXml' in gameObject ? (<InnerXml>gameObject).innerXml() : '';
    xml += '</' + tagName + '>';
    return xml;
  }

  static toAttributes(syncData: Object): Attributes {
    let attributes = {};//document.createElement('div').attributes;
    for (let syncVar in syncData) {
      if (typeof syncData[syncVar] === 'object') {
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
    let attributes = {};//document.createElement('div').attributes;
    for (let key in obj) {
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

  parseXml(xml: string | Element): GameObject {
    let xmlElement: Element = null;
    if (typeof xml === 'string') {
      xmlElement = ObjectSerializer.xml2element(xml);
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

    //console.log('' + gameObject.identifier, gameObject);
    gameObject.initialize();
    if ('parseInnerXml' in gameObject) {
      (<InnerXml>gameObject).parseInnerXml(xmlElement);
    }
    return gameObject;
  }

  static parseAttributes(syncData: Object, attributes: NamedNodeMap): Object {
    for (let i = 0; i < attributes.length; i++) {
      let value = attributes[i].value;
      value = value.replace(/&#34;/g, '"');
      /* */
      let split = attributes[i].name.split('.');
      let key = split[0];
      let obj = syncData;
      if (1 < split.length) {
        for (let j = 0; j < split.length; j++) {
          if (split.length <= j + 1) {
            key = split[j];
          } else {
            if (obj[split[j]] === undefined) obj[split[j]] = {};
            obj = obj[split[j]];
          }
        }
      }
      /* */
      let type = typeof obj[key];
      if (type !== 'string' && obj[key] != null) {
        //try {
        let json = JSON.parse(value);
        value = json;
        //} catch (error) {
        //  console.warn(error, value);
        //}
      }
      //console.log('value is ' + typeof obj[key], value);
      obj[key] = value;
    }
    return syncData;
  }

  private static xml2element(xml: string) {
    let domParser: DOMParser = new DOMParser();
    let xmlDocument: Document = null;
    try {
      xmlDocument = domParser.parseFromString(xml, 'application/xml');
      if (xmlDocument.getElementsByTagName('parsererror').length) {
        xmlDocument = null;
      }
    } catch (error) {
      console.error(error);
    }
    if (!xmlDocument) {
      console.error('XMLのパースに失敗しました');
      return null;
    }
    return xmlDocument.documentElement;
  }

  private static parseInnerXml(element: Element): GameObject {
    return null;
  }
}
setTimeout(function () { ObjectSerializer.instance; }, 0);