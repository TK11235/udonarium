import { XmlUtil } from '../system/util/xml-util';
import { Attributes } from './attributes';
import { defineSyncObject as SyncObject, defineSyncVariable as SyncVar } from './decorator-core';
import { GameObject, ObjectContext } from './game-object';
import { InnerXml, ObjectSerializer, XmlAttributes } from './object-serializer';
import { ObjectStore } from './object-store';

@SyncObject('node')
export class ObjectNode extends GameObject implements XmlAttributes, InnerXml {
  @SyncVar() value: number | string = '';
  @SyncVar() protected attributes: Attributes = {};
  @SyncVar() private parentIdentifier: string = '';
  @SyncVar() protected majorIndex: number = 0;
  @SyncVar() protected minorIndex: number = Math.random();

  get index(): number { return this.majorIndex + this.minorIndex; }
  set index(index: number) {
    this.majorIndex = index | 0;
    this.minorIndex = index - this.majorIndex;
    if (this.parent) this.parent.needsSort = true;
  }

  get parent(): ObjectNode { return ObjectStore.instance.get<ObjectNode>(this.parentIdentifier); }
  get parentId(): string { return this.parentIdentifier; }
  get parentIsAssigned(): boolean { return 0 < this.parentIdentifier.length; }
  get parentIsUnknown(): boolean { return this.parentIsAssigned && ObjectStore.instance.get(this.parentIdentifier) == null; }
  get parentIsDestroyed(): boolean { return this.parentIsAssigned && ObjectStore.instance.isDeleted(this.parentIdentifier); }

  private _children: ObjectNode[] = [];
  get children(): ObjectNode[] {
    if (this.needsSort) {
      this.needsSort = false;
      this._children.sort((a, b) => a.index - b.index);
    }
    return this._children.concat();
  }

  // TODO 名前　親Nodeの存在が未知の状態であるNode
  private static unknownNodes: { [identifier: string]: ObjectNode[] } = {};
  private needsSort: boolean = true;

  // override
  destroy() {
    super.destroy();
    for (let child of this._children.concat()) {
      child.destroy();
    }
    this._children = [];
  }

  // GameObject Lifecycle
  onStoreAdded() {
    super.onStoreAdded();
    this.initializeChildren();
  }

  // GameObject Lifecycle
  onStoreRemoved() {
    super.onStoreRemoved();
    if (this.parent) this.parent.removeChild(this);
  }

  // ObjectNode Lifecycle
  onChildAdded(child: ObjectNode) { }

  // ObjectNode Lifecycle
  onChildRemoved(child: ObjectNode) { }

  private _onChildAdded(child: ObjectNode) {
    let node: ObjectNode = this;
    while (node) {
      node.onChildAdded(child);
      node = node.parent;
      if (node === this) break;
    }
  }

  private _onChildRemoved(child: ObjectNode) {
    let node: ObjectNode = this;
    while (node) {
      node.onChildRemoved(child);
      node = node.parent;
      if (node === this) break;
    }
  }

  private initializeChildren() {
    if (ObjectNode.unknownNodes[this.identifier] == null) return;
    let objects = ObjectNode.unknownNodes[this.identifier];
    for (let object of objects) {
      if (object.parent === this) this.updateChildren(object);
    }
    if (ObjectNode.unknownNodes[this.identifier]) {
      delete ObjectNode.unknownNodes[this.identifier];
    }
  }

  private updateChildren(child: ObjectNode = this) {
    let index = this._children.indexOf(child);
    let isAdded = false;
    let isMyChild = child.parent === this;

    if (index < 0 && isMyChild) {
      this._children.push(child);
      index = this._children.length - 1;
      isAdded = true;
    } else if (0 <= index && !isMyChild) {
      this._children.splice(index, 1);
      this._onChildRemoved(child);
      return;
    } else if (index < 0 && !isMyChild) {
      return;
    }

    let childrenLength = this._children.length;
    if (!childrenLength) return;
    let prevIndex = index - 1 < 0 ? 0 : index - 1;
    let nextIndex = childrenLength - 1 < index + 1 ? childrenLength - 1 : index + 1;

    if (this._children[prevIndex].index > child.index || child.index > this._children[nextIndex].index) this.needsSort = true;
    if (isAdded) this._onChildAdded(child);
  }

  private updateIndexs() {
    let children = this.children;
    for (let i = 0; i < children.length; i++) {
      children[i].majorIndex = i;
      children[i].minorIndex = Math.random();
    }
  }

  appendChild<T extends ObjectNode>(child: T): T {
    if (child.contains(this)) return null;
    if (child.parent && child.parent !== this) child.parent.removeChild(child);

    let lastIndex = 0 < this.children.length ? this.children[this.children.length - 1].majorIndex + 1 : 0;

    child.parentIdentifier = this.identifier;
    child.majorIndex = lastIndex;
    child.minorIndex = Math.random();

    this.updateChildren(child);

    return child;
  }

  insertBefore<T extends ObjectNode>(child: T, reference: ObjectNode): T {
    if (child.contains(this)) return null;
    if (child === reference && child.parent === this) return child;

    if (child.parent && child.parent !== this) child.parent.removeChild(child);

    let index = this.children.indexOf(reference);
    if (index < 0) return this.appendChild(child);

    child.parentIdentifier = this.identifier;

    let prevIndex = 0 < index ? this.children[index - 1].index : 0;
    let diff = reference.index - prevIndex;
    let insertIndex = prevIndex + diff * (0.45 + 0.1 * Math.random());
    child.majorIndex = insertIndex | 0;
    child.minorIndex = insertIndex - child.majorIndex;

    this.updateChildren(child);
    if (diff < 1e-7) {
      this.updateIndexs();
    }

    return child;
  }

  removeChild<T extends ObjectNode>(child: T): T {
    let children = this.children;
    let index: number = children.indexOf(child);
    if (index < 0) return null;

    child.parentIdentifier = '';
    child.majorIndex = 0;
    child.minorIndex = Math.random();

    this.updateChildren(child);
    return child;
  }

  contains(child: ObjectNode): boolean {
    let parent = child.parent;
    while (parent) {
      if (parent === child) {
        console.error('あ やっべ、循環参照', child);
        return false;
      }
      if (parent === this) return true;
      parent = parent.parent;
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
    xml += XmlUtil.encodeEntityReference(this.value + '');
    for (let child of this.children) {
      xml += ObjectSerializer.instance.toXml(child);
    }
    return xml;
  };

  parseInnerXml(element: Element) {
    let children = element.children;
    let length = children.length;
    if (0 < length) {
      for (let i = 0; i < length; i++) {
        let child = ObjectSerializer.instance.parseXml(children[i]);
        if (child instanceof ObjectNode) this.appendChild(child);
      }
    } else {
      this.value = XmlUtil.decodeEntityReference(element.innerHTML);
    }
  };

  // override
  apply(context: ObjectContext) {
    let oldParent = this.parent;
    super.apply(context);
    if (oldParent && this.parent !== oldParent) oldParent.updateChildren(this);
    if (this.parent) {
      this.parent.updateChildren(this);
    } else if (this.parentIsAssigned) {
      if (!(this.parentIdentifier in ObjectNode.unknownNodes)) {
        ObjectNode.unknownNodes[this.parentIdentifier] = [];
      }
      ObjectNode.unknownNodes[this.parentIdentifier].push(this);
    }
  }
}
