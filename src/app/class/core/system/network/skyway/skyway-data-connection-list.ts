import { PeerContext } from '../peer-context';
import { SkyWayDataConnection } from './skyway-data-connection';

export class SkyWayDataConnectionList implements Iterable<SkyWayDataConnection> {
  private connections: SkyWayDataConnection[] = [];
  get length(): number { return this.connections.length; }

  [Symbol.iterator]() {
    let connections = this.connections.concat();
    let index = 0;
    return {
      next(): IteratorResult<SkyWayDataConnection> {
        return { value: connections[index++], done: connections.length + 1 <= index };
      }
    };
  }

  private needsRefreshPeers = false;
  private _peers: PeerContext[] = [];
  get peers(): PeerContext[] {
    if (this.needsRefreshPeers) {
      this.needsRefreshPeers = false;
      this._peers = this.connections.map(conn => conn.peer);
      this._peers.sort((a, b) => {
        if (a.peerId > b.peerId) return 1;
        if (a.peerId < b.peerId) return -1;
        return 0;
      });
    }
    return this._peers;
  }

  private needsRefreshPeerIds = false;
  private _peerIds: string[] = [];
  get peerIds(): string[] {
    if (this.needsRefreshPeerIds) {
      this.needsRefreshPeerIds = false;
      let peerIds: string[] = [];
      for (let conn of this.connections) {
        if (conn.open) peerIds.push(conn.remoteId);
      }
      peerIds.sort((a, b) => {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      });
      this._peerIds = peerIds;
    }
    return this._peerIds
  }

  add(conn: SkyWayDataConnection): SkyWayDataConnection {
    let existConn = this.find(conn.remoteId);
    if (existConn != null) {
      console.log('add() is Fail. ' + conn.remoteId + ' is already connecting.', existConn);
      if (existConn !== conn) {
        if (existConn.metadata.sortKey < conn.metadata.sortKey) {
          this.remove(conn);
        } else {
          this.remove(existConn);
          return this.add(conn);
        }
      }
      return null;
    }
    this.connections.push(conn);
    this.refresh();
    console.log('<add()> Peer:' + conn.remoteId + ' length:' + this.connections.length);
    return conn;
  }

  remove(conn: SkyWayDataConnection): SkyWayDataConnection {
    conn.close();
    let index = this.connections.indexOf(conn);
    if (0 <= index) {
      console.log(conn.remoteId + ' is えんいー' + 'index:' + index + ' length:' + this.connections.length);
      this.connections.splice(index, 1);
      this.refresh();
    }
    console.log('<close()> Peer:' + conn.remoteId + ' length:' + this.connections.length);
    return 0 <= index ? conn : null;
  }

  find(peerId: string): SkyWayDataConnection {
    return this.connections.find(conn => conn.remoteId === peerId);
  }

  refresh() {
    this.needsRefreshPeers = true;
    this.needsRefreshPeerIds = true;
  }
}
