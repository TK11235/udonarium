import { SyncObject, SyncVar } from './anotation';
import { GameObject, ObjectContext } from './game-object';
import { ObjectStore } from './object-store';
import { ObjectFactory, Type } from './object-factory';
import { ObjectSerializer, XmlAttributes, InnerXml } from './object-serializer';
import { Attributes } from './attributes';
import { EventSystem } from '../system/system';


//ERROR in Error encountered resolving symbol values statically. の対応 Export
//循環参照回避
export function _SyncObject(alias: string) {
  return <T extends GameObject>(constructor: Type<T>) => {
    ObjectFactory.instance.register(constructor, alias);
  }
}
//循環参照回避
export function _SyncVar() {
  return <T extends GameObject>(target: T, key: string | symbol) => {
    function getter() {
      return this.context.syncData[key];
    }

    function setter(value: any) {
      this.context.syncData[key] = value;
      this.update();
    }

    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  }
}

@_SyncObject('node')
export class ObjectNode extends GameObject implements XmlAttributes, InnerXml {
  @_SyncVar() value: number | string = '';
  @_SyncVar() attributes: Attributes = {};
  @_SyncVar() private parentIdentifier: string = '';
  @_SyncVar() protected majorIndex: number = 0;
  @_SyncVar() protected minorIndex: number = Math.random();

  get index(): number { return this.majorIndex + this.minorIndex; }
  set index(index: number) {
    this.majorIndex = index | 0;
    this.minorIndex = index - this.majorIndex;
    if (this.parent) this.parent.isNeedSort = true;
  }

  get parent(): ObjectNode { return ObjectStore.instance.get<ObjectNode>(this.parentIdentifier); }
  private _children: ObjectNode[] = [];
  get children(): ObjectNode[] {
    if (this.isNeedSort) {
      this.isNeedSort = false;
      this._children.sort((a, b) => {
        if (a.index < b.index) return -1;
        if (a.index > b.index) return 1;
        return 0;
      });
    }
    return this._children.concat();
  }

  // TODO 名前　親Nodeの存在が未知の状態であるNode
  private static unknownNodes: { [identifier: string]: ObjectNode[] } = {};
  private isNeedSort: boolean = true;

  initialize(needUpdate: boolean = true) {
    super.initialize(needUpdate);
    this.initializeChildren();
  }

  destroy() {
    if (this.parent) this.parent.removeChild(this);
    super.destroy();
    for (let child of this.children) {
      child.destroy();
    }
  }

  private initializeChildren() {
    if (ObjectNode.unknownNodes[this.identifier] == null) return;
    let objects = ObjectNode.unknownNodes[this.identifier];
    for (let object of objects.concat()) {
      if (object.parent === this) {
        this.updateChildren(object);
        objects.splice(objects.indexOf(object), 1);
      } else if (object.parent) {
        objects.splice(objects.indexOf(object), 1);
      }
    }
    if (ObjectNode.unknownNodes[this.identifier]) {
      delete ObjectNode.unknownNodes[this.identifier];
    }
  }

  private updateChildren(child: ObjectNode = this) {
    let index = this._children.indexOf(child);

    if (index < 0 && child.parent === this) this._children.push(child);
    if (0 <= index && child.parent !== this) {
      this._children.splice(index, 1);
      return;
    }

    if (!this._children.length) return;
    if (index < 0) index = this._children.indexOf(child);
    let prevIndex = index - 1 < 0 ? 0 : index - 1;
    let nextIndex = this._children.length - 1 < index + 1 ? this._children.length - 1 : index + 1;

    if (this._children[prevIndex].index <= child.index && child.index <= this._children[nextIndex].index) return;
    this.isNeedSort = true;
  }

  private updateIndexs() {
    for (let i = 0; i < this._children.length; i++) {
      this._children[i].majorIndex = i;
      this._children[i].minorIndex = Math.random();
    }
  }

