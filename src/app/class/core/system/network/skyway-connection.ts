import * as MessagePack from 'msgpack-lite';

import { compressAsync, decompressAsync } from '../util/compress';
import { setZeroTimeout } from '../util/zero-timeout';
import { Connection, ConnectionCallback } from './connection';
import { PeerContext } from './peer-context';
import { SkyWayDataConnection } from './skyway-data-connection';

// @types/skywayを使用すると@types/webrtcが定義エラーになるので代替定義
declare var Peer;
declare module PeerJs {
  export type Peer = any;
  export type DataConnection = any;
}

interface DataContainer {
  data: Uint8Array;
  peers?: string[];
  ttl: number;
  isCompressed?: boolean;
}

export class SkyWayConnection implements Connection {
  get peerId(): string { return this.peerContext ? this.peerContext.peerId : '???'; }

  private _peerIds: string[] = [];
  get peerIds(): string[] { return this._peerIds }

  peerContext: PeerContext;
  readonly peerContexts: PeerContext[] = [];
  readonly callback: ConnectionCallback = new ConnectionCallback();
  bandwidthUsage: number = 0;

  private key: string = '';
  private peer: PeerJs.Peer;
  private connections: SkyWayDataConnection[] = [];

  private listAllPeersCache: string[] = [];
  private httpRequestInterval: number = performance.now() + 500;

  private queue: Promise<any> = Promise.resolve();

  private relayingPeerIds: Map<string, string[]> = new Map();
  private maybeUnavailablePeerIds: Set<string> = new Set();

  open(peerId: string)
  open(userId: string, roomId: string, roomName: string, password: string)
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

    let conn: SkyWayDataConnection = new SkyWayDataConnection(this.peer.connect(peerId, {
      serialization: 'none',
      metadata: { sendFrom: this.peerId }
    }));

