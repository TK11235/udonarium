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
};

export class SkyWayDataConnection extends EventEmitter {
  private chunkSize = 15.5 * 1024;
  private receivedChankMap: Map<string, ReceivedChank> = new Map();

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

    for (let sliceIndex = 0; sliceIndex < total; sliceIndex++) {
      let sliceData = encodedData.slice(sliceIndex * this.chunkSize, (sliceIndex + 1) * this.chunkSize);
      let chank: DataChank = { id: id, data: sliceData, index: sliceIndex, total: total };
      this.conn.send(MessagePack.encode(chank));
    }
  }

  private onData(data: ArrayBuffer) {
    let chank: DataChank = MessagePack.decode(new Uint8Array(data));

    if (chank.id == null) {
      this.emit('data', chank);
      return;
    }

    let receivedChank = this.receivedChankMap.get(chank.id);
    if (receivedChank == null) {
      receivedChank = { id: chank.id, chanks: new Array(chank.total), length: 0 };
      this.receivedChankMap.set(chank.id, receivedChank);
    }

    if (receivedChank.chanks[chank.index] != null) return;

    receivedChank.length++;
    receivedChank.chanks[chank.index] = chank.data;

    if (receivedChank.length < chank.total) return;
    this.receivedChankMap.delete(chank.id);

    let sumLength = 0;
    for (let c of receivedChank.chanks) sumLength += c.byteLength;
    let uint8Array = new Uint8Array(sumLength);

    let pos = 0;
    for (let c of receivedChank.chanks) {
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
