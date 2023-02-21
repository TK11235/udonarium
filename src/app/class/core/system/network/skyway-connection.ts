import * as SHA256 from 'crypto-js/sha256';

import { compressAsync, decompressAsync } from '../util/compress';
import { MessagePack } from '../util/message-pack';
import { setZeroTimeout } from '../util/zero-timeout';
import { Connection, ConnectionCallback } from './connection';
import { IPeerContext, PeerContext } from './peer-context';
import { PeerSessionGrade } from './peer-session-state';
import { IRoomInfo, RoomInfo } from './room-info';
import { SkyWayDataConnection } from './skyway-data-connection';
import { SkyWayDataConnectionList } from './skyway-data-connection-list';
import { CandidateType } from './webrtc-stats';

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
  private get userIds(): string[] { return this.peerContexts.map(context => context.userId).filter(userId => 0 < userId.length).concat([this.peerContext.userId]); }

  get peerId(): string { return this.peerContext.peerId; }
  get peerIds(): string[] { return this.connections.peerIds; }

  peerContext: PeerContext = PeerContext.parse('???');
  get peerContexts(): PeerContext[] { return this.connections.peerContexts; }

  readonly callback: ConnectionCallback = new ConnectionCallback();
  bandwidthUsage: number = 0;

  private key: string = '';
  private peer: PeerJs.Peer;
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
    this.peerContext = PeerContext.parse('???');
  }

  connect(context: IPeerContext): boolean {
    if (!this.shouldConnect(context.peerId)) return false;

    let conn: SkyWayDataConnection = new SkyWayDataConnection(this.peer.connect(context.peerId, {
      serialization: 'none',
      metadata: {
        sortKey: this.peerContext.digestUserId,
        token: this.peerContext.isRoom ? '' : calcSHA256Base64(this.peerContext.digestUserId + context.userId)
      }
    }), context);

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

    if (this.connections.find(peerId)) {
      console.log('connect() is Fail. <' + peerId + '> is already connecting.');
      return false;
    }

    if (!this.peerContext.verifyPeer(peerId)) {
      console.log('connect() is Fail. <' + peerId + '> is not valid.');
      return false;
    }

    if (peerId && peerId.length && peerId !== this.peerId) return true;
    return false;
  }

  disconnect(context: IPeerContext): boolean {
    let conn = this.connections.find(context.peerId)
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

  async listAllRooms(): Promise<IRoomInfo[]> {
    let allPeerIds = await this.listAllPeers();
    return RoomInfo.listFrom(allPeerIds);
  }

  private openPeer() {
    if (this.peer) {
      console.warn('It is already opened.');
      this.close();
    }
    let peer = new Peer(this.peerContext.peerId, { key: this.key });// SkyWay
    peer.on('open', id => {
      console.log('My peer ID is: ' + id);
      if (this.peerContext.peerId !== id) {
        console.error('...peer is not me? <' + id + '>', this.peerContext);
        return;
      }
      this.peerContext.isOpen = true;
      console.log('My peer Context', this.peerContext);
      if (this.callback.onOpen) this.callback.onOpen(this.peerId);
    });

    peer.on('close', () => {
      console.log('Peer close');
      if (this.peerContext.isOpen) {
        this.peerContext.isOpen = false;
        if (this.callback.onClose) this.callback.onClose(this.peerId);
      }
    });

    peer.on('connection', conn => {
      let validPeerId = this.peerContext.verifyPeer(conn.remoteId);
      let validToken = this.peerContext.isRoom || conn.metadata.token === calcSHA256Base64(conn.metadata.sortKey + this.peerContext.userId);
      if (!validPeerId || !validToken) {
        conn.close();
        conn.on('open', () => conn.close());
        console.log('connection is close. <' + conn.remoteId + '> is not valid.');
        return;
      }
      let context = PeerContext.parse(conn.remoteId);
      this.openDataConnection(new SkyWayDataConnection(conn, context));
    });

    peer.on('error', err => {
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
          if (this.peerContext && this.peerContext.isOpen) {
            this.close();
            if (this.callback.onClose) this.callback.onClose(this.peerId);
          }
          break;
        default:
          break;
      }
      if (this.callback.onError) this.callback.onError(this.peerId, err.type, errorMessage, err);
    });
    this.peer = peer;
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
      if (this.callback.onConnect) this.callback.onConnect(conn.remoteId);
    });
    conn.on('close', () => {
      this.closeDataConnection(conn);
    });
    conn.on('error', () => {
      this.closeDataConnection(conn);
    });
    conn.on('stats', () => {
      let deltaTime = performance.now() - conn.timestamp;
      let healthRate = deltaTime <= 10000 ? 1 : 5000 / ((deltaTime - 10000) + 5000);
      let ping = healthRate < 1 ? deltaTime : conn.ping;
      let pingRate = 500 / (ping + 500);

      conn.context.session.health = healthRate;
      conn.context.session.ping = ping;
      conn.context.session.speed = pingRate * healthRate;

      switch (conn.candidateType) {
        case CandidateType.HOST:
          conn.context.session.grade = PeerSessionGrade.HIGH;
          break;
        case CandidateType.SRFLX:
        case CandidateType.PRFLX:
          conn.context.session.grade = PeerSessionGrade.MIDDLE;
          break;
        case CandidateType.RELAY:
          conn.context.session.grade = PeerSessionGrade.LOW;
          break;
        default:
          conn.context.session.grade = PeerSessionGrade.UNSPECIFIED;
          break;
      }
      conn.context.session.description = conn.candidateType;

      if (conn.context.session.health < 0.2) {
        this.closeDataConnection(conn);
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
    if (closed && this.callback.onDisconnect) this.callback.onDisconnect(conn.remoteId);
  }

  private onData(conn: SkyWayDataConnection, container: DataContainer) {
    if (container.users && 0 < container.users.length) this.onUpdateUserIds(conn, container.users);
    if (0 < container.ttl) this.onRelay(conn, container);
    if (this.callback.onData) {
      let byteLength = container.data.byteLength;
      this.bandwidthUsage += byteLength;
      this.inboundQueue = this.inboundQueue.then(() => new Promise<void>((resolve, reject) => {
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
      let context = this.makeFriendPeer(userId);
      let conn = this.connections.find(context.peerId);
      if (conn && conn.context.userId !== userId) {
        conn.context.userId = userId;
        needsNotifyUserList = true;
      }
    });

    let diff = diffArray(this.userIds, userIds);
    let relayingUserIds = diff.diff1;
    let unknownUserIds = diff.diff2;
    this.relayingPeerIds.set(conn.remoteId, relayingUserIds.map(userId => this.makeFriendPeer(userId).peerId));

    if (unknownUserIds.length) {
      for (let userId of unknownUserIds) {
        let context = this.makeFriendPeer(userId);
        if (!this.maybeUnavailablePeerIds.has(context.peerId) && this.connect(context)) {
          console.log('auto connect to unknown Peer <' + context.peerId + '>');
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
    return this.peerContext.isRoom
      ? PeerContext.create(userId, this.peerContext.roomId, this.peerContext.roomName, this.peerContext.password)
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
      case 'peer-unavailable': return 'その Peer ID は利用できません。';
      case 'invalid-key': return 'SkyWay API キーが無効です。';
      case 'invalid-domain': return 'SkyWay API キーには現在のドメインは登録されていません。';
      case 'authentication': return '認証エラーです。';
      case 'server-error': return 'SkyWay のシグナリングサーバとの接続中に問題がありました。 少し待って、リトライしてください。';
      case 'sfu-client-not-supported': return 'このクライアントは SFU の使用をサポートしていません。最新の Google Chrome を使用してください';
      case 'peer-unavailable': return 'Peer へデータを送信できませんでした。Peer ID が正しいことを確認してください。';
      case 'signaling-limited': return 'シグナリング回数が無償利用枠を超過しているため、全ての機能が利用できません。（SkyWay Community Edition のみ）';
      case 'sfu-limited': return 'SFU サーバの利用量が無償利用枠を超過しているため、SFU の機能が利用できません。（SkyWay Community Edition のみ）';
      case 'turn-limited': return 'TURN サーバの利用量が無償利用枠を超過しているため、TURN の機能が利用できません。（SkyWay Community Edition のみ）\nこの状態では、一部のユーザの接続に問題が発生する可能性があります。';
      case 'peer-unavailable': return 'そのPeer IDは利用できません。';
      default: return 'SkyWayに関する不明なエラーが発生しました。';
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

function calcSHA256Base64(str: string): string {
  if (str == null) return '';
  let hash = SHA256(str);
  let arrayBuffer = Uint32Array.from(hash.words).buffer;
  let base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return base64;
}
