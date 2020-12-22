import { PromiseQueue } from '../core/system/util/promise-queue';

interface PeerHistory {
  peerId: string,
  timestamp: number,
  history: string[]
}

// 試験実装中
export class Database {
  private static DB_NAME: string = 'UdonariumDataBase';
  private static VERSION: number = 1;

  private queue: PromiseQueue = new PromiseQueue('DatabaseQueue');
  private db: IDBDatabase;

  constructor() {
    this.openDB(Database.DB_NAME, Database.VERSION);
  }

  private openDB(dbName: string, version: number): Promise<IDBDatabase> {
    return this.queue.add((resolve, reject) => {
      console.log('openDB');
      let request = indexedDB.open(dbName, version);
      request.onerror = (event) => {
        console.error(request.error, event);
        if (request.error.name === 'VersionError') {
          indexedDB.deleteDatabase(dbName);
          this.openDB(dbName, version);
        }
        // request.errorCode に対して行うこと!
        resolve();
      };
      request.onblocked = (event) => {
        console.warn('openDB onblocked');
        // 他のタブがデータベースを読み込んでいる場合は、処理を進める前に
        // それらを閉じなければなりません。
        alert('このサイトを開いている他のタブをすべて閉じてください!');
      };
      request.onupgradeneeded = (event) => {
        console.log('openDB onupgradeneeded');
        this.initializeDB(request.result);
        this.createStores();
      };
      request.onsuccess = (event) => {
        console.log('openDB onsuccess');
        this.initializeDB(request.result);
        resolve();
      };
    });
  }

  private createStores() {
    console.log('createStores');
    if (this.db.objectStoreNames.contains('PeerHistory')) {
      this.db.deleteObjectStore('PeerHistory');
    }
    let objectStore = this.db.createObjectStore('PeerHistory', { keyPath: 'peerId' });
    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
    // データを追加する前に objectStore の作成を完了させるため、 
    // transaction oncomplete を使用します。
    objectStore.transaction.oncomplete = (event) => {
      console.log('createStores oncomplete');
      // 新たに作成した objectStore に値を保存します。
      /*
      var customerObjectStore = db.transaction("customers", "readwrite").objectStore("customers");
      for (var i in customerData) {
        customerObjectStore.add(customerData[i]);
      }
      */
    };
  }

  private initializeDB(db: IDBDatabase) {
    console.log('initializeDB');
    // 別のページがバージョン変更を求めた場合に、通知されるようにするためのハンドラを追加するようにしてください。
    // データベースを閉じなければなりません。データベースを閉じると、別のページがデータベースをアップグレードできます。
    // これを行わなければ、ユーザがタブを閉じるまでデータベースはアップグレードされません。
    db.onversionchange = (event) => {
      console.warn('db.onversionchange.');
      db.close();
      alert('新しいバージョンのページが使用可能になりました。再読み込みしてください!');
    };
    db.onabort = (event) => {
      console.error(event);
    };
    db.onerror = (event) => {
      console.error(event);
    };
    this.db = db;
    // データベースを使用する処理
  }

  addPeerHistory(myPeerId: string, otherPeerIds: string[]) {
    this.queue.add((resolve, reject) => {
      console.log('addPeerHistory');
      let transaction = this.db.transaction(['PeerHistory'], 'readwrite');
      let store = transaction.objectStore('PeerHistory');

      transaction.oncomplete = (event) => {
        console.log('addPeerHistory done.', 'readwrite');
        resolve();
      };

      transaction.onerror = (event) => {
        console.error(event);
        resolve();
      };

      let history: PeerHistory = {
        peerId: myPeerId,
        timestamp: Date.now(),
        history: otherPeerIds
      }

      store.put(history);
    });
  }

  deletePeerHistory(peerId: string) {
    this.queue.add((resolve, reject) => {
      let transaction = this.db.transaction(['PeerHistory'], 'readwrite');
      let store = transaction.objectStore('PeerHistory');
      transaction.oncomplete = (event) => {
        console.log('addPeerHistory done.', 'readwrite');
        resolve();
      };

      transaction.onerror = (event) => {
        console.error(event);
        resolve();
      };

      store.delete(peerId);
    });
  }

  getPeerHistory(): Promise<PeerHistory[]> {
    return this.queue.add((resolve, reject) => {
      console.log('getPeerHistory');
      let transaction = this.db.transaction(['PeerHistory'], 'readonly');
      let store = transaction.objectStore('PeerHistory');
      let request = store.openCursor();
      let history: PeerHistory[] = [];

      transaction.oncomplete = (event) => {
        console.log('getPeerHistory done.');
        resolve(history);
      };

      transaction.onerror = (event) => {
        console.error(event);
        resolve(history);
      };

      request.onerror = (event) => {
        console.error(event);
        resolve(history);
      };

      request.onsuccess = (event) => {
        let cursor: IDBCursorWithValue = request.result;
        if (cursor) {
          console.log('id:' + cursor.key + ' value:', cursor.value);
          history.push(cursor.value);
          cursor.continue();
        } else {
          console.log('Entries all displayed.');
        }
      };
    });
  }
}