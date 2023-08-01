import { ArrayUtil } from '../../util/array-util';
import { compressAsync, decompressAsync } from '../../util/compress';
import { CryptoUtil } from '../../util/crypto-util';
import { MessagePack } from '../../util/message-pack';
import { setZeroTimeout } from '../../util/zero-timeout';
import { Connection, ConnectionCallback } from '../connection';
import { IPeerContext, PeerContext } from '../peer-context';
import { IRoomInfo, RoomInfo } from '../room-info';
import { SkyWayDataConnection } from './skyway-data-connection';
import { SkyWayDataConnectionList } from './skyway-data-connection-list';

// @types/skywayを使用すると@types/webrtcが定義エラーになるので代替定義
declare var Peer;
declare module PeerJs {
  export type Peer = any;
  export type DataConnection = any;
}

interface DataContainer {
  data: Uint8Array;
  users?: string[];
  ttl: number;
  isCompressed?: boolean;
}

export class SkyWayConnection implements Connection {
  private get userIds(): string[] { return this.peers.map(peer => peer.userId).filter(userId => 0 < userId.length).concat([this.peer.userId]); }

  get peerId(): string { return this.peer.peerId; }
  get peerIds(): string[] { return this.connections.peerIds; }

  peer: PeerContext = PeerContext.parse('???');
  get peers(): PeerContext[] { return this.connections.peers; }

  readonly callback: ConnectionCallback = new ConnectionCallback();
  bandwidthUsage: number = 0;

  private key: string = '';
  private skyWay: PeerJs.Peer;
  private connections: SkyWayDataConnectionList = new SkyWayDataConnectionList();

  private listAllPeersCache: string[] = [];
  private httpRequestInterval: number = performance.now() + 500;

  private outboundQueue: Promise<any> = Promise.resolve();
  private inboundQueue: Promise<any> = Promise.resolve();

  private relayingPeerIds: Map<string, string[]> = new Map();
  private maybeUnavailablePeerIds: Set<string> = new Set();

  open(userId?: string)
  open(userId: string, roomId: string, roomName: string, password: string)
  open(...args: any[]) {
    console.log('open', args);
    if (args.length === 0) {
      this.peer = PeerContext.create(PeerContext.generateId());
    } else if (args.length === 1) {
      this.peer = PeerContext.create(args[0]);
    } else {
      this.peer = PeerContext.create(args[0], args[1], args[2], args[3]);
    }
    this.openSkyWay();
  }

  close() {
    if (this.skyWay) this.skyWay.destroy();
    this.disconnectAll();
    this.skyWay = null;
    this.peer = PeerContext.parse('???');
  }

  connect(peer: IPeerContext): boolean {
    if (!this.shouldConnect(peer.peerId)) return false;

    let conn: SkyWayDataConnection = new SkyWayDataConnection(this.skyWay.connect(peer.peerId, {
      serialization: 'none',
      metadata: {
        sortKey: this.peer.digestUserId,
        token: this.peer.isRoom ? '' : CryptoUtil.sha256Base64Url(this.peer.digestUserId + peer.userId)
      }
    }), peer);

    this.openDataConnection(conn);
    return true;
  }

  private shouldConnect(peerId: string): boolean {
    if (!this.peer || !this.skyWay || !this.peerId) {
      console.log('connect() is Fail. IDが割り振られるまで待てや');
      return false;
    }

    if (this.peerId === peerId) {
      console.log('connect() is Fail. ' + peerId + ' is me.');
      return false;
    }

    if (this.connections.find(peerId)) {
      console.log('connect() is Fail. <' + peerId + '> is already connecting.');
      return false;
    }

    if (!this.peer.verifyPeer(peerId)) {
      console.log('connect() is Fail. <' + peerId + '> is not valid.');
      return false;
    }

    if (peerId && peerId.length && peerId !== this.peerId) return true;
    return false;
  }

  disconnect(peer: IPeerContext): boolean {
    let conn = this.connections.find(peer.peerId)
    if (!conn) return false;
    this.closeDataConnection(conn);
    return true;
  }

