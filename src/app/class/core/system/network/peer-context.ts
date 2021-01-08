import * as lzbase62 from 'lzbase62/lzbase62.min.js';
import * as CryptoJS from 'crypto-js/core.js';
import * as SHA256 from 'crypto-js/sha256.js';

import { base } from '../util/base-x';

const Base62 = base('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
const roomIdPattern = /^(\w{6})(\w{3})(\w*)-(\w*)/i;

export interface IPeerContext {
  readonly peerId: string;
  readonly userId: string;
  readonly roomId: string;
  readonly roomName: string;
  readonly password: string;
  readonly digestUserId: string;
  readonly digestPassword: string;
  readonly isOpen: boolean;
  readonly isRoom: boolean;
  readonly hasPassword: boolean;
}

export class PeerContext implements IPeerContext {
  peerId: string = '';
  userId: string = '';
  roomId: string = '';
  roomName: string = '';
  password: string = '';
  digestUserId: string = '';
  digestPassword: string = '';
  isOpen: boolean = false;

  get isRoom(): boolean { return 0 < this.roomId.length; }
  get hasPassword(): boolean { return 0 < this.password.length + this.digestPassword.length; }

  private constructor(peerId: string) {
    this.parse(peerId);
  }

  private parse(peerId: string) {
    try {
      this.peerId = peerId;
      let regArray = roomIdPattern.exec(peerId);
      let isRoom = regArray != null;
      if (isRoom) {
        this.digestUserId = regArray[1];
        this.roomId = regArray[2];
        this.roomName = lzbase62.decompress(regArray[3]);
        this.digestPassword = regArray[4];
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    this.digestUserId = peerId;
    return;
  }

  verifyPassword(password: string): boolean {
    let digest = calcDigestPassword(this.roomId, password);
    let isCorrect = digest === this.digestPassword;
    return isCorrect;
  }

  static parse(peerId: string): PeerContext {
    return new PeerContext(peerId);
  }

  static create(userId: string): PeerContext
  static create(userId: string, roomId: string, roomName: string, password: string): PeerContext
  static create(...args: any[]): PeerContext {
    if (args.length <= 1) {
      return PeerContext._create.apply(this, args);
    } else {
      return PeerContext._createRoom.apply(this, args);
    }
  }

  private static _create(userId: string = ''): PeerContext {
    let digestUserId = calcDigestUserId(userId);
    let peerContext = new PeerContext(digestUserId);

    peerContext.userId = userId;
    return peerContext;
  }

  private static _createRoom(userId: string = '', roomId: string = '', roomName: string = '', password: string = ''): PeerContext {
    let digestUserId = this.generateId('******');
    let digestPassword = calcDigestPassword(roomId, password);
    let peerId = `${digestUserId}${roomId}${lzbase62.compress(roomName)}-${digestPassword}`;

    let peerContext = new PeerContext(peerId);
    peerContext.userId = userId;
    peerContext.password = password;
    return peerContext;
  }

  static generateId(format: string = '********'): string {
    const h: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let k: string = format;
    k = format.replace(/\*/g, c => h[Math.floor(Math.random() * (h.length))]);

    return k;
  }
}

function calcDigestUserId(userId: string): string {
  if (userId == null) return '';
  return calcDigest(userId);
}

function calcDigestPassword(roomId: string, password: string): string {
  if (roomId == null || password == null) return '';
  return 0 < password.length ? calcDigest(roomId + password, 7) : '';
}

function calcDigest(str: string, truncateLength: number = -1): string {
  if (str == null) return '';
  let hash = SHA256(str);
  let array = new Uint8Array(Uint32Array.from(hash.words).buffer);
  let base62 = Base62.encode(array);

  if (truncateLength < 0) truncateLength = base62.length;
  if (base62.length < truncateLength) truncateLength = base62.length;

  base62 = base62.slice(0, truncateLength);
  return base62;
}
