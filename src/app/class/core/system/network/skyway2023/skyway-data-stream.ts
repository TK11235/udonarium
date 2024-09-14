import { LocalDataStream, P2PConnection, Publication, RemoteDataStream, RemoteMember, Subscription, TransportConnectionState } from '@skyway-sdk/core';
import { EventEmitter } from 'events';
import { MessagePack } from '../../util/message-pack';
import { UUID } from '../../util/uuid';
import { setZeroTimeout } from '../../util/zero-timeout';
import { IPeerContext, PeerContext } from '../peer-context';
import { PeerSessionGrade } from '../peer-session-state';
import { CandidateType, WebRTCStats } from '../webrtc/webrtc-stats';
import { WebRTCConnection, WebRTCStatsMonitor } from '../webrtc/webrtc-stats-monitor';
import { SkyWayFacade } from './skyway-facade';

interface Ping {
  from: string;
  ping: number;
};

interface DataChank {
  id: string;
  data: Uint8Array;
  index: number;
  total: number;
};

interface ReceivedChank {
  id: string;
  chanks: Uint8Array[];
  length: number;
  byteLength: number;
};

export class SkyWayDataStream extends EventEmitter implements WebRTCConnection {
  readonly peer: PeerContext;

  private chunkSize = 15.5 * 1024;
  private receivedMap: Map<string, ReceivedChank> = new Map();

  private stats: WebRTCStats;

  get open(): boolean { return this.peer.isOpen; }
  get member(): RemoteMember { return this.skyWay.room?.members.find(member => member.name === this.peer.peerId); }

  private isQueuing = false;
  private sendQueue: Set<Uint8Array> = new Set();

  private _timestamp: number = performance.now();
  get timestamp(): number { return this._timestamp; }
  private set timestamp(timestamp: number) { this._timestamp = timestamp };

  private _ping: number = 0;
  get ping(): number { return this._ping; }
  private set ping(ping: number) { this._ping = ping };

  private _candidateType: CandidateType = CandidateType.UNKNOWN;
  get candidateType(): CandidateType { return this._candidateType; }
  private set candidateType(candidateType: CandidateType) { this._candidateType = candidateType };

  sortKey = '';
  isPublication = false;
  private isCanceled = false;
  private isRejected = false;
  private isOpend = false;

  private state: TransportConnectionState = 'new';
  private subscription: Subscription<RemoteDataStream>;
  private dataChannel: RTCDataChannel;

  private onStreamAdded: { removeListener: () => void };
  private onStreamPublished: { removeListener: () => void };
  private onConnectionStateChanged: { removeListener: () => void };

  private onopen = () => {
    console.log(`peer ${this.peer.peerId} dataChannel is open`);
    this.refresh();
  }

  private onmessage = (event: MessageEvent<any>) => {
    this.onData(event.data as ArrayBuffer);
  }

  private constructor(readonly skyWay: SkyWayFacade, peer: IPeerContext) {
    super();

    this.peer = PeerContext.parse(peer.peerId);
    this.peer.userId = peer.userId;
    this.peer.password = peer.password;
  }

  static createPublication(skyWay: SkyWayFacade, peer: IPeerContext): SkyWayDataStream {
    let instance = new SkyWayDataStream(skyWay, peer);
    instance.sortKey = instance.skyWay.peer.peerId;
    instance.isPublication = true;
    return instance;
  }

  static createSubscription(skyWay: SkyWayFacade, peer: IPeerContext): SkyWayDataStream {
    let instance = new SkyWayDataStream(skyWay, peer);
    instance.sortKey = instance.peer.peerId;
    instance.isPublication = false;
    return instance;
  }

  connect() {
    console.log(`connect ${this.peer.peerId}, isPublication: ${this.isPublication}`);
    if (this.isPublication) {
      return this.initializePublication();
    } else {
      return this.initializeSubscription();
    }
  }

