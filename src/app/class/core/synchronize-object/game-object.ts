import { ObjectFactory } from './object-factory';
import { ObjectSerializer } from './object-serializer';
import { ObjectStore } from './object-store';
import { UUID } from './uuid';

export interface ObjectContext {
  aliasName: string;
  identifier: string;
  majorVersion: number;
  minorVersion: number;
  syncData: Object;
}

export class GameObject {
  private context: ObjectContext = {
    aliasName: (<typeof GameObject>this.constructor).aliasName,
    identifier: '',
    majorVersion: 0,
    minorVersion: 0,
    syncData: {}
  }

  static get aliasName() { return ObjectFactory.instance.getAlias(this); }
  get aliasName() { return this.context.aliasName; }
  get identifier() { return this.context.identifier; }
  get version() { return this.context.majorVersion + this.context.minorVersion; }

  constructor(identifier: string = UUID.generateUuid()) {
    this.context.identifier = identifier;
  }

  initialize() {
    ObjectStore.instance.add(this);
  }

  destroy() {
    ObjectStore.instance.delete(this);
  }

  // GameObject Lifecycle
  onStoreAdded() { }

  // GameObject Lifecycle
  onStoreRemoved() { }

  update() {
    this.versionUp();
    ObjectStore.instance.update(this.identifier);
  }

  private versionUp() {
    this.context.majorVersion += 1;
    this.context.minorVersion = Math.random();
  }

  apply(context: ObjectContext) {
    if (context !== null && this.identifier === context.identifier) {
      this.context.majorVersion = context.majorVersion;
      this.context.minorVersion = context.minorVersion;
      this.context.syncData = context.syncData;
    }
  }

  clone(): this {
    let xmlString = this.toXml();
    return <this>ObjectSerializer.instance.parseXml(xmlString);
  }

  toContext(): ObjectContext {
    return {
      aliasName: this.context.aliasName,
      identifier: this.context.identifier,
      majorVersion: this.context.majorVersion,
      minorVersion: this.context.minorVersion,
      syncData: JSON.parse(JSON.stringify(this.context.syncData))
    }
  }

  toXml(): string {
    return ObjectSerializer.instance.toXml(this);
  }
}