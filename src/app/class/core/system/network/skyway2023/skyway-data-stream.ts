import { P2PConnection, RemoteDataStream, RemoteMember, Subscription } from "@skyway-sdk/core";
import { EventEmitter } from "events";
import { MessagePack } from "../../util/message-pack";
import { UUID } from "../../util/uuid";
import { setZeroTimeout } from "../../util/zero-timeout";
import { IPeerContext, PeerContext } from "../peer-context";
import { PeerSessionGrade } from "../peer-session-state";
import { CandidateType, WebRTCStats } from "../webrtc/webrtc-stats";
import { WebRTCConnection, WebRTCStatsMonitor } from "../webrtc/webrtc-stats-monitor";
import { SkyWayFacade } from "./skyway-facade";

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

  private subscription: Subscription<RemoteDataStream>;
  private senderDataChannel: RTCDataChannel;
  private receiverDataChannel: RTCDataChannel;

  private isBuffering = false;
  private buffer: Set<Uint8Array> = new Set();

  private _timestamp: number = performance.now();
  get timestamp(): number { return this._timestamp; }
  private set timestamp(timestamp: number) { this._timestamp = timestamp };

  private _ping: number = 0;
  get ping(): number { return this._ping; }
  private set ping(ping: number) { this._ping = ping };

  private _candidateType: CandidateType = CandidateType.UNKNOWN;
  get candidateType(): CandidateType { return this._candidateType; }
  private set candidateType(candidateType: CandidateType) { this._candidateType = candidateType };

  constructor(readonly skyWay: SkyWayFacade, peer: IPeerContext) {
    super();

    this.peer = PeerContext.parse(peer.peerId);
    this.peer.userId = peer.userId;
    this.peer.password = peer.password;
  }

  async subscribe() {
    if (!this.shouldSubscribe()) return;

    let member = this.member;
    let publication = member.publications.find(publication => publication.metadata === 'udonarium-data-stream');

    console.log(`subscription ready ${publication.id}`);
    let { subscription, stream } = await this.skyWay.roomPerson.subscribe<RemoteDataStream>(publication.id);

    subscription.onCanceled.add(() => {
      console.log(`subscription onCanceled ${member.name}`);
      this.subscription = null;
    });

    subscription.onStreamAttached.add(() => {
      console.log(`subscription onStreamAttached ${member.name}`);
    });

    subscription.onConnectionStateChanged.add(state => {
      console.log(`subscription onConnectionStateChanged ${member.name} -> ${state}`);
      this.refresh();
      switch (state) {
        case 'new':
          break;
        case 'connecting':
          break;
        case 'connected':
          this.emit('open');
          break;
        case 'reconnecting':
          break;
        case 'disconnected':
          this.emit('close');
          break;
      }
    });

    this.subscription = subscription;
    this.refresh();
    this.emit('open');
  }

  private shouldSubscribe(): boolean {
    if (!this.skyWay.roomPerson) {
      console.log('roomPerson is null');
      return false;
    }

    let member = this.member;
    if (!member) {
      console.log(`connect member is not found`);
      return false;
    }

    console.log(`member.publications ${member.name}`, member.publications);
    let publication = member.publications.find(publication => publication.metadata === 'udonarium-data-stream');
    if (!publication) {
      console.log(`'udonarium-data-stream' is not found`);
      return false;
    }

    if (this.skyWay.roomPerson.subscriptions.find(subscription => subscription.publication.id === publication.id)) {
      console.log(`'udonarium-data-stream' is already subscribed.`);
      return false;
    }
    return true;
  }

  async unsubscribe() {
    await this.subscription?.cancel();
    this.subscription = null;
    this.peer.isOpen = false;
    this.stopMonitoring();
    this.refresh();
  }

  refresh() {
    let member = this.member;
    let dataStream = this.subscription?.stream;

    dataStream?.onData.removeAllListeners();
    dataStream?.onData.add(data => {
      if (!(data instanceof ArrayBuffer)) {
        console.log(`data is not ArrayBuffer`);
        return;
      }
      this.onData(data);
    });

    let connection = (member as any)?._getConnection(this.skyWay.roomPerson?.id) as P2PConnection;

    this.senderDataChannel = connection?.sender.datachannels[this.skyWay.publication?.id];
    this.receiverDataChannel = dataStream?._datachannel;

    this.peer.isOpen = this.skyWay.isConnectedDataStream(member);

    let peerConnection = this.getPeerConnection();
    this.stats = peerConnection ? new WebRTCStats(peerConnection) : null;

    if (this.peer.isOpen) {
      this.startMonitoring();
      if (!this.isBuffering) this.sendBuffer();
    } else {
      this.stopMonitoring();
    }
  }

  send(data: any) {
    let encodedData: Uint8Array = MessagePack.encode(data);

    let total = Math.ceil(encodedData.byteLength / this.chunkSize);
    if (total <= 1) {
      this.bufferedSend(encodedData);
      return;
    }

    let id = UUID.generateUuid();

    let sliceData: Uint8Array = null;
    let chank: DataChank = null;
    for (let sliceIndex = 0; sliceIndex < total; sliceIndex++) {
      sliceData = encodedData.slice(sliceIndex * this.chunkSize, (sliceIndex + 1) * this.chunkSize);
      chank = { id: id, data: sliceData, index: sliceIndex, total: total };
      this.bufferedSend(MessagePack.encode(chank));
    }
  }

  private bufferedSend(data: Uint8Array) {
    this.buffer.add(data);
    if (!this.isBuffering) this.sendBuffer();
  }

  private sendBuffer = () => {
    if (!this.senderDataChannel || this.senderDataChannel.readyState !== 'open') {
      this.isBuffering = false;
      return;
    }
    for (let data of this.buffer) {
      try {
        this.senderDataChannel.send(data);
        this.buffer.delete(data);
      } catch (err) {
        console.error(err);
      }
      break;
    }
    this.isBuffering = 0 < this.buffer.size;
    if (this.isBuffering) setZeroTimeout(this.sendBuffer);
  }

  getPeerConnection(): RTCPeerConnection {
    return this.subscription?.stream?._getRTCPeerConnection();
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
    let encodedData: Uint8Array = MessagePack.encode({ from: this.peer.peerId, ping: performance.now() });
    this.bufferedSend(encodedData);
  }

  private receivePing(ping: Ping) {
    if (ping.from === this.peer.peerId) {
      let now = performance.now();
      let rtt = now - ping.ping;
      this.ping = rtt <= this.ping ? (this.ping * 0.5) + (rtt * 0.5) : rtt;
    } else {
      let encodedData = MessagePack.encode(ping);
      this.bufferedSend(encodedData);
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
