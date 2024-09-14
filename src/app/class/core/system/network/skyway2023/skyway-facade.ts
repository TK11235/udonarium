import {
  Channel,
  LocalDataStream,
  LocalPerson,
  Logger,
  Publication,
  SkyWayChannel,
  SkyWayContext,
  SkyWayError,
  SkyWayStreamFactory,
  Subscription
} from '@skyway-sdk/core';
import { CryptoUtil } from '../../util/crypto-util';
import { IPeerContext, PeerContext } from '../peer-context';
import { SkyWayBackend } from './skyway-backend';

export class SkyWayFacade {
  url = '';
  context: SkyWayContext;
  private lobby: Channel;
  private lobbyPerson: LocalPerson;
  room: Channel;
  roomPerson: LocalPerson;

  publication: Publication<LocalDataStream>;

  peer: PeerContext = PeerContext.parse('???');
  get isOpen(): boolean { return this.peer.isOpen };
  private isDestroyed = false;

  onOpen: (peer: IPeerContext) => void;
  onClose: (peer: IPeerContext) => void;
  onFatalError: (peer: IPeerContext, errorType: string, errorMessage: string, errorObject: any) => void;
  onSubscribed: (peer: IPeerContext, subscription: Subscription) => void;
  onRoomRestore: (peer: IPeerContext) => void;

  async open(peer: IPeerContext) {
    if (this.isOpen) await this.close();
    try {
      console.log('SkyWayFacade open...');
      this.peer = PeerContext.parse(peer.peerId);
      this.peer.userId = peer.userId;
      this.peer.password = peer.password;
      this.isDestroyed = false;

      await this.createContext();
      await this.joinRoom();
      await this.joinLobby();

      this.peer.isOpen = true;
      console.log('SkyWayFacade open ok');

      if (this.onOpen) this.onOpen(this.peer);
    } catch (err) {
      console.error(err);
      if (this.onFatalError) this.onFatalError(this.peer, err.name, err.message, err);
    }
  }

  async close() {
    try {
      console.log('SkyWayFacade close...');
      this.peer = PeerContext.parse('???');
      this.isDestroyed = true;

      await this.leaveLobby();
      await this.leaveRoom();
      await this.disposeContext();
      console.log('SkyWayFacade close ok');
    } catch (err) {
      console.error(err);
    }
  }

  private async createContext() {
    await this.disposeContext();
    if (this.isDestroyed) return;

    let backend = new SkyWayBackend(this.url);
    let channelName = CryptoUtil.sha256Base64Url(this.peer.roomId + this.peer.roomName + this.peer.password);

    let authToken = await backend.createSkyWayAuthToken(channelName, this.peer.peerId);
    if (authToken.length < 1) {
      let message = `APIバックエンド< ${backend.url} >にアクセスできませんでした。SkyWayの認証トークンを発行するサーバが必要です。`
      if (this.onFatalError) this.onFatalError(this.peer, 'server-error', message, new Error(message));
      return;
    }

    let context = await SkyWayContext.Create(authToken);
    context.onTokenUpdateReminder.add(async () => {
      console.log(`skyWay onTokenUpdateReminder ${new Date().toISOString()}`);
      let authToken = await backend.createSkyWayAuthToken(channelName, this.peer.peerId);
      if (authToken.length < 1) {
        let message = `APIバックエンド< ${backend.url} >にアクセスできませんでした。`
        if (this.onFatalError) this.onFatalError(this.peer, 'server-error', message, new Error(message));
        return;
      }
      context.updateAuthToken(authToken);
    });

    context.onTokenExpired.add(() => {
      console.error('skyWay onTokenExpired');
      if (this.isOpen) {
        this.close();
        if (this.onClose) this.onClose(this.peer);
      }
      let message = 'SkyWayの認証トークンの有効期限が切れました。'
      if (this.onFatalError) this.onFatalError(this.peer, 'token-expired', message, new Error(message));
    });

    context.onFatalError.add(err => {
      console.error('skyWay onFatalError', err);
      if (this.isOpen) {
        this.close();
        if (this.onClose) this.onClose(this.peer);
      }
      if (this.onFatalError) this.onFatalError(this.peer, err.name, err.message, err);
    });

    this.context = context;
  }

