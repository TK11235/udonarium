import { ArrayUtil } from '../../util/array-util';
import { compressAsync, decompressAsync } from '../../util/compress';
import { MessagePack } from '../../util/message-pack';
import { setZeroTimeout } from '../../util/zero-timeout';
import { Connection, ConnectionCallback } from '../connection';
import { IPeerContext, PeerContext } from '../peer-context';
import { IRoomInfo, RoomInfo } from '../room-info';
import { SkyWayDataStream } from './skyway-data-stream';
import { SkyWayDataStreamList } from './skyway-data-stream-list';
import { SkyWayFacade } from './skyway-facade';

type PeerId = string;

interface DataContainer {
  data: Uint8Array;
  users?: string[];
  ttl: number;
  isCompressed?: boolean;
}

export class SkyWayConnection implements Connection {
  private get userIds(): string[] { return this.peers.map(peer => peer.userId).filter(userId => 0 < userId.length).concat([this.peer.userId]); }

  get peerId(): string { return this.peer.peerId; }
  get peerIds(): string[] { return this.streams.peerIds; }

  get peer(): PeerContext { return this.skyWay.peer; }
  get peers(): PeerContext[] { return this.streams.peers; }

  readonly callback: ConnectionCallback = new ConnectionCallback();
  bandwidthUsage: number = 0;

  private readonly skyWay: SkyWayFacade = new SkyWayFacade();
  private readonly streams: SkyWayDataStreamList = new SkyWayDataStreamList();

  private listAllPeersCache: PeerId[] = [];
  private httpRequestInterval: number = performance.now() + 500;

  private outboundQueue: Promise<any> = Promise.resolve();
  private inboundQueue: Promise<any> = Promise.resolve();

  private readonly trustedPeerIds: Set<PeerId> = new Set();
  private readonly relayingPeerIds: Map<string, string[]> = new Map();
  private readonly maybeUnavailablePeerIds: Set<string> = new Set();

  configure(config: any) {
    this.skyWay.url = config?.backend?.url ?? '';
  }

  open(userId?: string)
  open(userId: string, roomId: string, roomName: string, password: string)
  open(...args: any[]) {
    console.log('open', args);
    let peer: PeerContext;
    if (args.length === 0) {
      peer = PeerContext.create(PeerContext.generateId());
    } else if (args.length === 1) {
      peer = PeerContext.create(args[0]);
    } else {
      peer = PeerContext.create(args[0], args[1], args[2], args[3]);
    }
    this.trustedPeerIds.clear();
    this.openSkyWay(peer);
  }

  close() {
    this.disconnectAll();
    this.skyWay.close();
  }

  connect(peer: IPeerContext): boolean {
    if (!this.peer.isRoom) {
      console.warn('connect() is Fail. ルーム接続のみ可能');
      let errorType = 'udonarium-unsupported';
      let errorMessage = '現在のユドナリウムでSkyWay(2023)を使用する場合、プライベート接続は利用できません。ルーム接続機能を利用してください。';
      if (this.callback.onError) this.callback.onError(this.peer, errorType, errorMessage, {});
      return false;
    }

    if (!this.shouldConnect(peer.peerId)) return false;

    console.log(`connect() ${peer.peerId}`);
    this.connectStream(SkyWayDataStream.createSubscription(this.skyWay, peer));
    return true;
  }

  private shouldConnect(peerId: string): boolean {
    if (!this.skyWay.isOpen) {
      console.log('connect() is Fail. IDが割り振られるまで待てや');
      return false;
    }

    if (this.peerId === peerId) {
      console.log('connect() is Fail. ' + peerId + ' is me.');
      return false;
    }

    if (this.peerIds.includes(peerId)) {
      console.log('connect() is Fail. <' + peerId + '> is already connecting.');
      return false;
    }

    if (!this.peer.verifyPeer(peerId)) {
      console.log('connect() is Fail. <' + peerId + '> is invalid.');
      return false;
    }

    if (!this.skyWay?.room?.members.find(member => member.name === peerId)) {
      console.log('connect() is Fail.  <' + peerId + '> is not found.');
      return false;
    }

    if (peerId && peerId.length && peerId !== this.peerId) return true;
    return false;
  }

  disconnect(peer: IPeerContext): boolean {
    let stream = this.streams.find(peer.peerId)
    if (!stream) return false;
    this.disconnectStream(stream);
    return true;
  }

  disconnectAll() {
    for (let peer of this.peers) {
      this.disconnect(peer);
    }
  }

  send(data: any, sendTo?: string) {
    if (this.peers.length < 1) return;
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
    let stream = this.streams.find(sendTo);
    if (stream && stream.open) stream.send(container);
  }

  private sendBroadcast(container: DataContainer) {
    for (let stream of this.streams) {
      if (stream.open) stream.send(container);
    }
  }

  async listAllPeers(): Promise<string[]> {
    let now = performance.now();
    if (now < this.httpRequestInterval) {
      console.warn('httpRequestInterval... ' + (this.httpRequestInterval - now));
    } else {
      this.httpRequestInterval = now + 10000;
      this.listAllPeersCache = await this.skyWay.listAllPeers();
    }

    return this.listAllPeersCache;
  }

  async listAllRooms(): Promise<IRoomInfo[]> {
    let allPeerIds = await this.listAllPeers();
    return RoomInfo.listFrom(allPeerIds);
  }