  disconnect() {
    console.log(`disconnect ${this.peer.peerId}, isPublication: ${this.isPublication}`);
    this.isCanceled = true;
    if (this.isOpend) {
      this.dispose();
    } else {
      this.refresh();
    }
  }

  reject() {
    console.log(`reject ${this.peer.peerId}, isPublication: ${this.isPublication}`);
    this.isRejected = true;
    this.refresh();
  }

  private dispose() {
    console.log(`dispose ${this.peer.peerId}, isPublication: ${this.isPublication}`);
    this.peer.isOpen = false;
    this.stopMonitoring();
    this.removeAllListeners();

    if (this.onStreamAdded) this.onStreamAdded.removeListener();
    if (this.onStreamPublished) this.onStreamPublished.removeListener();
    if (this.onConnectionStateChanged) this.onConnectionStateChanged.removeListener();
    this.onStreamAdded = null;
    this.onStreamPublished = null;
    this.onConnectionStateChanged = null;

    this.subscription = null

    this.dataChannel?.removeEventListener('open', this.onopen);
    this.dataChannel?.removeEventListener('message', this.onmessage);
    this.dataChannel?.close();
    this.dataChannel = null;
  }

  private initializePublication() {
    //
    let member = this.member;
    let subscription = member?.subscriptions.find(subscription => subscription.publication.contentType === 'data'
      && subscription.publication.metadata === 'udonarium-data-stream'
      && subscription.publication.publisher.name === this.skyWay.peer.peerId) as Subscription<RemoteDataStream>;

    //
    if (!subscription) {
      console.error(`subscription is not found ${this.peer.peerId}`);
    }

    //
    if (this.onConnectionStateChanged) this.onConnectionStateChanged.removeListener();
    this.skyWay.publication.onConnectionStateChanged.add(event => {
      if (event.remoteMember.name !== this.peer.peerId) return;
      this.onStateChanged(event.state);
    });

    //
    console.log(`initializePublication ${member.name} ${subscription.id}`);
    this.subscription = subscription;
    this.refresh();
  }

  private async initializeSubscription() {
    //
    let member = this.member;
    let publication = member.publications.find(publication => publication.contentType === 'data' && publication.metadata === 'udonarium-data-stream');

    //
    if (!publication) {
      if (this.onStreamPublished) this.onStreamPublished.removeListener();
      this.onStreamPublished = this.skyWay.room.onStreamPublished.add(event => {
        let isMatch = event.publication.contentType === 'data' && event.publication.metadata === 'udonarium-data-stream' && event.publication.publisher.name === this.peer.peerId;
        if (!isMatch) return;

        console.log(`onStreamPublished: ${event.publication.publisher.name} <${event.publication.metadata}>`);
        if (this.onStreamPublished) this.onStreamPublished.removeListener();
        this.initializeSubscription();
      });
      return;
    }

    //
    this.refresh();
    console.log(`initializeSubscription ready ${member.name}`);
    try {
      let { subscription, stream } = await this.skyWay.roomPerson.subscribe<RemoteDataStream>(publication.id);

      //
      if (this.onConnectionStateChanged) this.onConnectionStateChanged.removeListener();
      subscription.onConnectionStateChanged.add(state => {
        this.onStateChanged(state);
      });

      //
      console.log(`initializeSubscription done ${member.name} ${publication.id}`);
      this.subscription = subscription;

      this.refresh();
    } catch (e) {
      if (e instanceof Error) {
        console.log(`${e.name}: ${e.message}`);
      } else {
        console.error(e);
      }

      this.subscription = null;
      this.state = 'disconnected';
      this.emit('close');
    }
  }

  private onStateChanged(state: TransportConnectionState) {
    console.log(`onStateChanged isPublication: ${this.isPublication}, ${this.peer.peerId} ${this.state} -> ${state}`);
    switch (state) {
      case 'new': break;
      case 'connecting': break;
      case 'connected':
        if (this.state == 'reconnecting') this.peer.isOpen = false;
        break;
      case 'reconnecting': break;
      case 'disconnected':
        this.subscription = null;
        this.emit('close');
        return;
    }
    this.refresh();
    this.state = state;
  }