  private async joinLobby() {
    await this.joinLobbyChannel();
    await this.joinLobbyPerson();
  }

  private async joinLobbyChannel() {
    await this.leaveLobbyChannel();
    if (this.isDestroyed || !this.peer.isRoom || !this.context || this.context?.disposed) return;

    let lobbys: Channel[] = [];
    for (let lobbyName of this.getLobbyNames()) {
      let lobby = await SkyWayChannel.FindOrCreate(this.context, {
        name: lobbyName,
      });
      console.log(`FindOrCreate<${lobbyName}>`);
      lobbys.push(lobby);
      if (lobby.members.length < 300) break;
    }

    let min = 9999;
    let joinLobby: Channel = null;
    lobbys.forEach(lobby => {
      if (min <= lobby.members.length) return;
      min = lobby.members.length;
      joinLobby = lobby;
    });

    lobbys.forEach(lobby => {
      if (lobby !== joinLobby) lobby.dispose();
    });

    joinLobby.onClosed.add(() => {
      console.log(`lobby<${joinLobby.name}> onClosed`);
      this.joinLobby();
    });

    this.lobby = joinLobby;
  }

  private async joinLobbyPerson() {
    await this.leaveLobbyPerson();
    if (this.isDestroyed || !this.peer.isRoom || !this.context || this.context?.disposed || this.lobby == null) return;

    let lobbyPerson = await this.lobby.join({
      name: this.peer.peerId,
    });

    console.log(`lobbyPerson join <${this.lobby.name}>`);
    lobbyPerson.onLeft.add(() => {
      console.log(`lobbyPerson onClosed`);
    });

    lobbyPerson.onFatalError.add(err => {
      console.error('lobbyPerson onFatalError', err);
    });

    this.lobbyPerson = lobbyPerson;
  }

  private async joinRoom() {
    await this.joinRoomChannel();
    await this.joinRoomPerson();
    await this.createRoomDataStream();
  }

  private async joinRoomChannel() {
    await this.leaveRoomChannel();
    if (this.isDestroyed || !this.peer.isRoom || !this.context || this.context?.disposed) return;

    let roomName = CryptoUtil.sha256Base64Url(this.peer.roomId + this.peer.roomName + this.peer.password);
    console.log(`roomName: ${roomName}`);

    let room = await SkyWayChannel.FindOrCreate(this.context, {
      name: roomName,
    });
    console.log(`FindOrCreate<${roomName}>`);

    room.onClosed.add(async () => {
      console.log(`room<${room.name}> onClosed`);
      await this.joinRoom();
      console.log(`room<${room.name}> onRoomRestore`);
      if (this.onRoomRestore) this.onRoomRestore(this.peer);
    });

    this.room = room;
  }

  private async joinRoomPerson() {
    await this.leaveRoomPerson();
    if (this.isDestroyed || !this.peer.isRoom || !this.context || this.context?.disposed || this.room == null) return;

    let roomPerson = await this.room.join({
      name: this.peer.peerId
    });

    console.log(`roomPerson join <${this.room.name}>`);

    roomPerson.onFatalError.add(err => {
      console.error('roomPerson onFatalError', err);
      if (this.isOpen) {
        this.close();
        if (this.onClose) this.onClose(this.peer);
      }
      if (this.onFatalError) this.onFatalError(this.peer, err.name, err.message, err);
    });

    this.roomPerson = roomPerson;
  }

