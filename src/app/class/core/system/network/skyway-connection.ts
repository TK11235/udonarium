import * as JSZip from 'jszip/dist/jszip.min.js';
import * as MessagePack from 'msgpack-lite';

import { setZeroTimeout } from '../util/zero-timeout';
import { Connection, ConnectionCallback } from './connection';
import { PeerContext } from './peer-context';

// @types/skywayを使用すると@types/webrtcが定義エラーになるので代替定義
declare var Peer;
declare module PeerJs {
  export type Peer = any;
  export type DataConnection = any;
}

interface DataContainer {
  data: any;
  peers?: string[];
  ttl: number;
  isCompressed?: boolean;
}

export class SkyWayConnection implements Connection {
  get peerId(): string { return this.peerContext ? this.peerContext.fullstring : '???'; }

  private _peerIds: string[] = [];
  get peerIds(): string[] { return this._peerIds }

  peerContext: PeerContext;
  readonly peerContexts: PeerContext[] = [];
  readonly callback: ConnectionCallback = new ConnectionCallback();
  bandwidthUsage: number = 0;

  private key: string = '';
  private peer: PeerJs.Peer;
  private connections: PeerJs.DataConnection[] = [];

  private listAllPeersCache: string[] = [];
  private httpRequestInterval: number = performance.now() + 500;

  private queue: Promise<any> = Promise.resolve();

  private relayingPeerIds: Map<string, string[]> = new Map();

  open(peerId: string)
  open(peerId: string, roomId: string, roomName: string, password: string)
  open(...args: any[]) {
    console.log('open', args);
    if (args.length === 0) {
      this.peerContext = PeerContext.create(PeerContext.generateId());
    } else if (args.length === 1) {
      this.peerContext = PeerContext.create(args[0]);
    } else {
      this.peerContext = PeerContext.create(args[0], args[1], args[2], args[3]);
    }
    this.openPeer();
  }

  close() {
    if (this.peer) this.peer.destroy();
    this.disconnectAll();
    this.peer = null;
    this.peerContext = null;
  }

  connect(peerId: string): boolean {
    if (!this.shouldConnect(peerId)) return false;

    let conn: PeerJs.DataConnection = this.peer.connect(peerId, {
      metadata: { sendFrom: this.peerId }
    });

    this.openDataConnection(conn);
    return true;
  }

  private shouldConnect(peerId: string): boolean {
    if (!this.peer || !this.peerId) {
      console.log('connect() is Fail. IDが割り振られるまで待てや');
      return false;
    }

    if (this.peerId === peerId) {
      console.log('connect() is Fail. ' + peerId + ' is me.');
      return false;
    }

    if (this.findDataConnection(peerId)) {
      console.log('connect() is Fail. <' + peerId + '> is already connecting.');
      return false;
    }

    if (peerId && peerId.length && peerId !== this.peerId) return true;
    return false;
  }

  disconnect(peerId: string): boolean {
    let conn = this.findDataConnection(peerId)
    if (!conn) return false;
    this.closeDataConnection(conn);
    return true;
  }

  disconnectAll() {
    console.log('<closeAllDataConnection()>');
    for (let conn of this.connections.concat()) {
      this.closeDataConnection(conn);
    }
  }

  send(data: any, sendTo?: string) {
    if (this.connections.length < 1) return;
    let container: DataContainer = {
      data: MessagePack.encode(data),
      ttl: 0
    }

    let byteLength = container.data.length;
    this.bandwidthUsage += byteLength;
    this.queue = this.queue.then(() => new Promise((resolve, reject) => {
      setZeroTimeout(async () => {
        if (1 * 1024 < container.data.length) {
          container.isCompressed = true;
          container.data = await this.compressAsync(container.data);
        }
        if (sendTo) {
          this.sendUnicast(container, sendTo);
        } else {
          this.sendBroadcast(container);
        }
        this.bandwidthUsage -= byteLength;
        return resolve();
      });
    }));
  }

  private sendUnicast(container: DataContainer, sendTo: string) {
    container.ttl = 0;
    let conn = this.findDataConnection(sendTo);
    if (conn && conn.open) conn.send(container);
  }

  private sendBroadcast(container: DataContainer) {
    container.ttl = 1;
    for (let conn of this.connections) {
      if (conn.open) conn.send(container);
    }
  }

  private onData(conn: PeerJs.DataConnection, container: DataContainer) {
    if (0 < container.ttl) this.onRelay(conn, container);
    if (this.callback.onData) {
      let byteLength = container.data.byteLength;
      this.bandwidthUsage += byteLength;
      this.queue = this.queue.then(() => new Promise((resolve, reject) => {
        setZeroTimeout(async () => {
          let data: Uint8Array;
          if (container.isCompressed) {
            data = await this.decompressAsync(container.data);
          } else {
            data = new Uint8Array(container.data);
          }
          this.callback.onData(conn.remoteId, MessagePack.decode(data));
          this.bandwidthUsage -= byteLength;
          return resolve();
        });
      }));
    }
  }