  private refresh() {
    // 現在のオブジェクトを取得
    let member = this.member;

    let p2pconnection = (member as any)?._getOrCreateConnection((this.skyWay.roomPerson as any)?._impl) as P2PConnection;
    let publication = member?.publications.find(publication => publication.metadata === 'udonarium-data-stream');

    let dataChannel = this.isPublication
      ? p2pconnection?.sender.datachannels[this.skyWay.publication?.id]
      : (p2pconnection?.receiver.streams[publication?.id] as RemoteDataStream)?._datachannel;

    // 接続状況確認
    let isOpen = dataChannel?.readyState === 'open';
    console.log(`refresh ${member?.name}, isPublication: ${this.isPublication}, isOpen: ${isOpen}, dataChannel: ${dataChannel?.readyState}`);

    // cancelまたはrejectされているときは接続解除
    if (dataChannel && (this.isCanceled && isOpen || this.isRejected)) {
      dataChannel.close();
      this.dispose();
      this.state = 'disconnected';
      this.emit('close');
      return;
    }

    // RTCDataChannelを更新
    if (dataChannel && this.dataChannel && dataChannel !== this.dataChannel) {
      console.warn(`dataChannel is change: ${this.dataChannel?.id} -> ${dataChannel.id}`);
      this.peer.isOpen = false;
    }

    if (this.dataChannel) {
      this.dataChannel.removeEventListener('open', this.onopen);
      this.dataChannel.removeEventListener('message', this.onmessage);
    }
    if (dataChannel) {
      dataChannel.binaryType = 'arraybuffer';
      dataChannel.addEventListener('open', this.onopen);
      dataChannel.addEventListener('message', this.onmessage);
    }
    this.dataChannel = dataChannel;

    // P2PConnectionを更新
    console.log(`p2pconnection: ${p2pconnection?.id}`);
    if (this.onStreamAdded) this.onStreamAdded.removeListener();
    if (p2pconnection && !dataChannel) {
      this.onStreamAdded = p2pconnection?.receiver.onStreamAdded.add(event => {
        console.log(`receiver.onStreamAdded: ${event.stream.id} ${(event.stream as RemoteDataStream)?._datachannel?.readyState}`);
        this.refresh();
      });
    }

    // open or close
    if (isOpen !== this.peer.isOpen) {
      this.peer.isOpen = isOpen;
      if (isOpen) {
        this.isOpend = true;
        this.state = 'connected';
        this.emit('open');
      } else {
        this.subscription = null;
        this.state = 'disconnected';
        this.emit('close');
      }
    }

    // モニタリング制御
    let peerConnection = this.getPeerConnection();
    this.stats = peerConnection ? new WebRTCStats(peerConnection) : null;

    if (isOpen) {
      this.startMonitoring();
      if (!this.isQueuing) this.execQueue();
    } else {
      this.stopMonitoring();
    }
  }

  send(data: any) {
    let encodedData: Uint8Array = MessagePack.encode(data);

    let total = Math.ceil(encodedData.byteLength / this.chunkSize);
    if (total <= 1) {
      this.addSendQueue(encodedData);
      return;
    }

    let id = UUID.generateUuid();

    let sliceData: Uint8Array = null;
    let chank: DataChank = null;
    for (let sliceIndex = 0; sliceIndex < total; sliceIndex++) {
      sliceData = encodedData.slice(sliceIndex * this.chunkSize, (sliceIndex + 1) * this.chunkSize);
      chank = { id: id, data: sliceData, index: sliceIndex, total: total };
      this.addSendQueue(MessagePack.encode(chank));
    }
  }

  private addSendQueue(data: Uint8Array) {
    this.sendQueue.add(data);
    if (!this.isQueuing) this.execQueue();
  }

