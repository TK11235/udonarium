import { PromiseQueue } from '../core/system/util/promise-queue';

interface PeerHistory {
  peerId: string,
  timestamp: number,
  history: string[]
}

interface NicknameHistory {
  peerId: string,
  timestamp: number,
  nickname: string
}

// 試験実装中
export class Database {
  private static DB_NAME: string = 'UdonariumDataBase';
  private static VERSION: number = 2;

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
        // 他的タブがデータベースを読み込んでいる場合は、処理を進める前に
        // それらを閉じなければなりません。
        alert('こ的サイトを開いている他的タブをすべて閉じてください!');
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

    if (this.db.objectStoreNames.contains('NicknameHistory')) {
      this.db.deleteObjectStore('NicknameHistory');
    }
    const peerObjectStore = this.db.createObjectStore('PeerHistory', { keyPath: 'peerId' });
    peerObjectStore.createIndex('timestamp', 'timestamp', { unique: false });
    // データを追加する前に objectStore の作成を完了させるため、

    // transaction oncomplete を使用します。
    peerObjectStore.transaction.oncomplete = (event) => {
      console.log('PeerHistory createStores oncomplete');
      // 新たに作成した objectStore に値を保存します。
      /*
      var customerObjectStore = db.transaction("customers", "readwrite").objectStore("customers");
      for (var i in customerData) {
        customerObjectStore.add(customerData[i]);
      }
      */
    };
    const nicknameObjectStore = this.db.createObjectStore('NicknameHistory', { keyPath: 'peerId' });
    nicknameObjectStore.createIndex('timestamp', 'timestamp', { unique: false });
    peerObjectStore.transaction.oncomplete = (event) => {
      console.log('NicknameHistory createStores oncomplete');
    };
  }

  private initializeDB(db: IDBDatabase) {
    console.log('initializeDB');
    // 別的ページがバージョン変更を求めた場合に、通知されるようにするため的ハンドラを追加するようにしてください。
    // データベースを閉じなければなりません。データベースを閉じると、別的ページがデータベースをアップグレードできます。
    // これを行わなければ、ユーザがタブを閉じるまでデータベースはアップグレードされません。
    db.onversionchange = (event) => {
      console.warn('db.onversionchange.');
      db.close();
      alert('新しいバージョン的ページが使用可能になりました。再読み込みしてください!');
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

  addPeerHistory(myPeer: string, otherPeers: string[]) {
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
        peerId: myPeer,
        timestamp: Date.now(),
        history: otherPeers
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

  addNicknameHistory(myPeer: string, nickname: string) {
    this.queue.add((resolve, reject) => {
      console.log('addNicknameHistory');
      const transaction = this.db.transaction(['NicknameHistory'], 'readwrite');
      const store = transaction.objectStore('NicknameHistory');

      transaction.oncomplete = (event) => {
        console.log('addNicknameHistory done.', 'readwrite');
        resolve();
      };

      transaction.onerror = (event) => {
        console.error(event);
        resolve();
      };

      const history: NicknameHistory = {
        peerId: myPeer,
        timestamp: Date.now(),
        nickname: nickname
      };

      store.put(history);
    });
  }

  deleteNicknameHistory(peerId: string) {
    this.queue.add((resolve, reject) => {
      const transaction = this.db.transaction(['NicknameHistory'], 'readwrite');
      const store = transaction.objectStore('NicknameHistory');
      transaction.oncomplete = (event) => {
        console.log('addNicknameHistory done.', 'readwrite');
        resolve();
      };

      transaction.onerror = (event) => {
        console.error(event);
        resolve();
      };

      store.delete(peerId);
    });
  }

  getNicknameHistory(): Promise<NicknameHistory[]> {
    return this.queue.add((resolve, reject) => {
      console.log('getNicknameHistory');
      const transaction = this.db.transaction(['NicknameHistory'], 'readonly');
      const store = transaction.objectStore('NicknameHistory');
      const request = store.openCursor();
      const history: NicknameHistory[] = [];

      transaction.oncomplete = (event) => {
        console.log('getNicknameHistory done.');
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
        const cursor: IDBCursorWithValue = request.result;
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