  private async createRoomDataStream() {
    if (this.isDestroyed || !this.peer.isRoom || !this.context || this.context?.disposed || this.roomPerson == null) return;
    let dataStream = await SkyWayStreamFactory.createDataStream();
    let publication = await this.roomPerson.publish(dataStream, { metadata: 'udonarium-data-stream' });

    publication.onSubscribed.add(event => {
      console.log(`publication onSubscribed ${event.subscription.subscriber.name}`);
      let peerId = event.subscription.subscriber.name;
      if (peerId == null) {
        event.subscription.cancel();
        return;
      }

      let peer = PeerContext.parse(event.subscription.subscriber.name);
      if (this.onSubscribed) this.onSubscribed(peer, event.subscription);
    });

    this.publication = publication;
  }

  private async disposeContext() {
    let context = this.context;
    this.context = null;
    if (!context) return;
    console.log('disposeContext');
    context.dispose();
  }

  private async leaveLobby() {
    await this.leaveLobbyPerson();
    await this.leaveLobbyChannel();
  }

  private async leaveLobbyChannel() {
    let lobby = this.lobby;
    this.lobby = null;

    if (!lobby) return;
    console.log('leaveLobbyChannel');
    lobby.dispose();
  }

  private async leaveLobbyPerson() {
    let lobbyPerson = this.lobbyPerson;
    this.lobbyPerson = null;

    if (!lobbyPerson || lobbyPerson.state === 'left') return;
    console.log('leaveLobbyPerson');
    lobbyPerson.onLeft.removeAllListeners();
    lobbyPerson.onFatalError.removeAllListeners();
    await lobbyPerson.leave();
  }

  private async leaveRoom() {
    await this.closeRoomDataStream();
    await this.leaveRoomPerson();
    await this.leaveRoomChannel();
  }

  private async leaveRoomChannel() {
    let room = this.room;
    this.room = null;

    if (!room) return;
    console.log('leaveRoomChannel');
    room.onMemberJoined.removeAllListeners();
    room.onMemberLeft.removeAllListeners();
    room.onMemberListChanged.removeAllListeners();
    room.onStreamPublished.removeAllListeners();
    room.onClosed.removeAllListeners();
    room.dispose();
  }

  private async leaveRoomPerson() {
    let roomPerson = this.roomPerson;
    this.roomPerson = null;

    if (!roomPerson || roomPerson.state === 'left') return;
    console.log('leaveRoomPerson');
    roomPerson.onLeft.removeAllListeners();
    roomPerson.onFatalError.removeAllListeners();
    await roomPerson.leave();
  }

  private async closeRoomDataStream() {
    let publication = this.publication;
    this.publication = null;

    if (!publication) return;
    await publication.cancel();
  }

  async listAllPeers(): Promise<string[]> {
    if (this.isDestroyed || !this.isOpen) return [];

    let lobbys: Channel[] = [];
    for (let lobbyName of this.getLobbyNames()) {
      let level = Logger.level;
      Logger.level = 'disable';
      try {
        let lobby = this.lobby?.name === lobbyName ? this.lobby : await SkyWayChannel.Find(this.context, { name: lobbyName });
        lobbys.push(lobby);
      } catch (error) {
        if (error instanceof SkyWayError) {
          if (error.name != 'channelNotFound') console.error(`${error.name} ${error.message}`);
        } else {
          console.error(error);
        }
      }
      Logger.level = level;
    }

    let allPeerIds = lobbys.flatMap(lobby => lobby.members.map(member => member.name ?? '???'));

    lobbys.forEach(lobby => {
      if (lobby.name !== this.lobby?.name) lobby.dispose();
    });
    return allPeerIds;
  }

  private getLobbyNames(): string[] {
    let lobbyBaseName = this.context?.authToken.scope.app.channels?.find(channel => channel.name.startsWith('udonarium-lobby-'))?.name ?? '';
    let regArray = /of-(\d+)$/.exec(lobbyBaseName);
    let lobbySize = Number(regArray[1]);
    if (isNaN(lobbySize)) lobbySize = 0;
    let lobbyNames = [...Array(lobbySize)].map((value, index) => `udonarium-lobby-${index + 1}-of-${lobbySize}`);
    return lobbyNames;
  }
}