  private async openSkyWay(peer: IPeerContext) {
    if (this.skyWay.context) {
      console.warn('It is already opened.');
      await this.skyWay.close();
    }

    this.skyWay.onOpen = peer => {
      console.log('skyWay onOpen', peer);
      console.log('My peer Context', this.peer);
      if (this.callback.onOpen) this.callback.onOpen(this.peer);
    };

    this.skyWay.onClose = peer => {
      console.log('skyWay onClose', peer);
      if (this.peer.isOpen) this.close();
      if (this.callback.onClose) this.callback.onClose(this.peer);
    };

    this.skyWay.onFatalError = (peer, errorType, errorMessage, errorObject) => {
      console.error('skyWay onFatalError', errorObject);
      if (this.peer.isOpen) {
        this.close();
        if (this.callback.onClose) this.callback.onClose(this.peer);
      }
      if (this.callback.onError) this.callback.onError(this.peer, errorType, errorMessage, errorObject);
    };

    this.skyWay.onSubscribed = (peer, subscription) => {
      console.log(`skyWay onSubscribed ${peer.peerId}`);
      let stream = SkyWayDataStream.createPublication(this.skyWay, peer);

      if (!this.peer.verifyPeer(stream.peer.peerId)) {
        console.warn('stream is closing. <' + stream.peer.peerId + '> is invalid.');
        stream.reject();
        stream.connect();
        return;
      }
      this.connectStream(stream);
    }

    this.skyWay.onRoomRestore = (peer) => {
      console.log(`skyWay onRoomRestore ${peer.peerId}`);
      for (let peerId of this.trustedPeerIds) {
        let peer = PeerContext.parse(peerId);
        this.disconnect(peer);
        this.connect(peer);
      }
    }

    await this.skyWay.open(peer);
    return;
  }

  private connectStream(stream: SkyWayDataStream) {
    if (this.streams.add(stream) == null) return;
    console.log(`openStream ${stream.peer.peerId}`);

    this.trustedPeerIds.delete(stream.peer.peerId);
    this.maybeUnavailablePeerIds.add(stream.peer.peerId);

    stream.on('data', data => {
      this.onData(stream, data);
    });
    stream.on('open', () => {
      this.trustedPeerIds.add(stream.peer.peerId);
      this.maybeUnavailablePeerIds.delete(stream.peer.peerId);
      this.notifyUserList();
      if (this.callback.onConnect) this.callback.onConnect(stream.peer);
    });
    stream.on('close', () => {
      this.disconnectStream(stream);
    });
    stream.on('error', () => {
      this.disconnectStream(stream);
    });
    stream.on('stats', async () => {
      // not implemented
    });

    stream.connect();
  }

  private disconnectStream(stream: SkyWayDataStream) {
    stream.disconnect();
    let closed = this.streams.remove(stream);

    this.relayingPeerIds.delete(stream.peer.peerId);
    this.relayingPeerIds.forEach(peerIds => {
      let index = peerIds.indexOf(stream.peer.peerId);
      if (0 <= index) peerIds.splice(index, 1);
    });
    this.notifyUserList();
    if (closed && this.callback.onDisconnect) this.callback.onDisconnect(closed.peer);
  }

  private onData(stream: SkyWayDataStream, container: DataContainer) {
    if (container.users && 0 < container.users.length) this.onUpdateUserIds(stream, container.users);
    if (0 < container.ttl) this.onRelay(stream, container);
    if (!this.callback.onData) return;
    let byteLength = container.data.byteLength;
    this.bandwidthUsage += byteLength;
    this.inboundQueue = this.inboundQueue.then(() => new Promise<void>((resolve, reject) => {
      setZeroTimeout(async () => {
        if (!this.callback.onData) return;
        let data = container.isCompressed ? await decompressAsync(container.data) : container.data;
        this.callback.onData(stream.peer, MessagePack.decode(data));
        this.bandwidthUsage -= byteLength;
        return resolve();
      });
    }));
  }

  private onRelay(stream: SkyWayDataStream, container: DataContainer) {
    container.ttl--;

    let relayingPeerIds: string[] = this.relayingPeerIds.get(stream.peer.peerId);
    if (relayingPeerIds == null) return;

    if (container.users && 0 < container.users.length) {
      container.users = this.userIds;
    }

    for (let peerId of relayingPeerIds) {
      let conn = this.streams.find(peerId);
      if (conn && conn.open) {
        console.log('<' + peerId + '> 転送しなきゃ・・・');
        conn.send(container);
      }
    }
  }

  private onUpdateUserIds(stream: SkyWayDataStream, userIds: string[]) {
    let needsNotifyUserList = false;
    userIds.forEach(userId => {
      let peer = this.makeFriendPeer(userId);
      let stream = this.streams.find(peer.peerId);
      if (stream && stream.peer.userId !== userId) {
        stream.peer.userId = userId;
        needsNotifyUserList = true;
      }
    });

    let diff = ArrayUtil.diff(this.userIds, userIds);
    let relayingUserIds = diff.diff1;
    let unknownUserIds = diff.diff2;
    this.relayingPeerIds.set(stream.peer.peerId, relayingUserIds.map(userId => this.makeFriendPeer(userId).peerId));

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
    this.streams.refresh();
    if (this.streams.length < 1) return;
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
}