  private onRelay(conn: PeerJs.DataConnection, container: DataContainer) {
    container.ttl--;

    let canUpdate: boolean = container.peers && 0 < container.peers.length;
    let hasRelayingList: boolean = this.relayingPeerIds.has(conn.remoteId);

    if (!canUpdate && !hasRelayingList) return;

    let relayingPeerIds: string[] = [];
    let unknownPeerIds: string[] = [];

    if (canUpdate) {
      let diff = this.diffArray(this._peerIds, container.peers);
      relayingPeerIds = diff.diff1;
      unknownPeerIds = diff.diff2;
      this.relayingPeerIds.set(conn.remoteId, relayingPeerIds);
      container.peers = container.peers.concat(relayingPeerIds);
    } else if (hasRelayingList) {
      relayingPeerIds = this.relayingPeerIds.get(conn.remoteId);
    }

    for (let peerId of relayingPeerIds) {
      let conn = this.findDataConnection(peerId);
      if (conn && conn.open) {
        console.log('<' + peerId + '> 転送しなきゃ・・・');
        conn.send(container);
      }
    }
    if (unknownPeerIds.length && this.callback.onDetectUnknownPeers) {
      for (let peerId of unknownPeerIds) {
        if (this.connect(peerId)) console.log('auto connect to unknown Peer <' + peerId + '>');
      }
      this.callback.onDetectUnknownPeers(unknownPeerIds);
    }
  }

  private add(conn: PeerJs.DataConnection): boolean {
    let existConn = this.findDataConnection(conn.remoteId);
    if (existConn !== null) {
      console.log('add() is Fail. ' + conn.remoteId + ' is already connecting.');
      if (existConn !== conn) {
        if (existConn.metadata.sendFrom < conn.metadata.sendFrom) {
          this.closeDataConnection(conn);
        } else {
          this.closeDataConnection(existConn);
          this.add(conn);
          return true;
        }
      }
      return false;
    }
    this.connections.push(conn);
    this.peerContexts.push(new PeerContext(conn.remoteId));
    console.log('<add()> Peer:' + conn.remoteId + ' length:' + this.connections.length);
    return true;
  }

  setApiKey(key: string) {
    if (this.key !== key) console.log('Key Change');
    this.key = key;
  }