    this.openDataConnection(conn);
    return true;
  }

  private shouldConnect(peerId: string): boolean {
    if (!this.peerContext || !this.peer || !this.peerId) {
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
      ttl: 1
    }

    let byteLength = container.data.byteLength;
    this.bandwidthUsage += byteLength;
    this.queue = this.queue.then(() => new Promise((resolve, reject) => {
      setZeroTimeout(async () => {
        if (1 * 1024 < container.data.byteLength) {
          let compressed = await compressAsync(container.data);
          if (compressed.byteLength < container.data.byteLength) {
            container.data = compressed;
            container.isCompressed = true;
          }
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
    for (let conn of this.connections) {
      if (conn.open) conn.send(container);
    }
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
    let peer = new Peer(this.peerContext.peerId, { key: this.key });// SkyWay
    peer.on('open', id => {
      console.log('My peer ID is: ' + id);
      if (!this.peerContext || this.peerContext.peerId !== id) {
        this.peerContext = PeerContext.parse(id);
      }
      this.peerContext.isOpen = true;
      console.log('My peer Context', this.peerContext);
      if (this.callback.onOpen) this.callback.onOpen(this.peerId);
    });

    peer.on('connection', conn => {
      this.openDataConnection(new SkyWayDataConnection(conn));
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

  private openDataConnection(conn: SkyWayDataConnection) {
    if (this.addDataConnection(conn) === false) return;

    let index = this.connections.indexOf(conn);
    let context: PeerContext = null;
    if (0 <= index) context = this.peerContexts[index];

    this.maybeUnavailablePeerIds.add(conn.remoteId);
    conn.on('data', data => {
      this.onData(conn, data);
    });
    conn.on('open', () => {
      this.maybeUnavailablePeerIds.delete(conn.remoteId);
      if (context) context.isOpen = true;
      this.updatePeerList();
      if (this.callback.onConnect) this.callback.onConnect(conn.remoteId);
    });
    conn.on('close', () => {
      this.closeDataConnection(conn);
      if (this.callback.onDisconnect) this.callback.onDisconnect(conn.remoteId);
    });
    conn.on('error', err => {
      this.closeDataConnection(conn);
      if (this.callback.onError) this.callback.onError(conn.remoteId, err);
    });
  }

  private closeDataConnection(conn: SkyWayDataConnection) {
    conn.close();
    let index = this.connections.indexOf(conn);
    if (0 <= index) {
      console.log(conn.remoteId + ' is えんいー' + 'index:' + index + ' length:' + this.connections.length);
      this.connections.splice(index, 1);
      this.peerContexts.splice(index, 1);
    }
    this.relayingPeerIds.delete(conn.remoteId);
    this.relayingPeerIds.forEach(peerIds => {
      let index = peerIds.indexOf(conn.remoteId);
      if (0 <= index) peerIds.splice(index, 1);
    });
    console.log('<close()> Peer:' + conn.remoteId + ' length:' + this.connections.length + ':' + this.peerContexts.length);
    this.updatePeerList();
  }

  private addDataConnection(conn: SkyWayDataConnection): boolean {
    let existConn = this.findDataConnection(conn.remoteId);
    if (existConn !== null) {
      console.log('add() is Fail. ' + conn.remoteId + ' is already connecting.');
      if (existConn !== conn) {
        if (existConn.metadata.sendFrom < conn.metadata.sendFrom) {
          this.closeDataConnection(conn);
        } else {
          this.closeDataConnection(existConn);
          this.addDataConnection(conn);
          return true;
        }
      }
      return false;
    }
    this.connections.push(conn);
    this.peerContexts.push(PeerContext.parse(conn.remoteId));
    console.log('<add()> Peer:' + conn.remoteId + ' length:' + this.connections.length);
    return true;
  }

  private findDataConnection(peerId: string): SkyWayDataConnection {
    for (let conn of this.connections) {
      if (conn.remoteId === peerId) {
        return conn;
      }
    }
    return null;
  }

  private onData(conn: SkyWayDataConnection, container: DataContainer) {
    if (container.peers && 0 < container.peers.length) this.onUpdatePeerList(conn, container);
    if (0 < container.ttl) this.onRelay(conn, container);
    if (this.callback.onData) {
      let byteLength = container.data.byteLength;
      this.bandwidthUsage += byteLength;
      this.queue = this.queue.then(() => new Promise((resolve, reject) => {
        setZeroTimeout(async () => {
          let data = container.isCompressed ? await decompressAsync(container.data) : container.data;
          this.callback.onData(conn.remoteId, MessagePack.decode(data));
          this.bandwidthUsage -= byteLength;
          return resolve();
        });
      }));
    }
  }

  private onRelay(conn: SkyWayDataConnection, container: DataContainer) {
    container.ttl--;

    let relayingPeerIds: string[] = this.relayingPeerIds.get(conn.remoteId);
    if (relayingPeerIds == null) return;

    for (let peerId of relayingPeerIds) {
      let conn = this.findDataConnection(peerId);
      if (conn && conn.open) {
        console.log('<' + peerId + '> 転送しなきゃ・・・');
        conn.send(container);
      }
    }
  }

  private onUpdatePeerList(conn: SkyWayDataConnection, container: DataContainer) {
    let relayingPeerIds: string[] = [];
    let unknownPeerIds: string[] = [];

    let diff = diffArray(this._peerIds, container.peers);
    relayingPeerIds = diff.diff1;
    unknownPeerIds = diff.diff2;
    this.relayingPeerIds.set(conn.remoteId, relayingPeerIds);
    container.peers = container.peers.concat(relayingPeerIds);

    if (unknownPeerIds.length) {
      for (let peerId of unknownPeerIds) {
        if (!this.maybeUnavailablePeerIds.has(peerId) && this.connect(peerId)) {
          console.log('auto connect to unknown Peer <' + peerId + '>');
        }
      }
    }
  }

  private updatePeerList(): string[] {
    let peerIds: string[] = [];
    for (let conn of this.connections) {
      if (conn.open) peerIds.push(conn.remoteId);
    }
    peerIds.push(this.peerId);
    peerIds.sort(function (a, b) {
      if (a > b) return 1;
      if (a < b) return -1;
      return 0;
    });

    this._peerIds = peerIds;

    console.log('<update()>', peerIds);
    this.notifyPeerList();
    return peerIds;
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

  private getSkyWayErrorMessage(errType: string): string {
    switch (errType) {
      case 'peer-unavailable':
        return 'そのPeer IDは利用できません。'
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

function diffArray<T>(array1: T[], array2: T[]): { diff1: T[], diff2: T[] } {
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
