import { ArrayUtil } from '../../util/array-util';
import { compressAsync, decompressAsync } from '../../util/compress';
import { MessagePack } from '../../util/message-pack';
import { setZeroTimeout } from '../../util/zero-timeout';
import { Connection, ConnectionCallback } from "../connection";
import { IPeerContext, PeerContext } from "../peer-context";
import { IRoomInfo, RoomInfo } from "../room-info";
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

  private appId = '';
  private readonly skyWay: SkyWayFacade = new SkyWayFacade();
  private readonly streams: SkyWayDataStreamList = new SkyWayDataStreamList();

  private listAllPeersCache: PeerId[] = [];
  private httpRequestInterval: number = performance.now() + 500;

  private outboundQueue: Promise<any> = Promise.resolve();
  private inboundQueue: Promise<any> = Promise.resolve();

  private readonly trustedPeerIds: Set<PeerId> = new Set();

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
    this.subscribe(peer);
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
      console.log('connect() is Fail. <' + peerId + '> is not valid.');
      return false;
    }

    if (peerId && peerId.length && peerId !== this.peerId) return true;
    return false;
  }

  disconnect(peer: IPeerContext): boolean {
    let stream = this.streams.find(peer.peerId)
    if (!stream) return false;
    this.unsubscribe(stream.peer);
    return true;
  }

  disconnectAll() {
    for (let peer of this.peers) {
      this.disconnect(peer);
    }
  }

  send(data: any, sendTo?: string) {
    if (this.peers.length < 1) return;
    //console.log('send', data);
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

  setApiKey(key: string) {
    console.warn('Method not implemented. set hard code value.');
    this.skyWay.appId = this.appId;
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

    this.skyWay.onConnectionStateChanged = (peer, state) => {
      console.log(`publication onConnectionStateChanged ${peer.peerId} -> ${state}`);
      let stream = this.streams.find(peer.peerId);
      if (!stream) return;
      switch (state) {
        case 'new':
          break;
        case 'connecting':
          stream.peer.isOpen = false;
          break;
        case 'connected':
          if (this.skyWay.isConnectedDataStream(stream.member)) {
            console.log(`onConnect ${stream.peer.peerId}`);
            stream.refresh();
            this.trustedPeerIds.add(stream.peer.peerId);
            this.notifyUserList();
            if (this.callback.onConnect) this.callback.onConnect(stream.peer);
          }
          break;
        case 'reconnecting':
          stream.peer.isOpen = false;
          break;
        case 'disconnected':
          this.unsubscribe(stream.peer);
          break;
      }
    }

    this.skyWay.onSubscribed = (peer, subscription) => {
      console.log(`publication onSubscribed ${peer.peerId}`);

      let validPeerId = this.peer.verifyPeer(peer.peerId);
      if (!validPeerId) {
        subscription.cancel();
        console.log('connection is close. <' + peer.peerId + '> is not valid.');
        return;
      }
      console.log('connection is subscribed. <' + peer.peerId + '> is valid.');

      this.subscribe(peer);
    }

    this.skyWay.onUnsubscribed = (peer, subscription) => {
      console.log(`publication onUnsubscribed ${peer.peerId}`);
      let stream = this.streams.find(peer.peerId);
      if (stream == null) return;

      this.unsubscribe(stream.peer);
    }

    this.skyWay.onDataStreamPublished = (peer, publication) => {
      let stream = this.streams.find(peer.peerId);
      if (stream == null || stream.open) return;
      stream.subscribe();
      //this.connect(peer);
    }

    this.skyWay.onRoomRestore = (peer) => {
      for (let peerId of this.trustedPeerIds) {
        let peer = PeerContext.parse(peerId);
        this.unsubscribe(peer);
        this.connect(peer);
      }
    }

    await this.skyWay.open(peer);
    return;
  }

  private async subscribe(peer: IPeerContext) {
    if (this.streams.find(peer.peerId)) {
      console.log(`${peer.peerId} is already subscribed`);
      return;
    }
    let stream = new SkyWayDataStream(this.skyWay, peer);

    stream.on('data', data => {
      this.onData(stream, data);
    });
    stream.on('open', () => {
      if (this.skyWay.isConnectedDataStream(stream.member)) {
        console.log(`onConnect ${stream.peer.peerId}`);
        stream.refresh();
        this.trustedPeerIds.add(stream.peer.peerId);
        this.notifyUserList();
        if (this.callback.onConnect) this.callback.onConnect(stream.peer);
      }
    });
    stream.on('close', () => {
      this.unsubscribe(stream.peer);
    });
    stream.on('error', () => {
      this.unsubscribe(stream.peer);
    });
    stream.on('stats', () => {
      if (stream.peer.session.health < 0.2) {
        this.unsubscribe(stream.peer);
      }
    });

    this.streams.add(stream);
    await stream.subscribe();
    return;
  }

  private async unsubscribe(peer: IPeerContext) {
    let closed = this.streams.find(peer.peerId);
    if (!closed) return;
    this.streams.remove(closed);
    await closed.unsubscribe();
    if (closed && this.callback.onDisconnect) this.callback.onDisconnect(closed.peer);
  }

  private onData(stream: SkyWayDataStream, container: DataContainer) {
    if (container.users && 0 < container.users.length) this.onUpdateUserIds(stream, container.users);
    //if (0 < container.ttl) this.onRelay(conn, container);
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
    let unknownUserIds = diff.diff2;

    if (unknownUserIds.length) {
      for (let userId of unknownUserIds) {
        let peer = this.makeFriendPeer(userId);
        if (this.connect(peer)) {
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
