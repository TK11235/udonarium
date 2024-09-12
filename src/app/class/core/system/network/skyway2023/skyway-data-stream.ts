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
  private publicationDataChannel: RTCDataChannel;
  private subscriptionDataChannel: RTCDataChannel;

  private isQueuing = false;
  private sendQueue: Set<Uint8Array> = new Set();
  private reciveQueue: Set<MessageEvent> = new Set();

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

    console.log(`subscription ready ${member.name}`);
    let { subscription, stream } = await this.skyWay.roomPerson.subscribe<RemoteDataStream>(publication.id);

    if (this.subscription == null) {
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
      });

      console.log(`subscription done ${member.name} ${publication.id}`);
      this.subscription = subscription;
    }
    this.refresh();
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
    // 現在のオブジェクトを取得
    let member = this.member;
    let dataStream = this.skyWay.roomPerson?.subscriptions.find(
      subscription => subscription.publication.metadata === 'udonarium-data-stream'
        && subscription.publication.publisher.name === member?.name)?.stream as RemoteDataStream;

    let connection = (member as any)?._getConnection(this.skyWay.roomPerson?.id) as P2PConnection;
    this.publicationDataChannel = connection?.sender.datachannels[this.skyWay.publication?.id];
    this.subscriptionDataChannel = dataStream?._datachannel;

    // 接続状況確認
    let isConnected = this.publicationDataChannel?.readyState === 'open' && this.subscriptionDataChannel?.readyState === 'open';
    console.log(`peer ${member?.name} isConnected: ${isConnected}, `
      + `publication: ${this.publicationDataChannel?.readyState}, `
      + `subscription: ${this.subscriptionDataChannel?.readyState} (dataStream: ${dataStream?.id})`);

    // RTCDataChannelのイベントリスナーを更新
    if (this.publicationDataChannel) {
      this.publicationDataChannel.binaryType = 'arraybuffer';
      this.publicationDataChannel.onopen = event => {
        console.log(`peer ${member?.name} publicationDataChannel is open`);
        this.refresh();
      }
      if (isConnected) {
        this.publicationDataChannel.onmessage = event => {
          this.onData(event.data as ArrayBuffer);
        }
      } else {
        this.publicationDataChannel.onmessage = event => {
          console.log(`onmessage reciveQueue`);
          this.reciveQueue.add(event);
          this.refresh();
        }
      }
    }

    if (this.subscriptionDataChannel) {
      this.subscriptionDataChannel.binaryType = 'arraybuffer';
      this.subscriptionDataChannel.onopen = event => {
        console.log(`peer ${member?.name} subscriptionDataChannel is open`);
        this.refresh();
      }
    }

    // open or close
    if (isConnected !== this.peer.isOpen) {
      this.peer.isOpen = isConnected;
      if (isConnected) {
        this.emit('open');
      } else {
        this.emit('close');
      }
    }

    // モニタリング制御
    let peerConnection = this.getPeerConnection();
    this.stats = peerConnection ? new WebRTCStats(peerConnection) : null;

    if (isConnected) {
      this.startMonitoring();
      if (!this.isQueuing) this.execQueue();
    } else {
      this.stopMonitoring();
    }

    // 接続が確立する前に受信済みだったデータを処理
    if (this.publicationDataChannel && isConnected && this.reciveQueue.size) {
      console.log(`peer ${member?.name} reciveQueue ${this.reciveQueue.size}`);

      let events = Array.from(this.reciveQueue.values());
      this.reciveQueue.clear();

      for (let event of events) {
        this.onData(event.data as ArrayBuffer);
      }
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
    // subscriptionDataChannelからデータを送信する。
    // これはSkyWayのPub/Subモデル的には"逆流"する動作になるが、
    // Pub/SubのRTCDataChannelにアクセスできるようになるタイミングの都合から、このようにしないと接続初期の通信がパケットロスするかのような動作になるパターンがある。
    if (!this.subscriptionDataChannel || this.subscriptionDataChannel.readyState !== 'open') {
      console.warn(`peer Connection not open; queueing; ${this.subscriptionDataChannel?.readyState} -> ${this.member.name}`);
      this.isQueuing = false;
      return;
    }
    for (let data of this.sendQueue) {
      try {
        this.subscriptionDataChannel.send(data);
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
    this.addSendQueue(encodedData);
  }

  private receivePing(ping: Ping) {
    if (ping.from === this.peer.peerId) {
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
