import { Connection, ConnectionCallback } from './connection';
import { SkyWayConnection } from './skyway-connection';
import { IPeerContext } from './peer-context';
import { setZeroTimeout } from '../util/zero-timeout';

export class Network {
  private static _instance: Network
  static get instance(): Network {
    if (!Network._instance) Network._instance = new Network();
    return Network._instance;
  }

  get peerId(): string { return this.connection ? this.connection.peerId : '???'; }
  get peerIds(): string[] { return this.connection ? this.connection.peerIds.concat() : []; }

  get peerContexts(): IPeerContext[] { return this.connection ? this.connection.peerContexts.concat() : []; }
  get peerContext(): IPeerContext { return this.connection ? this.connection.peerContext : null; }

  get isConnected(): boolean { return this.connection && this.connection.peerContext ? this.connection.peerContext.isOpen : false; }

  readonly callback: ConnectionCallback = new ConnectionCallback();
  get bandwidthUsage(): number { return this.connection ? this.connection.bandwidthUsage : 0; }

  private key: string = '';
  private connection: Connection;

  private queue: any[] = [];
  private sendInterval: number = null;
  private sendCallback = () => { this.sendQueue(); }
  private callbackUnload: any = (e) => { this.close(); };

  private constructor() {
    console.log('Network ready...');
  }

  open(peerId?: string)
  open(peerId: string, roomId: string, roomName: string, password: string)
  open(...args: any[]) {
    if (this.connection && this.connection.peerContext) {
      console.warn('It is already opened.');
      this.close();
    }

    console.log('PeerRoom ready...', args);
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

  send(data: any) {
    this.queue.push(data);
    if (this.sendInterval === null) {
      this.sendInterval = setZeroTimeout(this.sendCallback);
    }
  }

  private sendQueue() {
    let broadcast: any[] = [];
    let unicast: { [sendTo: string]: any[] } = {};

    let loop = this.queue.length < 128 ? this.queue.length : 128;
    //console.warn(this.queue.length);
    for (let i = 0; i < loop; i++) {
      let event = this.queue[i];
      if (event.sendTo == null) {
        if (this.callback.onData) this.callback.onData(event.sendTo, [event]);
        broadcast[broadcast.length] = event;
      } else if (event.sendTo === this.peerId) {
        if (this.callback.onData) this.callback.onData(event.sendTo, [event]);
      } else {
        if (!(event.sendTo in unicast)) unicast[event.sendTo] = [];
        unicast[event.sendTo][unicast[event.sendTo].length] = event;
      }
    }
    this.queue.splice(0, loop);
    // できるだけ一纏めにして送る
    if (this.connection) {
      if (broadcast.length) this.connection.send(broadcast);
      for (let sendTo in unicast) this.connection.send(unicast[sendTo], sendTo);
    }
    if (0 < this.queue.length) {
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

    store.callback.willOpen = (peerId, sendFrom) => { if (this.callback.willOpen) this.callback.willOpen(peerId, sendFrom); }
    store.callback.onTimeout = (peerId) => { if (this.callback.onTimeout) this.callback.onTimeout(peerId); }
    store.callback.onOpen = (peerId) => { if (this.callback.onOpen) this.callback.onOpen(peerId); }
    store.callback.onData = (peerId, data: any[]) => { if (this.callback.onData) this.callback.onData(peerId, data); }
    store.callback.onClose = (peerId) => { if (this.callback.onClose) this.callback.onClose(peerId); }
    store.callback.onError = (peerId, err) => { if (this.callback.onError) this.callback.onError(peerId, err); }
    store.callback.onDetectUnknownPeers = (peerIds) => { if (this.callback.onDetectUnknownPeers) this.callback.onDetectUnknownPeers(peerIds); }

    if (0 < this.queue.length && this.sendInterval === null) this.sendInterval = setZeroTimeout(this.sendCallback);

    return store;
  }
}
