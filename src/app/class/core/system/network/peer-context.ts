import * as lzbase62 from 'lzbase62/lzbase62.min.js';

export interface IPeerContext {
  readonly fullstring: string;
  readonly id: string;
  readonly room: string;
  readonly roomName: string;
  readonly password: string;
  readonly isOpen: boolean;
}

export class PeerContext implements IPeerContext {
  fullstring: string = '';
  id: string = '';
  room: string = '';
  roomName: string = '';
  password: string = '';
  isOpen: boolean = false;

  get isRoom(): boolean { return 0 < this.room.length ? true : false; }

  constructor(fullstring: string) {
    this.parse(fullstring);
  }

  private parse(fullstring) {
    try {
      this.fullstring = fullstring;
      let array = /^(\w{6})((\w{3})(\w*)-(\w*))?/ig.exec(fullstring);
      this.id = array[1];
      if (array[2] == null) return;
      this.room = array[3];
      this.roomName = lzbase62.decompress(array[4]);
      this.password = lzbase62.decompress(array[5]);
    } catch (e) {
      this.id = fullstring;
      console.warn(e);
    }
  }

  static create(peerId: string): PeerContext
  static create(peerId: string, roomId: string, roomName: string, password: string): PeerContext
  static create(...args: any[]): PeerContext {
    console.log('create', args);
    if (args.length <= 1) {
      return PeerContext._create.apply(this, args);
    } else {
      return PeerContext._createRoom.apply(this, args);
    }
  }

  private static _create(peerId: string = '') {
    return new PeerContext(peerId);
  }

  private static _createRoom(peerId: string = '', roomId: string = '', roomName: string = '', password: string = ''): PeerContext {
    let fullstring: string = peerId + roomId + lzbase62.compress(roomName) + '-' + lzbase62.compress(password);
    try {
      console.log(fullstring);
    } catch (e) {
      console.error(e);
      return null;
    }
    return new PeerContext(fullstring);
  }

  static generateId(format: string = '******'): string {
    const h: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let k: string = format;
    k = format.replace(/\*/g, function (c) {
      let r: number = Math.floor(Math.random() * (h.length));
      return h[r];
    });

    return k;
  }
}