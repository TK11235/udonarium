// 試験実装中
export class Database<T> {
  readonly version: number = 1;
  readonly databaseName: string;
  readonly storeName: string;

  private openDBPromise: Promise<IDBDatabase>;

  constructor(name: string) {
    this.databaseName = `Udonarium-IDB-${name}`;
    this.storeName = 'ObjectStore';
    this.open();
  }

  async open(): Promise<IDBDatabase> {
    if (this.openDBPromise) return this.openDBPromise;

    let openFunc = async () => {
      let request = indexedDB.open(this.databaseName, this.version);
      request.onblocked = event => {
        console.warn('request.onblocked');
        // 他のタブがデータベースを読み込んでいる場合は、処理を進める前に
        // それらを閉じなければなりません。
        //alert('このサイトを開いている他のタブをすべて閉じてください!');
      };
      request.onupgradeneeded = event => {
        console.log('request.onupgradeneeded');
        this.createObjectStore(request.result);
      };

      try {
        let database = await this.waitFor(request);
        return this.initializeDB(database);
      } catch (e) {
        console.error(e);
        if (request.error.name === 'VersionError') {
          console.log(`recreate <${this.databaseName}>`);
          try {
            await this.waitFor(indexedDB.deleteDatabase(this.databaseName));
          } catch (e) {
            console.warn(e);
          }
          return await openFunc();
        }
        throw e;
      }
    };
    this.openDBPromise = openFunc();
    return this.openDBPromise;
  }

  async close() {
    if (!this.openDBPromise) return;
    try {
      let database = await this.open();
      database.close();
      this.openDBPromise = null;
    } catch (e) {
      console.error(e);
    }
  }

  private async createObjectStore(database: IDBDatabase) {
    if (database.objectStoreNames.contains(this.storeName)) {
      database.deleteObjectStore(this.storeName);
    }
    database.createObjectStore(this.storeName);
  }

  private initializeDB(database: IDBDatabase): IDBDatabase {
    // 別のページがバージョン変更を求めた場合に、通知されるようにするためのハンドラを追加するようにしてください。
    // データベースを閉じなければなりません。データベースを閉じると、別のページがデータベースをアップグレードできます。
    // これを行わなければ、ユーザがタブを閉じるまでデータベースはアップグレードされません。
    database.onversionchange = event => {
      console.warn('database.onversionchange.');
      database.close();
      this.openDBPromise = null;
      //alert('新しいバージョンのページが使用可能になりました。再読み込みしてください!');
    };
    database.onabort = database.onerror = event => console.error(event);
    return database;
  }

  async getObjectStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    let database = await this.open();
    let transaction = database.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  async get(key: IDBValidKey): Promise<T> {
    try {
      let store = await this.getObjectStore('readonly');
      let request = store.get(key);
      return await this.waitFor<T>(request);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async put(key: IDBValidKey, value: T): Promise<IDBValidKey> {
    try {
      let store = await this.getObjectStore('readwrite');
      let request = store.put(value, key);
      return await this.waitFor(request);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async delete(key: IDBValidKey): Promise<void> {
    try {
      let store = await this.getObjectStore('readwrite');
      let request = store.delete(key);
      return await this.waitFor(request);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async getAll(): Promise<T[]> {
    try {
      let store = await this.getObjectStore('readonly');
      let request = store.getAll();
      return await this.waitFor<T[]>(request);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async getAllKeys(): Promise<IDBValidKey[]> {
    try {
      let store = await this.getObjectStore('readonly');
      let request = store.getAllKeys();
      return await this.waitFor(request);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private waitFor(transaction: IDBTransaction): Promise<void>
  private waitFor<T>(request: IDBRequest<T>): Promise<T>
  private waitFor(arg: IDBTransaction | IDBRequest<any>): Promise<any> {
    if (arg instanceof IDBTransaction) {
      return new Promise((resolve, reject) => {
        arg.oncomplete = event => resolve(null);
        arg.onerror = arg.onabort = event => reject(arg.error);
      });
    } else {
      return new Promise((resolve, reject) => {
        arg.onsuccess = event => resolve(arg.result);
        arg.onerror = event => reject(arg.error);
      });
    }
  }
}
