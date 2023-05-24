import * as SHA256 from 'crypto-js/sha256';
import * as lzbase62 from 'lzbase62';

import * as base from 'base-x';
import { MutablePeerSessionState, PeerSessionGrade, PeerSessionState } from './peer-session-state';

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
  readonly session: PeerSessionState;
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
  session: MutablePeerSessionState = { grade: PeerSessionGrade.UNSPECIFIED, ping: 0, health: 0, speed: 0, description: '' };

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
    let digest = calcDigestPassword(this.digestUserId, this.roomId, this.roomName, password);
    let isCorrect = digest === this.digestPassword;
    return isCorrect && this.verifyRoomId(password);
  }

  private verifyRoomId(password: string): boolean {
    let checksumedRoomId = calcChecksumedRoomId(this.roomId, this.roomName, password);
    let isCorrect = checksumedRoomId === this.roomId;
    return isCorrect;
  }

  verifyPeer(peerId: string): boolean {
    let peer = PeerContext.parse(peerId);
    if (this.roomId != peer.roomId || this.roomName != peer.roomName || this.hasPassword != peer.hasPassword) {
      return false;
    }

    if (!this.hasPassword) {
      return true;
    }

    if (this.password.length < 1) {
      console.error('do not know password.');
      return false;
    }

    let isValid = peer.verifyPassword(this.password);
    return isValid;
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
    let peer = new PeerContext(digestUserId);

    peer.userId = userId;
    return peer;
  }

  private static _createRoom(userId: string = '', roomId: string = '', roomName: string = '', password: string = ''): PeerContext {
    let digestUserId = calcDigest(userId, 6);
    let checksumedRoomId = calcChecksumedRoomId(roomId, roomName, password);
    let digestPassword = calcDigestPassword(digestUserId, checksumedRoomId, roomName, password);
    let peerId = `${digestUserId}${checksumedRoomId}${lzbase62.compress(roomName)}-${digestPassword}`;

    let peer = new PeerContext(peerId);
    peer.userId = userId;
    peer.password = password;
    return peer;
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

function calcDigestPassword(digestUserId: string, roomId: string, roomName: string, password: string): string {
  if (roomId == null || password == null) return '';
  return 0 < password.length ? calcDigest(digestUserId + roomId + roomName + password, 7) : '';
}

function calcChecksumedRoomId(roomId: string, roomName: string, password: string): string {
  if (password.length < 1) return roomId;
  let salt = roomId.slice(0, 2);
  return salt + calcDigest(salt + roomName + password, 1);
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
