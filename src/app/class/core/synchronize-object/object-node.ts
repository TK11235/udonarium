import { XmlUtil } from '../system/util/xml-util';
import { Attributes } from './attributes';
import { defineSyncObject as SyncObject, defineSyncVariable as SyncVar } from './decorator-core';
import { GameObject, ObjectContext } from './game-object';
import { markForChildrenChanged } from './object-event-extension';
import { InnerXml, ObjectSerializer, XmlAttributes } from './object-serializer';
import { ObjectStore } from './object-store';

// 親Nodeの存在が未知の子Node
const orphanNodes: { [parentIdentifier: string]: ObjectNode[] } = {};

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
  get children(): ObjectNode[] { return this.sortChildren().concat(); }

  private needsSort: boolean = false;

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
    markForChildrenChanged(this);
    let identifiers = new Set<string>();
    let node: ObjectNode = this;
    while (node) {
      if (identifiers.has(node.identifier)) break;
      identifiers.add(node.identifier);
      node.onChildAdded(child);
      node = node.parent;
    }
  }

  private _onChildRemoved(child: ObjectNode) {
    markForChildrenChanged(this);
    let identifiers = new Set<string>();
    let node: ObjectNode = this;
    while (node) {
      if (identifiers.has(node.identifier)) break;
      identifiers.add(node.identifier);
      node.onChildRemoved(child);
      node = node.parent;
    }
  }

  private initializeChildren() {
    if (orphanNodes[this.identifier] == null) return;
    let objects = orphanNodes[this.identifier];
    for (let object of objects) {
      if (object.parent === this) this.updateChildren(object);
    }
    if (orphanNodes[this.identifier]) {
      delete orphanNodes[this.identifier];
    }
  }

  private sortChildren(): ObjectNode[] {
    if (this.needsSort) {
      this.needsSort = false;
      this._children.sort((a, b) => a.index - b.index);
    }
    return this._children;
  }

  private updateChildren(child: ObjectNode = this) {
    let index = this._children.indexOf(child);
    let isAdded = false;
    let isMyChild = child.parentIdentifier === this.identifier;

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
    let children = this.sortChildren();
    for (let i = 0; i < children.length; i++) {
      children[i].majorIndex = i;
      children[i].minorIndex = Math.random();
    }
  }

  appendChild<T extends ObjectNode>(child: T): T {
    if (child.contains(this)) return null;
    let isAdded = child.parentIdentifier !== this.identifier;
    if (child.parent && isAdded) child.parent.removeChild(child);

    let children = this.sortChildren();
    let lastIndex = 0 < children.length ? children[children.length - 1].majorIndex + 1 : 0;

    child.parentIdentifier = this.identifier;
    child.majorIndex = lastIndex;
    child.minorIndex = Math.random();

    if (isAdded) {
      children.push(child);
      this._onChildAdded(child);
    }

    return child;
  }

  prependChild<T extends ObjectNode>(child: T): T {
    return this._children.length < 1 ? this.appendChild(child) : this.insertBefore(child, this.sortChildren()[0]);
  }

  insertBefore<T extends ObjectNode>(child: T, reference: ObjectNode): T {
    if (child.contains(this)) return null;
    let isAdded = child.parentIdentifier !== this.identifier;
    if (child === reference && !isAdded) return child;
    if (child.parent && isAdded) child.parent.removeChild(child);

    let children = this.sortChildren();
    let index = children.indexOf(reference);
    if (index < 0) return this.appendChild(child);

    child.parentIdentifier = this.identifier;

    let prevIndex = 0 < index ? children[index - 1].index : 0;
    let diff = reference.index - prevIndex;
    let insertIndex = prevIndex + diff * (0.45 + 0.1 * Math.random());
    child.majorIndex = insertIndex | 0;
    child.minorIndex = insertIndex - child.majorIndex;

    if (isAdded) {
      children.splice(index, 0, child);
      this._onChildAdded(child);
    } else {
      this.needsSort = true;
    }

    if (diff < 1e-7) {
      this.updateIndexs();
    }

    return child;
  }

  removeChild<T extends ObjectNode>(child: T): T {
    let index: number = this._children.indexOf(child);
    if (index < 0) return null;

    child.parentIdentifier = '';
    child.majorIndex = 0;
    child.minorIndex = Math.random();

    this._children.splice(index, 1);
    this._onChildRemoved(child);
    return child;
  }

  contains(child: ObjectNode): boolean {
    let identifiers = new Set<string>();
    let parent = child.parent;
    while (parent) {
      if (identifiers.has(parent.identifier)) {
        console.error('あ やっべ、循環参照', child);
        return false;
      }
      if (parent === this) return true;
      identifiers.add(parent.identifier);
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
      if (!(this.parentIdentifier in orphanNodes)) {
        orphanNodes[this.parentIdentifier] = [];
      }
      orphanNodes[this.parentIdentifier].push(this);
    }
  }
}
