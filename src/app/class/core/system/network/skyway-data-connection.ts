import { EventEmitter } from 'events';
import * as MessagePack from 'msgpack-lite';

import { UUID } from '../util/uuid';
import { setZeroTimeout } from '../util/zero-timeout';

// @types/skywayを使用すると@types/webrtcが定義エラーになるので代替定義
declare module PeerJs {
  export type Peer = any;
  export type DataConnection = any;
}

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

export class SkyWayDataConnection extends EventEmitter {
  private chunkSize = 15.5 * 1024;
  private receivedMap: Map<string, ReceivedChank> = new Map();

  get open(): boolean { return this.conn.open; }
  get remoteId(): string { return this.conn.remoteId; }
  get metadata(): any { return this.conn.metadata; }

  constructor(private conn: PeerJs.DataConnection) {
    super();
    conn.on('data', data => this.onData(data));
    conn.on('open', () => {
      exchangeSkyWayImplementation(conn);
      this.emit('open');
    });
    conn.on('close', () => this.emit('close'));
    conn.on('error', err => this.emit('error', err));
  }

  close() {
    this.conn.close();
  }

  send(data: any) {
    let encodedData: Uint8Array = MessagePack.encode(data);

    let total = Math.ceil(encodedData.byteLength / this.chunkSize);
    if (total <= 1) {
      this.conn.send(encodedData);
      return;
    }

    let id = UUID.generateUuid();

    let sliceData: Uint8Array = null;
    let chank: DataChank = null;
    for (let sliceIndex = 0; sliceIndex < total; sliceIndex++) {
      sliceData = encodedData.slice(sliceIndex * this.chunkSize, (sliceIndex + 1) * this.chunkSize);
      chank = { id: id, data: sliceData, index: sliceIndex, total: total };
      this.conn.send(MessagePack.encode(chank));
    }
  }

  private onData(data: ArrayBuffer) {
    let chank: DataChank = MessagePack.decode(new Uint8Array(data));

    if (chank.id == null) {
      this.emit('data', chank);
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

    let decodedData = MessagePack.decode(uint8Array);

    this.emit('data', decodedData);
  }
}

/* 
SkyWay の DataConnection._startSendLoop() を取り替える.
setInterval() に由来する遅延を解消するが skyway-js-sdk の更新次第で動作しなくなるので注意.

https://github.com/skyway/skyway-js-sdk/blob/master/src/peer/dataConnection.js
*/
function exchangeSkyWayImplementation(conn: PeerJs.DataConnection) {
  if (conn._dc && conn._sendBuffer) {
    conn._startSendLoop = startSendLoopZeroTimeout;
  }
}

function startSendLoopZeroTimeout() {
  if (!this.sendInterval) {
    this.sendInterval = setZeroTimeout(sendBuffertZeroTimeout.bind(this));
  }
}

function sendBuffertZeroTimeout() {
  const currMsg = this._sendBuffer.shift();
  try {
    this._dc.send(currMsg);
  } catch (error) {
    this._sendBuffer.push(currMsg);
  }

  if (this._sendBuffer.length === 0) {
    this.sendInterval = undefined;
  } else {
    this.sendInterval = setZeroTimeout(sendBuffertZeroTimeout.bind(this));
  }
}
