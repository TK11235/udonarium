import { GameObject } from './game-object';

export declare var Type: FunctionConstructor;
export interface Type<T> extends Function {
  new(...args: any[]): T;
}

export class ObjectFactory {
  private static _instance: ObjectFactory
  static get instance(): ObjectFactory {
    if (!ObjectFactory._instance) ObjectFactory._instance = new ObjectFactory();
    return ObjectFactory._instance;
  }

  private classConstructors: { [alias: string]: Type<GameObject> } = {};

  private constructor() { console.log('ObjectFactory ready...'); };

  register<T extends GameObject>(constructor: Type<T>, alias?: string) {
    if (!alias) alias = constructor.name || constructor.toString().match(/function\s*([^(]*)\(/)[1];
    console.log('addGameObjectFactory -> ' + alias);
    this.classConstructors[alias] = constructor;
  }

  create<T extends GameObject>(alias: string, identifer?: string): T {
    let classConstructor = this.classConstructors[alias];
    if (!classConstructor) {
      console.error(alias + 'という名のＧameObjectクラスは定義されていません');
      return null;
    }
    let gameObject: GameObject = new classConstructor(identifer);
    return <T>gameObject;
  }

  getAlias<T extends GameObject>(constructor: Type<T>): string
  getAlias<T extends GameObject>(object: T): string
  getAlias<T extends GameObject>(arg: any): string {
    let classConstructor: Type<T> = typeof arg === 'function' ? arg : arg.constructor;
    for (let alias in this.classConstructors) {
      if (this.classConstructors[alias] === classConstructor) return alias;
    }
    return '';
  }
}
