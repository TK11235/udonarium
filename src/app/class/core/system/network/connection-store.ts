import 'skyway-peerjs/dist/peer.min.js'
import { } from 'skyway';
import { } from 'node';

// @types/skywayを使用すると@types/webrtcが定義エラーになるので代替案
declare var Peer;
declare module PeerJs {
  export type Peer = any;
  export type DataConnection = any;
}

interface DataContainer {
  data: any;
  peers: string[];
  isRelay: boolean;
}

export class ConnectionStoreCallback {
  willOpen: (peerId: string, sendFrom: string) => void;
  onTimeout: (peerId: string) => void;
  onOpen: (peerId: string) => void;
  onData: (peerId: string, data: any) => void;
  onClose: (peerId: string) => void;
  onError: (peerId: string, err: any) => void;
  onDetectUnknownPeers: (peerIds: string[]) => void;
}

export class ConnectionStore {
  readonly connections: PeerJs.DataConnection[] = [];
  readonly peerId: string;
  peerIds: string[] = [];
  readonly callback: ConnectionStoreCallback = null;

  constructor(peerId: string) {
    this.peerId = peerId;
    this.callback = new ConnectionStoreCallback();
  }

  open(conn: PeerJs.DataConnection) {
    if (this.add(conn) === false) return;

    let sendFrom: string = conn.label;
    if (this.callback.willOpen) this.callback.willOpen(conn.peer, sendFrom);

    let timeout: NodeJS.Timer = setTimeout(() => {
      if (this.callback.onTimeout) this.callback.onTimeout(conn.peer);
      this.close(conn);
    }, 15000);

    conn.on('data', data => {
      this.onData(conn, data);
    });
    conn.on('open', () => {
      if (timeout !== null) clearTimeout(timeout);
      timeout = null;
      this.update();
      if (this.callback.onOpen) this.callback.onOpen(conn.peer);
    });
    conn.on('close', () => {
      if (timeout !== null) clearTimeout(timeout);
      timeout = null;
      this.close(conn);
      if (this.callback.onClose) this.callback.onClose(conn.peer);
    });
    conn.on('error', err => {
      if (timeout !== null) clearTimeout(timeout);
      timeout = null;
      this.close(conn);
      if (this.callback.onError) this.callback.onError(conn.peer, err);
    });
  }

  close(conn: PeerJs.DataConnection) {
    conn.close();
    let index = this.connections.indexOf(conn);
    if (0 <= index) {
      console.log(conn.peer + ' is えんいー' + 'index:' + index + ' length:' + this.connections.length);
      this.connections.splice(index, 1);
    }
    console.log('<close()> Peer:' + conn.peer + ' length:' + this.connections.length);
    this.update();
  }

  closeAll() {
    console.log('<closeAllDataConnection()>');
    for (let conn of this.connections.concat()) {
      this.close(conn);
    }
  }

  send(data: any, sendTo?: string) {
    let container: DataContainer = {
      data: data,
      peers: this.peerIds.concat(),
      isRelay: false
    }

    if (sendTo) {
      this.sendUnicast(container, sendTo);
    } else {
      this.sendBroadcast(container);
    }
  }

  private sendUnicast(container: DataContainer, sendTo: string) {
    container.isRelay = false;
    let conn = this.find(sendTo);
    if (conn && conn.open) conn.send(container);
  }

  private sendBroadcast(container: DataContainer) {
    container.isRelay = true;
    for (let conn of this.connections) {
      if (conn.open) conn.send(container);
    }
  }

  private onData(conn: PeerJs.DataConnection, container: DataContainer) {
    if (container.isRelay) {
      this.onRelay(container);
    }
    if (this.callback.onData) this.callback.onData(conn.peer, container.data);
  }

  private onRelay(container: DataContainer) {
    let others: string[] = container.peers;
    let peerIds: string[] = this.peerIds.concat();//this.peers.concat();

    if (!others || others.length < 1) return;
    // 自分の知らないPeerが含まれている
    let unknownPeers = [];
    let knownPeers = [];
    for (let other of others) {
      let isUnknown = true;
      let length = peerIds.length;
      for (let i = 0; i < length; i++) {
        if (other === peerIds[i]) {
          isUnknown = false;
          knownPeers.push(peerIds.splice(i, 1));
          break;
        }
      }
      if (isUnknown) {
        if (this.peerId !== other && this.find(other) === null) {
          unknownPeers.push(other);
        }
      }
    }


    if (unknownPeers.length) {
      if (this.callback.onDetectUnknownPeers) this.callback.onDetectUnknownPeers(unknownPeers);
    }

    if (peerIds.length < 1) return;

    // 送信宛先に含まれていないPeerを知っている
    for (let peerId of peerIds) {
      let conn = this.find(peerId);
      if (conn) {
        container.peers.push(peerId)
      }
    }
    for (let peerId of peerIds) {
      let conn = this.find(peerId);
      if (conn) {
        if (conn.open) {
          console.log('<' + peerId + '> is 転送しなきゃ・・・ ', container);
          conn.send(container);
        }
      }
    }
  }

  private add(conn: PeerJs.DataConnection): boolean {
    let existConn = this.find(conn.peer);
    if (existConn !== null) {
      console.log('add() is Fail. ' + conn.peer + ' is already connecting.');
      if (existConn !== conn) {
        if (existConn.metadata.sendFrom < conn.metadata.sendFrom) {
          this.close(conn);
        } else {
          this.close(existConn);
          this.add(conn);
          return true;
        }
      }
      return false;
    }
    this.connections.push(conn);
    console.log('<add()> Peer:' + conn.peer + ' length:' + this.connections.length);
    return true;
  }

  find(peerId: string): PeerJs.DataConnection {
    for (let conn of this.connections) {
      if (conn.peer === peerId) {
        return conn;
      }
    }
    return null;
  }

  private update(): string[] {
    let peers: string[] = [];
    for (let conn of this.connections) {
      if (conn.open) peers.push(conn.peer);
    }
    peers.push(this.peerId);
    peers.sort(function (a, b) {
      if (a > b) return 1;
      if (a < b) return -1;
      return 0;
    });

    this.peerIds = peers;

    console.log('<update()>', peers);
    return peers;
  }
}
