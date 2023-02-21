import { IPeerContext, PeerContext } from './peer-context';

export interface IRoomInfo {
  readonly id: string;
  readonly name: string;
  readonly hasPassword: boolean;
  readonly peers: IPeerContext[];

  filterByPassword(password: string): IPeerContext[];
}

export class RoomInfo implements IRoomInfo {
  id: string = '';
  name: string = '';
  get hasPassword(): boolean { return this.peers.some(peer => peer.hasPassword); }
  peers: PeerContext[] = [];

  constructor(id: string = '', name: string = '', peers: PeerContext[] = []) {
    this.id = id;
    this.name = name;
    this.peers = peers;
  }

  filterByPassword(password: string): PeerContext[] {
    return this.peers.filter(peer => peer.verifyPassword(password));
  }

  static listFrom(peerIds: string[]) {
    let contexts = peerIds.map(peerId => PeerContext.parse(peerId)).sort((a, b) => {
      if (a.peerId > b.peerId) return 1;
      if (a.peerId < b.peerId) return -1;
      return 0;
    });

    let roomMap: Map<string, RoomInfo> = new Map();
    for (let context of contexts) {
      if (context.isRoom) {
        let alias = context.roomId + context.roomName;
        let room = roomMap.get(alias) ?? new RoomInfo(context.roomId, context.roomName);
        room.peers.push(context);
        roomMap.set(alias, room);
      }
    }

    if (roomMap.size < 1) return [];

    let rooms = Array.from(roomMap.values()).sort((a, b) => {
      if (a.id + a.name < b.id + b.name) return -1;
      if (a.id + a.name > b.id + b.name) return 1;
      return 0;
    });
    return rooms;
  }
}
