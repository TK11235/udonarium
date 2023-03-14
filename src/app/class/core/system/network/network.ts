import { setZeroTimeout } from '../util/zero-timeout';
import { Connection, ConnectionCallback } from './connection';
import { IPeerContext, PeerContext } from './peer-context';
import { IRoomInfo } from './room-info';
import { SkyWayConnection } from './skyway/skyway-connection';

type QueueItem = { data: any, sendTo: string };

const unknownPeer = PeerContext.parse('???');

export class Network {
  private static _instance: Network
  static get instance(): Network {
    if (!Network._instance) Network._instance = new Network();
    return Network._instance;
  }
  get isOpen(): boolean { return this.connection ? this.connection.peer.isOpen : false; }

  get peerId(): string { return this.connection ? this.connection.peerId : unknownPeer.peerId; }
  get peerIds(): string[] { return this.connection ? this.connection.peerIds.concat() : []; }

  get peer(): IPeerContext { return this.connection ? this.connection.peer : unknownPeer; }
  get peers(): IPeerContext[] { return this.connection ? this.connection.peers.concat() : []; }

  readonly callback: ConnectionCallback = new ConnectionCallback();
  get bandwidthUsage(): number { return this.connection ? this.connection.bandwidthUsage : 0; }

  private key: string = '';
  private connection: Connection;

  private queue: Set<QueueItem> = new Set();
  private sendInterval: number = null;
  private sendCallback = () => { this.sendQueue(); }
  private callbackUnload: any = (e) => { this.close(); };

  private constructor() {
    console.log('Network ready...');
  }

  open(userId?: string)
  open(userId: string, roomId: string, roomName: string, password: string)
  open(...args: any[]) {
    if (this.connection && this.connection.peer) {
      console.warn('It is already opened.');
      this.close();
    }

    console.log('Network open...', args);
    this.connection = this.initializeConnection();
    this.connection.open.apply(this.connection, args);

    window.addEventListener('unload', this.callbackUnload, false);
  }

  private close() {
    if (this.connection) this.connection.close();
    this.connection = null;
    window.removeEventListener('unload', this.callbackUnload, false);
    console.log('Network close...');
  }

  connect(peer: IPeerContext): boolean {
    if (this.connection) return this.connection.connect(peer);
    return false;
  }

  disconnect(peer: IPeerContext) {
    if (!this.connection) return;
    if (this.connection.disconnect(peer)) {
      console.log('<disconnectPeer()> Peer:' + peer.peerId);
      this.disconnect(peer);
    }
  }

  send(data: any, sendTo?: string) {
    this.queue.add({ data: data, sendTo: sendTo });
    if (this.sendInterval === null) {
      this.sendInterval = setZeroTimeout(this.sendCallback);
    }
  }

  private sendQueue() {
    let broadcast: any[] = [];
    let unicast: { [sendTo: string]: any[] } = {};
    let echocast: any[] = [];

    let loopCount = this.queue.size < 128 ? this.queue.size : 128;
    for (let item of this.queue) {
      if (loopCount <= 0) break;
      loopCount--;
      this.queue.delete(item);
      if (item.sendTo == null) {
        broadcast.push(item.data);
      } else if (item.sendTo === this.peerId) {
        echocast.push(item.data);
      } else {
        if (!(item.sendTo in unicast)) unicast[item.sendTo] = [];
        unicast[item.sendTo].push(item.data);
      }
    }

    // できるだけ一纏めにして送る
    if (this.connection) {
      if (broadcast.length) this.connection.send(broadcast);
      for (let sendTo in unicast) this.connection.send(unicast[sendTo], sendTo);
    }

    // 自分自身への送信
    if (this.callback.onData) {
      this.callback.onData(null, broadcast);
      this.callback.onData(this.peer, echocast);
    }

    if (0 < this.queue.size) {
      this.sendInterval = setZeroTimeout(this.sendCallback);
    } else {
      this.sendInterval = null;
    }
  }

  setApiKey(key: string) {
    if (this.key !== key) console.log('Key Change');
    this.key = key;
  }

  listAllPeers(): Promise<string[]> {
    return this.connection ? this.connection.listAllPeers() : Promise.resolve([]);
  }

  listAllRooms(): Promise<IRoomInfo[]> {
    return this.connection ? this.connection.listAllRooms() : Promise.resolve([]);
  }

  private initializeConnection(): Connection {
    let connection = new SkyWayConnection();
    connection.setApiKey(this.key);

    connection.callback.onOpen = (peer) => { if (this.callback.onOpen) this.callback.onOpen(peer); }
    connection.callback.onClose = (peer) => { if (this.callback.onClose) this.callback.onClose(peer); }
    connection.callback.onConnect = (peer) => { if (this.callback.onConnect) this.callback.onConnect(peer); }
    connection.callback.onDisconnect = (peer) => { if (this.callback.onDisconnect) this.callback.onDisconnect(peer); }
    connection.callback.onData = (peer, data: any[]) => { if (this.callback.onData) this.callback.onData(peer, data); }
    connection.callback.onError = (peer, errorType, errorMessage, errorObject) => { if (this.callback.onError) this.callback.onError(peer, errorType, errorMessage, errorObject); }

    if (0 < this.queue.size && this.sendInterval === null) this.sendInterval = setZeroTimeout(this.sendCallback);

    return connection;
  }
}
