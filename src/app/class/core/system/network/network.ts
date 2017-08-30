import { ConnectionStore } from './connection-store';
import { EventSystem } from '../event/event-system';
import { EventContext } from '../event/event';

import { PeerContext, IPeerContext } from './peer-context';

import 'skyway-peerjs/dist/peer.min.js';
import { } from 'skyway';

// @types/skywayを使用すると@types/webrtcが定義エラーになるので代替案
declare var Peer;
declare module PeerJs {
  export type Peer = any;
  export type DataConnection = any;
}

export class Network {
  private static _instance: Network
  private key: string = '';
  private httpRequestInterval: number = performance.now() + 500;
  private listAllPeersCache: string[] = [];

  private callbackBeforeunload: any = (e) => { this.destroy(); };

  static get instance(): Network {
    if (!Network._instance) Network._instance = new Network();
    return Network._instance;
  }

  //peerId: string = '???';
  get peerId(): string {
    return this.peerContext ? this.peerContext.fullstring : '???';
  }

  peerContext: PeerContext;
  get peerIds(): string[] {
    return this.store ? this.store.peerIds.concat() : [];
  }
  get isConnected(): boolean {
    return this.peer ? !this.peer.disconnected : false;
  }
  private peer: PeerJs.Peer;
  private store: ConnectionStore;

  get connections(): PeerJs.DataConnection[] {
    return this.store ? this.store.connections : [];
  }

  private queue: EventContext[] = [];
  private sendInterval: NodeJS.Timer = null;
  private sendCallback = () => { this.sendQueue(); }

  private constructor() {
    console.log('Network ready...');
    EventSystem.instance.register(this)
      .on('OTHER_PEERS', event => {
        for (let peerId of event.data.otherPeers.concat()) {
          if (this.store.find(peerId) === null && peerId !== this.peerId) {
            console.log('connectingOtherPeers <' + peerId + '>');
            this.connect(peerId);
          }
        }
      });
  }

  private destroy() {
    if (this.peer) this.peer.destroy();
    if (this.store) this.store.closeAll();
    EventSystem.instance.unregister(this);
    Network._instance = null;
    this.peer = null;
    this.store = null;
    window.removeEventListener('beforeunload', this.callbackBeforeunload, false);
  }

  setApiKey(key: string) {
    if (this.key !== key) console.log('Key Change ', key);
    this.key = key;
  }

  open(peerId?: string)
  open(peerId: string, roomId: string, roomName: string, isPrivate: boolean, password: string)
  open(...args: any[]) {
    if (this.peer) {
      console.warn('It is already opened.');
      this.close();
    }

    console.log('PeerRoom ready...', args);
    this.peer = this.createPeer.apply(this, args);
    this.store = this.createConnectionStore();

    window.addEventListener('beforeunload', this.callbackBeforeunload, false);
  }

  private close() {
    if (this.peer) this.peer.destroy();
    if (this.store) this.store.closeAll();
    this.peer = null;
    this.store = null;
    window.removeEventListener('beforeunload', this.callbackBeforeunload, false);
    console.log('Network close...');
  }

  connect(peerId: string): PeerJs.DataConnection {
    if (!this.shouldConnect(peerId)) return null;

    let conn: PeerJs.DataConnection = this.peer.connect(peerId, {
      label: this.peerId,
      reliable: true,
      metadata: { sendFrom: this.peerId }
    });

    this.store.open(conn);
    return conn;
  }

  disconnect(peerId: string) {
    let conn = this.store.find(peerId);
    if (conn) {
      this.store.close(conn);
      console.log('<disconnectPeer()> Peer:' + peerId);
      this.disconnect(peerId);
    }
  }

  send(data: EventContext) {
    this.queue.push(data);
    if (this.sendInterval === null) {
      this.sendInterval = setTimeout(this.sendCallback, 0);
    }
  }

  private sendQueue() {
    let broadcast: EventContext[] = [];
    let unicast: { [sendTo: string]: EventContext[] } = {};

    let loop = this.queue.length < 2048 ? this.queue.length : 2048;
    //console.warn(this.queue.length);
    for (let i = 0; i < loop; i++) {
      let event = this.queue[i];
      if (event.sendTo == null) {
        EventSystem.instance.trigger(event);
        broadcast[broadcast.length] = event;
      } else if (event.sendTo === this.peerId) {
        EventSystem.instance.trigger(event);
      } else {
        if (!(event.sendTo in unicast)) unicast[event.sendTo] = [];
        unicast[event.sendTo][unicast[event.sendTo].length] = event;
      }
    }
    this.queue.splice(0, loop);
    // できるだけ一纏めにして送る
    if (this.store) {
      if (broadcast.length) this.store.send(broadcast);
      for (let sendTo in unicast) this.store.send(unicast[sendTo], sendTo);
    }

    this.sendInterval = null;
    if (this.queue.length) {
      this.sendInterval = setTimeout(this.sendCallback, 0);
    }
  }

  private shouldConnect(peerId: string): boolean {
    if (!this.peerId) {
      console.log('connectPeer() is Fail. IDが割り振られるまで待てや');
      return false;
    }

    if (this.peerId === peerId) {
      console.log('connectPeer() is Fail. ' + peerId + ' is me.');
      return false;
    }

    if (this.store.find(peerId)) {
      this.sendMessage('connectPeer() is Fail. <' + peerId + '> is already connecting.');
      return false;
    }
    if (peerId && peerId.length && peerId !== this.peerId) {
      return true;
    }
    return false;
  }

