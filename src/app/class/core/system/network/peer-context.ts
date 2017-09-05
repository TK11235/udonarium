import * as lzbase62 from 'lzbase62/lzbase62.min.js';
//import * as lzbase62 from 'lzbase62';

export interface IPeerContext {
  fullstring: string;
  id: string;
  room: string;
  roomName: string;
  password: string;
  isPrivate: boolean;
  isOpen: boolean;
}

export class PeerContext implements IPeerContext {
  fullstring: string = '';
  id: string = '';
  room: string = '';
  roomName: string = '';
  password: string = '';
  isPrivate: boolean = true;
  isOpen: boolean = false;

  get isRoom(): boolean { return 0 < this.room.length ? true : false; }

  constructor(fullstring: string) {
    this.parse(fullstring);
  }

  private parse(fullstring) {
    try {
      this.fullstring = fullstring;
      let array = /^(.{18})(-(.{18})-(\w*)-(\w*)-([01]))?/ig.exec(fullstring);
      this.id = array[1];
      if (array[2] == null) return;
      this.room = array[3];
      this.roomName = lzbase62.decompress(array[4]);
      this.password = lzbase62.decompress(array[5]);
      this.isPrivate = array[6] === '1' ? true : false;
    } catch (e) {
      this.id = fullstring;
      console.warn(e);
    }
  }

  static create(peerId: string): PeerContext
  static create(peerId: string, roomId: string, roomName: string, isPrivate: boolean, password: string): PeerContext
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

  private static _createRoom(peerId: string = '', roomId: string = '', roomName: string = '', isPrivate: boolean = false, password: string = ''): PeerContext {
    let fullstring: string = peerId + '-' + roomId + '-' + lzbase62.compress(roomName) + '-' + lzbase62.compress(password) + '-' + (isPrivate ? '1' : '0');
    try {
      console.log(fullstring);
    } catch (e) {
      console.error(e);
      return null;
    }
    return new PeerContext(fullstring);
  }

  static generateId(): string {
    const h: string[] = [
      /*'0',*/ /*'1',*/ /*'2',*/ '3', '4', '5', '6', '7', /*'8',*/ '9',
      /*'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',*/
      'A', /*'B',*/ 'C', 'D', 'E', 'F', 'G', 'H', /*'I',*/ 'J', 'K', 'L', 'M', 'N', /*'O',*/ 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y' /*,'Z'*/];

    let k: string = '****-****-********';

    k = k.replace(/\*/g, function (c) {
      let r: number = Math.floor(Math.random() * (h.length));
      return h[r];
    });

    console.log(k);
    return k;
  }
}