  appendChild(child: ObjectNode): ObjectNode {
    if (this.hasParent(child)) return null;

    if (child.parent) child.parent.removeChild(child);

    let lastIndex = 0 < this.children.length ? this.children[this.children.length - 1].majorIndex + 1 : 0;

    child.parentIdentifier = this.identifier;
    child.majorIndex = lastIndex;
    child.minorIndex = Math.random();

    if (child.parent) {
      child.parent.updateChildren(child);
    }

    child.update();
    return child;
  }

  insertBefore(child: ObjectNode, reference: ObjectNode): ObjectNode {
    if (this.hasParent(child)) return null;
    if (child === reference && child.parent === this) return child;

    if (child.parent) child.parent.removeChild(child);

    let index = this.children.indexOf(reference);
    if (index < 0) return this.appendChild(child);

    child.parentIdentifier = this.identifier;
    this._children.splice(index, 0, child);

    if (child.parent) {
      child.parent.updateIndexs();
      child.parent.updateChildren(child);
    }

    child.update();
    return child;
  }

  removeChild(child: ObjectNode): ObjectNode {
    let children = this.children;
    let index: number = children.indexOf(child);
    if (index < 0) return null;

    let oldParent = child.parent;

    child.parentIdentifier = '';
    child.majorIndex = 0;
    child.minorIndex = Math.random();

    if (oldParent) {
      oldParent.updateChildren(child);
    }
    child.update();
    return child;
  }

  hasParent(object: ObjectNode): boolean {
    return this._hasParent(object, this);
  }

  private _hasParent(object: ObjectNode, start: ObjectNode): boolean {
    let parent = this.parent;
    if (parent === start) {
      console.error('あ やっべ、循環参照', object);
      return true;
    }
    if (!parent || !object) return false;
    if (parent === object) return true;
    return parent ? parent._hasParent(object, start) : false;
  }

  hasChild(object: ObjectNode): boolean {
    return this._hasChild(object, this);
  }

  private _hasChild(object: ObjectNode, start: ObjectNode): boolean {
    for (let child of this.children) {
      if (child === start) {
        console.error('あ やっべ、循環参照', object);
        return true;
      }
      if (child === object || child._hasChild(object, start)) {
        return true;
      }
    }
    return false;
  }

  setAttribute(name: string, value: number | string) {
    this.attributes[name] = value;
    this.update();
  }

  getAttribute(name: string): string {
    if (this.attributes[name] == null) {
      return '';
    }
    return <string>this.attributes[name];
  }

  removeAttribute(name: string) {
    delete this.attributes[name];
    this.update();
  }

  toAttributes(): Attributes {
    return ObjectSerializer.toAttributes(this.attributes);
  };

  parseAttributes(attributes: NamedNodeMap) {
    ObjectSerializer.parseAttributes(this.attributes, attributes);
  };

  innerXml(): string {
    let xml = '';
    xml += (this.value + '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    for (let child of this.children) {
      xml += ObjectSerializer.instance.toXml(child);
    }
    return xml;
  };

  parseInnerXml(element: Element) {
    let children = element.children;
    if (0 < children.length) {
      for (let i = 0; i < children.length; i++) {
        let child = ObjectSerializer.instance.parseXml(children[i]);
        if (child instanceof ObjectNode) this.appendChild(child);
      }
    } else {
      this.value = element.innerHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#34;/g, '"').replace(/&amp;/g, '&');
    }
  };

  // override
  apply(context: ObjectContext) {
    let oldParent = this.parent;
    super.apply(context);
    if (oldParent && this.parent !== oldParent) oldParent.updateChildren(this);
    if (this.parent) {
      this.parent.updateChildren(this);
    } else if (0 < this.parentIdentifier.length) {
      if (!(this.parentIdentifier in ObjectNode.unknownNodes)) {
        ObjectNode.unknownNodes[this.parentIdentifier] = [];
      }
      ObjectNode.unknownNodes[this.parentIdentifier].push(this);
    }
  }
}