  listAllPeers(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let now = performance.now();
      if (now < this.httpRequestInterval) {
        console.warn('httpRequestInterval... ' + (this.httpRequestInterval - now));
        resolve(this.listAllPeersCache.concat());
        return;
      }
      this.httpRequestInterval = now + 6000;
      let url = 'https://skyway.io/active/list/' + this.key;
      let http = new XMLHttpRequest();

      // If there's no ID we need to wait for one before trying to init socket.
      http.open('get', url, true);
      http.onerror = (event) => {
        console.error(event);
        this.listAllPeersCache = [];
        resolve([]);
      };
      http.onreadystatechange = (event) => {
        if (http.readyState !== 4) {
          return;
        }
        if (http.status === 401) {
          console.error(http.status);
          this.listAllPeersCache = [];
          resolve([]);
        } else if (http.status !== 200) {
          this.listAllPeersCache = [];
          resolve([]);
        } else {
          let peerIds: string[] = null;
          try {
            peerIds = JSON.parse(http.responseText);
            console.log('listAllPeers...OK.');
            if (peerIds instanceof Array) {
              this.listAllPeersCache = peerIds.concat();
              resolve(peerIds);
              return;
            }
          } catch (e) {
            console.warn(e);
          }
          this.listAllPeersCache = [];
          resolve([]);
        }
      };
      console.log('listAllPeers...');
      http.send(null);
    });
  }

  private createPeer(peerId: string)
  private createPeer(peerId: string, roomId: string, roomName: string, isPrivate: boolean, password: string): PeerJs.Peer
  private createPeer(...args: any[]): PeerJs.Peer {
    console.log('createPeer', args);
    if (args.length === 0) {
      this.peerContext = PeerContext.create(PeerContext.generateId());
    } else if (args.length === 1) {
      this.peerContext = PeerContext.create(args[0]);
    } else {
      this.peerContext = PeerContext.create(args[0], args[1], args[2], args[3], args[4]);
    }
    let peer = new Peer(this.peerContext.fullstring, { key: this.key });// SkyWay

    peer.on('open', id => {
      console.log('My peer ID is: ' + id);
      if (!this.peerContext || this.peerContext.fullstring !== id) this.peerContext = new PeerContext(id);
      EventSystem.instance.trigger('OPEN_PEER', { peer: this.peerId });
    });

    peer.on('connection', conn => {
      this.store.open(conn);
    });

    peer.on('error', err => {
      this.sendMessage('<' + this.peerId + '> ' + err);
      console.error(err);
      if (err.toString() === 'Error: Lost connection to server.') {
        EventSystem.instance.trigger('LOST_CONNECTION_PEER', { peer: this.peerId });
      } else if (-1 < err.toString().indexOf('Error: Could not connect to peer ')) {
        let peer = err.toString().substring('Error: Could not connect to peer '.length);
        this.store.close(this.store.find(peer));
      }
    });
    return peer;
  }

  private createConnectionStore(): ConnectionStore {
    let store = new ConnectionStore(this.peerId);

    store.callback.willOpen = (peerId, sendFrom) => {
      if (sendFrom !== this.peerId) {
        this.sendMessage('Receive <' + peerId + '> connecting...');
      } else {
        this.sendMessage('Request <' + peerId + '> connecting...');
      }
    }

    store.callback.onTimeout = (peerId) => {
      this.sendMessage('timeout peer connection... <' + peerId + '>');
    }

    store.callback.onOpen = (peerId) => {
      this.sendMessage('<' + peerId + '> is Open <DataConnection>');
      EventSystem.instance.trigger('OPEN_OTHER_PEER', { peer: peerId });
      EventSystem.instance.call('OTHER_PEERS', { otherPeers: this.store.peerIds });
      //this.send([new eventSystem.Event('OTHER_PEERS', { otherPeers: this.store.peerIds }).toContext()]);
    }

    store.callback.onData = (peerId, data: EventContext[]) => {
      for (let event of data) {
        EventSystem.instance.trigger(event);
      }
    }

    store.callback.onClose = (peerId) => {
      this.sendMessage('<' + peerId + '> is closed <DataConnection>');
      EventSystem.instance.trigger('CLOSE_OTHER_PEER', { peer: peerId });
    }

    store.callback.onError = (peerId, err) => {
      this.sendMessage('<' + peerId + '> ' + err);
    }

    store.callback.onDetectUnknownPeers = (peerIds) => {
      console.warn('未接続のPeerを確認?', peerIds);
      EventSystem.instance.trigger('OTHER_PEERS', { otherPeers: peerIds });
    }

    if (0 < this.queue.length && this.sendInterval === null) {
      this.sendInterval = setTimeout(this.sendCallback, 0);
    }
    return store;
  }

  private sendMessage(message: string) {
    console.log(message);
    let chatMessage = {
      identifier: this.peerId + '_' + Math.random(),
      responseIdentifier: '',
      timestamp: '',
      imageIdentifier: '',
      tag: 'system',
      sender: 'システム<' + this.peerId + '>',
      text: message
    };
    //EventSystem.instance.trigger('BROADCAST_MESSAGE', chatMessage);
  }
}

setTimeout(function () { Network.instance; }, 0);