  private execQueue = () => {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      if (this.sendQueue.size) console.warn(`peer Connection not open; queueing; ${this.dataChannel?.readyState} -> ${this.member.name} `);
      this.isQueuing = false;
      return;
    }
    for (let data of this.sendQueue) {
      try {
        this.dataChannel.send(data);
        this.sendQueue.delete(data);
      } catch (err) {
        console.error(err);
      }
      break;
    }
    this.isQueuing = 0 < this.sendQueue.size;
    if (this.isQueuing) setZeroTimeout(this.execQueue);
  }

  getPeerConnection(): RTCPeerConnection {
    if (this.isPublication) {
      return (this.subscription?.publication as Publication<LocalDataStream>)?.stream?._getRTCPeerConnection(this.member);
    } else {
      return this.subscription?.stream?._getRTCPeerConnection();
    }
  }

  private startMonitoring() {
    WebRTCStatsMonitor.add(this);
  }

  private stopMonitoring() {
    WebRTCStatsMonitor.remove(this);
  }

  async updateStatsAsync() {
    if (this.stats == null) return;
    this.sendPing();
    await this.stats.updateAsync();
    this.candidateType = this.stats.candidateType;

    let deltaTime = performance.now() - this.timestamp;
    let healthRate = deltaTime <= 10000 ? 1 : 5000 / ((deltaTime - 10000) + 5000);
    let ping = healthRate < 1 ? deltaTime : this.ping;
    let pingRate = 500 / (ping + 500);

    this.peer.session.health = healthRate;
    this.peer.session.ping = ping;
    this.peer.session.speed = pingRate * healthRate;

    switch (this.candidateType) {
      case CandidateType.HOST:
        this.peer.session.grade = PeerSessionGrade.HIGH;
        break;
      case CandidateType.SRFLX:
      case CandidateType.PRFLX:
        this.peer.session.grade = PeerSessionGrade.MIDDLE;
        break;
      case CandidateType.RELAY:
        this.peer.session.grade = PeerSessionGrade.LOW;
        break;
      default:
        this.peer.session.grade = PeerSessionGrade.UNSPECIFIED;
        break;
    }
    this.peer.session.description = this.candidateType;

    this.emit('stats', this.stats);
  }

  sendPing() {
    let encodedData: Uint8Array = MessagePack.encode({ from: this.skyWay.peer.peerId, ping: performance.now() });
    this.addSendQueue(encodedData);
  }

  private receivePing(ping: Ping) {
    if (ping.from === this.skyWay.peer.peerId) {
      let now = performance.now();
      let rtt = now - ping.ping;
      this.ping = rtt <= this.ping ? (this.ping * 0.5) + (rtt * 0.5) : rtt;
    } else {
      let encodedData = MessagePack.encode(ping);
      this.addSendQueue(encodedData);
    }
  }

  private onData(data: ArrayBuffer) {
    this.timestamp = performance.now();
    let decoded: unknown = MessagePack.decode(new Uint8Array(data));

    let ping: Ping = decoded as Ping;
    if (ping.ping != null) {
      this.receivePing(ping);
      return;
    }

    let chank: DataChank = decoded as DataChank;
    if (chank.id == null) {
      this.emit('data', decoded);
      return;
    }

    let received = this.receivedMap.get(chank.id);
    if (received == null) {
      received = { id: chank.id, chanks: new Array(chank.total), length: 0, byteLength: 0 };
      this.receivedMap.set(chank.id, received);
    }

    if (received.chanks[chank.index] != null) return;

    received.length++;
    received.byteLength += chank.data.byteLength;
    received.chanks[chank.index] = chank.data;

    if (received.length < chank.total) return;
    this.receivedMap.delete(chank.id);

    let uint8Array = new Uint8Array(received.byteLength);

    let pos = 0;
    for (let c of received.chanks) {
      uint8Array.set(c, pos);
      pos += c.byteLength;
    }

    let decodedChank = MessagePack.decode(uint8Array);
    this.emit('data', decodedChank);
  }
}
