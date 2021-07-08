import { setZeroTimeout } from '../util/zero-timeout';
import { Connection, ConnectionCallback } from './connection';
import { IPeerContext, PeerContext } from './peer-context';
import { SkyWayConnection } from './skyway-connection';

type QueueItem = { data: any, sendTo: string };

const unknownContext = PeerContext.parse('???');

export class Network {
  private static _instance: Network
  static get instance(): Network {
    if (!Network._instance) Network._instance = new Network();
    return Network._instance;
  }

  get peerId(): string { return this.connection ? this.connection.peerId : unknownContext.peerId; }
  get peerIds(): string[] { return this.connection ? this.connection.peerIds.concat() : []; }

  get peerContexts(): IPeerContext[] { return this.connection ? this.connection.peerContexts.concat() : []; }
  get peerContext(): IPeerContext { return this.connection ? this.connection.peerContext : unknownContext; }

  get isOpen(): boolean { return this.connection && this.connection.peerContext ? this.connection.peerContext.isOpen : false; }

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

  open(peerId?: string)
  open(userId: string, roomId: string, roomName: string, password: string)
  open(...args: any[]) {
    if (this.connection && this.connection.peerContext) {
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

  connect(peerId: string): boolean {
    if (this.connection) return this.connection.connect(peerId);
    return false;
  }

  disconnect(peerId: string) {
    if (!this.connection) return;
    if (this.connection.disconnect(peerId)) {
      console.log('<disconnectPeer()> Peer:' + peerId);
      this.disconnect(peerId);
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
      this.callback.onData(this.peerId, echocast);
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

  private initializeConnection(): Connection {
    let store = new SkyWayConnection();
    store.setApiKey(this.key);

    store.callback.onOpen = (peerId) => { if (this.callback.onOpen) this.callback.onOpen(peerId); }
    store.callback.onClose = (peerId) => { if (this.callback.onClose) this.callback.onClose(peerId); }
    store.callback.onConnect = (peerId) => { if (this.callback.onConnect) this.callback.onConnect(peerId); }
    store.callback.onDisconnect = (peerId) => { if (this.callback.onDisconnect) this.callback.onDisconnect(peerId); }
    store.callback.onData = (peerId, data: any[]) => { if (this.callback.onData) this.callback.onData(peerId, data); }
    store.callback.onError = (peerId, errorType, errorMessage, errorObject) => { if (this.callback.onError) this.callback.onError(peerId, errorType, errorMessage, errorObject); }

    if (0 < this.queue.size && this.sendInterval === null) this.sendInterval = setZeroTimeout(this.sendCallback);

    return store;
  }
}
