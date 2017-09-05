import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';

import { FileSelecterComponent } from '../file-selecter/file-selecter.component';
import { LobbyComponent } from '../lobby/lobby.component';

import { PanelService } from '../../service/panel.service';
import { ModalService } from '../../service/modal.service';
import { AppConfigService } from '../../service/app-config.service';

import { PeerContext } from '../../class/core/system/network/peer-context';
import { PeerCursor } from '../../class/peer-cursor';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';

@Component({
  selector: 'peer-menu',
  templateUrl: './peer-menu.component.html',
  styleUrls: ['./peer-menu.component.css']
})
export class PeerMenuComponent implements OnInit, OnDestroy, AfterViewInit {

  targetPeerId: string = '';
  networkService = Network
  gameRoomService = ObjectStore.instance;
  help: string = '';

  //get myPeer(): PeerCursor { return this.getPeerCursor(this.networkService.peerId); }
  get myPeer(): PeerCursor { return PeerCursor.myCursor; }

  constructor(
    //private networkService: NetworkService,
    //private gameRoomService: GameRoomService,
    private modalService: ModalService,
    private panelService: PanelService,
    public appConfigService: AppConfigService
  ) { }

  ngOnInit() {
    this.panelService.title = 'Peer情報';
  }

  ngAfterViewInit() { }
  ngOnDestroy() { }

  changeIcon() {
    this.modalService.open<string>(FileSelecterComponent).then(value => {
      if (!this.myPeer || !value) return;
      this.myPeer.imageIdentifier = value;
    });
  }

  private resetPeerIfNeeded() {
    if (Network.peerContexts.length < 1) {
      Network.open();
      PeerCursor.myCursor.peerId = Network.peerId;
    }
  }

  connectPeer() {
    this.help = '';
    let context = PeerContext.create(this.targetPeerId);
    if (context.isRoom) {
      if (Network.peerContexts.length) {
        this.help = '入力されたPeer IDはルーム用のPeer IDのようですが、ルーム用Peer IDと通常のPeer IDを混在させることはできません。通常Peerとの接続を切ってください。（※ページリロードでPeer切断ができます）';
        return;
      }

      Network.open(Network.peerContext.id, context.room, context.roomName, context.isPrivate, context.password);
      PeerCursor.myCursor.peerId = Network.peerId;

      let dummy = {};
      EventSystem.register(dummy)
        .on('OPEN_OTHER_PEER', 0, event => {
          console.log('接続成功！', event.data.peer);
          this.resetPeerIfNeeded();
          EventSystem.unregister(dummy);
        })
        .on('CLOSE_OTHER_PEER', 0, event => {
          console.warn('接続失敗', event.data.peer);
          this.resetPeerIfNeeded();
          EventSystem.unregister(dummy);
        });
    }
    Network.connect(this.targetPeerId);
  }

  async connectPeerHistory() {
    this.help = '';
    let conectPeers: PeerContext[] = [];
    let room: string = '';

    for (let peer of this.appConfigService.peerHistory) {
      let context = PeerContext.create(peer);
      if (context.isRoom) {
        if (room !== context.room) conectPeers = [];
        room = context.room;
        conectPeers.push(context);
      } else {
        if (room !== context.room) conectPeers = [];
        conectPeers.push(context);
      }
    }

    if (room.length) {
      console.warn('connectPeerRoom <' + room + '>');
      let conectPeers = [];
      let peerIds = await Network.listAllPeers();
      for (let id of peerIds) {
        console.log(id);
        let context = new PeerContext(id);
        if (context.room === room) {
          conectPeers.push(context);
        }
      }
      if (conectPeers.length < 1) {
        this.help = '前回接続していたルームが見つかりませんでした。既に解散しているかもしれません。';
        console.warn('Room is already closed...');
        return;
      }
      Network.open(PeerContext.generateId(), conectPeers[0].room, conectPeers[0].roomName, conectPeers[0].isPrivate, conectPeers[0].password);
    } else {
      console.warn('connectPeers ' + conectPeers.length);
      Network.open();
    }

    PeerCursor.myCursor.peerId = Network.peerId;

    let listener = EventSystem.register(this)
      .on('OPEN_PEER', 0, event => {
        console.log('OPEN_PEER', event.data.peer);
        EventSystem.unregisterListener(listener);
        for (let context of conectPeers) {
          Network.connect(context.fullstring);
        }
      });
  }

  showLobby() {
    this.modalService.open(LobbyComponent, { width: 700, height: 400, left: 0, top: 400 });
  }
}