  disconnectAll() {
    console.log('<closeAllDataConnection()>');
    for (let conn of this.connections) {
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
    this.outboundQueue = this.outboundQueue.then(() => new Promise<void>((resolve, reject) => {
      setZeroTimeout(async () => {
        if (1 * 1024 < container.data.byteLength && Array.isArray(data) && 1 < data.length) {
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
    let conn = this.connections.find(sendTo);
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
      if (!this.skyWay) return resolve([]);
      let now = performance.now();
      if (now < this.httpRequestInterval) {
        console.warn('httpRequestInterval... ' + (this.httpRequestInterval - now));
        resolve(this.listAllPeersCache.concat());
        return;
      }
      this.httpRequestInterval = now + 6000;
      this.skyWay.listAllPeers((list) => {
        this.listAllPeersCache = list.concat();
        resolve(list);
      });
    });
  }

  async listAllRooms(): Promise<IRoomInfo[]> {
    let allPeerIds = await this.listAllPeers();
    return RoomInfo.listFrom(allPeerIds);
  }

  private openSkyWay() {
    if (this.skyWay) {
      console.warn('It is already opened.');
      this.close();
    }
    let skyWay = new Peer(this.peer.peerId, { key: this.key });// SkyWay
    skyWay.on('open', id => {
      console.log('My peer ID is: ' + id);
      if (this.peer.peerId !== id) {
        console.error('...peer is not me? <' + id + '>', this.peer);
        return;
      }
      this.peer.isOpen = true;
      console.log('My peer Context', this.peer);
      if (this.callback.onOpen) this.callback.onOpen(this.peer);
    });

    skyWay.on('close', () => {
      console.log('Peer close');
      if (this.peer.isOpen) {
        this.peer.isOpen = false;
        if (this.callback.onClose) this.callback.onClose(this.peer);
      }
    });

    skyWay.on('connection', conn => {
      let validPeerId = this.peer.verifyPeer(conn.remoteId);
      let validToken = this.peer.isRoom || conn.metadata.token === CryptoUtil.sha256Base64Url(conn.metadata.sortKey + this.peer.userId);
      if (!validPeerId || !validToken) {
        conn.close();
        conn.on('open', () => conn.close());
        console.log('connection is close. <' + conn.remoteId + '> is not valid.');
        return;
      }
      let peer = PeerContext.parse(conn.remoteId);
      this.openDataConnection(new SkyWayDataConnection(conn, peer));
    });

    skyWay.on('error', err => {
      console.error('<' + this.peerId + '> ' + err.type + ' => ' + err.message);
      let errorMessage = `${this.getSkyWayErrorMessage(err.type)}\n\n${err.type}: ${err.message}`;
      switch (err.type) {
        case 'peer-unavailable':
          let peerId = /"(.+)"/.exec(err.message)[1];
          this.disconnect(PeerContext.parse(peerId));
          break;
        case 'disconnected':
        case 'socket-error':
        case 'unavailable-id':
        case 'authentication':
        case 'server-error':
          if (this.peer && this.peer.isOpen) {
            this.close();
            if (this.callback.onClose) this.callback.onClose(this.peer);
          }
          break;
        default:
          break;
      }
      if (this.callback.onError) this.callback.onError(this.peer, err.type, errorMessage, err);
    });
    this.skyWay = skyWay;
  }

  private openDataConnection(conn: SkyWayDataConnection) {
    if (this.connections.add(conn) == null) return;

    this.maybeUnavailablePeerIds.add(conn.remoteId);
    conn.on('data', data => {
      this.onData(conn, data);
    });
    conn.on('open', () => {
      this.maybeUnavailablePeerIds.delete(conn.remoteId);
      this.notifyUserList();
      if (this.callback.onConnect) this.callback.onConnect(conn.peer);
    });
    conn.on('close', () => {
      this.closeDataConnection(conn);
    });
    conn.on('error', () => {
      this.closeDataConnection(conn);
    });
    conn.on('stats', () => {
      if (conn.peer.session.health < 0.35 || (conn.peer.session.grade < 1 && conn.peer.session.health < 0.7)) {
        console.log(`reconnecting... ${conn.peer.peerId}`);
        this.closeDataConnection(conn);
        this.connect(conn.peer);
      }
    });
  }

  private closeDataConnection(conn: SkyWayDataConnection) {
    let closed = this.connections.remove(conn);

    this.relayingPeerIds.delete(conn.remoteId);
    this.relayingPeerIds.forEach(peerIds => {
      let index = peerIds.indexOf(conn.remoteId);
      if (0 <= index) peerIds.splice(index, 1);
    });
    this.notifyUserList();
    if (closed && this.callback.onDisconnect) this.callback.onDisconnect(conn.peer);
  }

  private onData(conn: SkyWayDataConnection, container: DataContainer) {
    if (container.users && 0 < container.users.length) this.onUpdateUserIds(conn, container.users);
    if (0 < container.ttl) this.onRelay(conn, container);
    if (!this.callback.onData) return;
    let byteLength = container.data.byteLength;
    this.bandwidthUsage += byteLength;
    this.inboundQueue = this.inboundQueue.then(() => new Promise<void>((resolve, reject) => {
      setZeroTimeout(async () => {
        if (!this.callback.onData) return;
        let data = container.isCompressed ? await decompressAsync(container.data) : container.data;
        this.callback.onData(conn.peer, MessagePack.decode(data));
        this.bandwidthUsage -= byteLength;
        return resolve();
      });
    }));
  }

  private onRelay(conn: SkyWayDataConnection, container: DataContainer) {
    container.ttl--;

    let relayingPeerIds: string[] = this.relayingPeerIds.get(conn.remoteId);
    if (relayingPeerIds == null) return;

    if (container.users && 0 < container.users.length) {
      container.users = this.userIds;
    }

    for (let peerId of relayingPeerIds) {
      let conn = this.connections.find(peerId);
      if (conn && conn.open) {
        console.log('<' + peerId + '> 転送しなきゃ・・・');
        conn.send(container);
      }
    }
  }

  private onUpdateUserIds(conn: SkyWayDataConnection, userIds: string[]) {
    let needsNotifyUserList = false;
    userIds.forEach(userId => {
      let peer = this.makeFriendPeer(userId);
      let conn = this.connections.find(peer.peerId);
      if (conn && conn.peer.userId !== userId) {
        conn.peer.userId = userId;
        needsNotifyUserList = true;
      }
    });

    let diff = ArrayUtil.diff(this.userIds, userIds);
    let relayingUserIds = diff.diff1;
    let unknownUserIds = diff.diff2;
    this.relayingPeerIds.set(conn.remoteId, relayingUserIds.map(userId => this.makeFriendPeer(userId).peerId));

    if (unknownUserIds.length) {
      for (let userId of unknownUserIds) {
        let peer = this.makeFriendPeer(userId);
        if (!this.maybeUnavailablePeerIds.has(peer.peerId) && this.connect(peer)) {
          console.log('auto connect to unknown Peer <' + peer.peerId + '>');
        }
      }
    }
    if (needsNotifyUserList) this.notifyUserList();
  }

  private notifyUserList() {
    this.connections.refresh();
    if (this.connections.length < 1) return;
    let container: DataContainer = {
      data: MessagePack.encode([]),
      users: this.userIds,
      ttl: 1
    }
    this.sendBroadcast(container);
  }

  private makeFriendPeer(userId: string): PeerContext {
    return this.peer.isRoom
      ? PeerContext.create(userId, this.peer.roomId, this.peer.roomName, this.peer.password)
      : PeerContext.create(userId);
  }

  private getSkyWayErrorMessage(errType: string): string {
    switch (errType) {
      case 'room-error': return 'SkyWay Room API に問題が発生しました。';
      case 'permission': return '該当の SkyWay Room の利用が許可されてません。';
      case 'list-error': return 'SkyWay listAllPeers API が Disabled です。';
      case 'disconnected': return 'SkyWay のシグナリングサーバに接続されていません。';
      case 'socket-error': return 'SkyWay のシグナリングサーバとの通信で問題が発生しました。';
      case 'invalid-id': return 'Peer ID が不正です。';
      case 'unavailable-id': return 'その Peer ID すでに使用されています。';
      case 'invalid-key': return 'SkyWay API キーが無効です。';
      case 'invalid-domain': return 'SkyWay API キーには現在のドメインは登録されていません。';
      case 'authentication': return '認証エラーです。';
      case 'server-error': return 'SkyWay のシグナリングサーバとの接続中に問題がありました。 少し待って、リトライしてください。';
      case 'sfu-client-not-supported': return 'このクライアントは SFU の使用をサポートしていません。最新の Google Chrome を使用してください';
      case 'peer-unavailable': return 'Peer へデータを送信できませんでした。Peer ID が正しいことを確認してください。';
      case 'signaling-limited': return 'シグナリング回数が無償利用枠を超過しているため、全ての機能が利用できません。（SkyWay Community Edition のみ）';
      case 'sfu-limited': return 'SFU サーバの利用量が無償利用枠を超過しているため、SFU の機能が利用できません。（SkyWay Community Edition のみ）';
      case 'turn-limited': return 'TURN サーバの利用量が無償利用枠を超過しているため、TURN の機能が利用できません。（SkyWay Community Edition のみ）\nこの状態では、一部のユーザの接続に問題が発生する可能性があります。';
      default: return 'SkyWayに関する不明なエラーが発生しました。';
    }
  }
}