  listAllPeers(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.peer) return resolve([]);
      let now = performance.now();
      if (now < this.httpRequestInterval) {
        console.warn('httpRequestInterval... ' + (this.httpRequestInterval - now));
        resolve(this.listAllPeersCache.concat());
        return;
      }
      this.httpRequestInterval = now + 6000;
      this.peer.listAllPeers((list) => {
        this.listAllPeersCache = list.concat();
        resolve(list);
      });
    });
  }

  private openPeer() {
    if (this.peer) {
      console.warn('It is already opened.');
      this.close();
    }
    let peer = new Peer(this.peerContext.fullstring, { key: this.key });// SkyWay
    peer.on('open', id => {
      console.log('My peer ID is: ' + id);
      if (!this.peerContext || this.peerContext.fullstring !== id) {
        this.peerContext = new PeerContext(id);
      }
      this.peerContext.isOpen = true;
      console.log('My peer Context', this.peerContext);
      if (this.callback.onOpen) this.callback.onOpen(this.peerId);
    });

    peer.on('connection', conn => {
      this.openDataConnection(conn);
    });

    peer.on('error', err => {
      console.error('<' + this.peerId + '> ' + err.type + ' => ' + err.message);
      let errorMessage = this.getSkyWayErrorMessage(err.type);
      errorMessage += ': ' + err.message;
      switch (err.type) {
        case 'peer-unavailable':
        case 'invalid-id':
        case 'invalid-key':
        case 'list-error':
        case 'server-error':
          break;
        case 'disconnected':
        case 'socket-error':
        default:
          if (this.peerContext && this.peerContext.isOpen) {
            if (this.callback.onClose) this.callback.onClose(this.peerId);
          }
          break;
      }
      if (this.callback.onError) this.callback.onError(this.peerId, errorMessage);
    });
    this.peer = peer;
  }

  private openDataConnection(conn: PeerJs.DataConnection) {
    if (this.add(conn) === false) return;

    let sendFrom: string = conn.metadata.sendFrom;
    if (this.callback.willOpen) this.callback.willOpen(conn.remoteId, sendFrom);

    let index = this.connections.indexOf(conn);
    let context: PeerContext = null;
    if (0 <= index) context = this.peerContexts[index];

    let timeout: NodeJS.Timer = setTimeout(() => {
      if (this.callback.onTimeout) this.callback.onTimeout(conn.remoteId);
      this.closeDataConnection(conn);
      if (this.callback.onClose) this.callback.onClose(conn.remoteId);
    }, 15000);

    conn.on('data', data => {
      this.onData(conn, data);
    });
    conn.on('open', () => {
      if (timeout !== null) clearTimeout(timeout);
      timeout = null;
      if (context) context.isOpen = true;
      this.update();
      if (this.callback.onOpen) this.callback.onOpen(conn.remoteId);
    });
    conn.on('close', () => {
      if (timeout !== null) clearTimeout(timeout);
      timeout = null;
      this.closeDataConnection(conn);
      if (this.callback.onClose) this.callback.onClose(conn.remoteId);
    });
    conn.on('error', err => {
      if (timeout !== null) clearTimeout(timeout);
      timeout = null;
      this.closeDataConnection(conn);
      if (this.callback.onError) this.callback.onError(conn.remoteId, err);
    });
  }

  private closeDataConnection(conn: PeerJs.DataConnection) {
    conn.close();
    let index = this.connections.indexOf(conn);
    if (0 <= index) {
      console.log(conn.remoteId + ' is えんいー' + 'index:' + index + ' length:' + this.connections.length);
      this.connections.splice(index, 1);
      this.peerContexts.splice(index, 1);
    }
    this.relayingPeerIds.delete(conn.remoteId);
    console.log('<close()> Peer:' + conn.remoteId + ' length:' + this.connections.length + ':' + this.peerContexts.length);
    this.update();
  }

  private findDataConnection(peerId: string): PeerJs.DataConnection {
    for (let conn of this.connections) {
      if (conn.remoteId === peerId) {
        return conn;
      }
    }
    return null;
  }

  private diffArray<T>(array1: T[], array2: T[]): { diff1: T[], diff2: T[] } {
    let diff1: T[] = [];
    let diff2: T[] = [];

    let includesInArray1: boolean = false;
    let includesInArray2: boolean = false;

    for (let item of array1.concat(array2)) {
      includesInArray1 = array1.includes(item);
      includesInArray2 = array2.includes(item);
      if (includesInArray1 && !includesInArray2) {
        diff1.push(item);
      } else if (!includesInArray1 && includesInArray2) {
        diff2.push(item);
      }
    }
    return { diff1: diff1, diff2: diff2 };
  }

  private update(): string[] {
    let peers: string[] = [];
    for (let conn of this.connections) {
      if (conn.open) peers.push(conn.remoteId);
    }
    peers.push(this.peerId);
    peers.sort(function (a, b) {
      if (a > b) return 1;
      if (a < b) return -1;
      return 0;
    });

    this._peerIds = peers;

    console.log('<update()>', peers);
    this.notifyPeerList();
    return peers;
  }

  private notifyPeerList() {
    if (this.connections.length < 1) return;
    let container: DataContainer = {
      data: MessagePack.encode([]),
      peers: this._peerIds,
      ttl: 1
    }
    this.sendBroadcast(container);
  }

  private async compressAsync(data: Buffer): Promise<Uint8Array> {
    let files: File[] = [];
    files.push(new File([data], 'data.pack', { type: 'application/octet-stream' }));

    let zip = new JSZip();
    let length = files.length;
    for (let i = 0; i < length; i++) {
      let file = files[i]
      zip.file(file.name, file);
    }

    let uint8array: Uint8Array = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 2
      }
    });

    return uint8array;
  }

  private async decompressAsync(data: Buffer | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
    let zip = new JSZip();
    try {
      zip = await zip.loadAsync(data);
    } catch (reason) {
      console.warn(reason);
      return null;
    }
    let uint8array: Uint8Array = await new Promise<Uint8Array>(
      async (resolve, reject) => {
        zip.forEach(async (relativePath, zipEntry) => {
          try {
            uint8array = await zipEntry.async('uint8array');
            resolve(uint8array);
          } catch (reason) {
            console.warn(reason);
          }
        });
      });
    return uint8array;
  }

  private getSkyWayErrorMessage(errType: string): string {
    switch (errType) {
      case 'peer-unavailable':
        return 'そのPeer IDは存在しません。'
      case 'invalid-id':
        return 'Peer IDが不正です。'
      case 'invalid-key':
        return 'SkyWay APIキーが無効です。';
      case 'list-error':
        return 'SkyWay APIキーのREST APIが許可されてません。';
      case 'server-error':
        return 'SkyWayのシグナリングサーバからPeer一覧を取得できませんでした。';
      case 'disconnected':
        return 'SkyWayのシグナリングサーバに接続されていません。';
      case 'socket-error':
        return 'SkyWayのシグナリングサーバとの接続が失われました。';
      default:
        return 'SkyWayに関する不明なエラーが発生しました(' + errType + ')';
    }
  }
}
