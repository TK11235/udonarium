import { Component, OnDestroy, OnInit } from '@angular/core';

import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { PeerContext } from '@udonarium/core/system/network/peer-context';
import { EventSystem, Network } from '@udonarium/core/system';
import { PeerCursor } from '@udonarium/peer-cursor';

import { PasswordCheckComponent } from 'component/password-check/password-check.component';
import { RoomSettingComponent } from 'component/room-setting/room-setting.component';
import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';

@Component({
  selector: 'lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css'],
})
export class LobbyComponent implements OnInit, OnDestroy {
  rooms: { alias: string, roomName: string, peers: PeerContext[] }[] = [];

  isReloading: boolean = false;

  help: string = '「一覧を更新」ボタンを押すと接続可能なルーム一覧を表示します。';

  get currentRoom(): string { return Network.peerContext.room };
  get peerId(): string { return Network.peerId; }
  get isConnected(): boolean {
    return Network.peerIds.length <= 1 ? false : true;
  }
  constructor(
    private panelService: PanelService,
    private modalService: ModalService
  ) { }

  ngOnInit() {
    this.changeTitle();
    EventSystem.register(this)
      .on('OPEN_NETWORK', event => {
        this.changeTitle();
      })
      .on('CONNECT_PEER', event => {
        this.changeTitle();
      });
    this.reload();
  }

  private changeTitle() {
    this.modalService.title = this.panelService.title = 'ロビー';
    if (Network.peerContext.roomName.length) {
      this.modalService.title = this.panelService.title = '＜' + Network.peerContext.roomName + '/' + Network.peerContext.room + '＞'
    }
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  async reload() {
    this.isReloading = true;
    this.help = '検索中...';
    this.rooms = [];
    let peersOfroom: { [room: string]: PeerContext[] } = {};
    let peerIds = await Network.listAllPeers();
    for (let id of peerIds) {
      let context = new PeerContext(id);
      if (context.isRoom) {
        let alias = context.room + context.roomName;
        if (!(alias in peersOfroom)) {
          peersOfroom[alias] = [];
        }
        peersOfroom[alias].push(context);
      }
    }
    for (let alias in peersOfroom) {
      this.rooms.push({ alias: alias, roomName: peersOfroom[alias][0].roomName, peers: peersOfroom[alias] });
    }
    this.rooms.sort((a, b) => {
      if (a.alias < b.alias) return -1;
      if (a.alias > b.alias) return 1;
      return 0;
    });
    this.help = '接続可能なルームが見つかりませんでした。「新しいルームを作成する」で新規ルームを作成できます。';
    this.isReloading = false;
  }

  async connect(peerContexts: PeerContext[]) {
    let context = peerContexts[0];

    if (context.password.length) {
      let input = await this.modalService.open(PasswordCheckComponent, { password: context.password });
      if (input !== context.password) return;
    }

    let peerId = Network.peerContext ? Network.peerContext.id : PeerContext.generateId();
    Network.open(peerId, context.room, context.roomName, context.password);
    PeerCursor.myCursor.peerId = Network.peerId;

    let triedPeer: string[] = [];
    EventSystem.register(triedPeer)
      .on('OPEN_NETWORK', event => {
        console.log('LobbyComponent OPEN_PEER', event.data.peer);
        EventSystem.unregister(triedPeer);
        ObjectStore.instance.clearDeleteHistory();
        for (let peer of peerContexts) {
          Network.connect(peer.fullstring);
        }
        EventSystem.register(triedPeer)
          .on('CONNECT_PEER', event => {
            console.log('接続成功！', event.data.peer);
            triedPeer.push(event.data.peer);
            console.log('接続成功 ' + triedPeer.length + '/' + peerContexts.length);
            if (peerContexts.length <= triedPeer.length) {
              this.resetNetwork();
              EventSystem.unregister(triedPeer);
            }
          })
          .on('DISCONNECT_PEER', event => {
            console.warn('接続失敗', event.data.peer);
            triedPeer.push(event.data.peer);
            console.warn('接続失敗 ' + triedPeer.length + '/' + peerContexts.length);
            if (peerContexts.length <= triedPeer.length) {
              this.resetNetwork();
              EventSystem.unregister(triedPeer);
            }
          });
      });
  }

  private resetNetwork() {
    if (Network.peerContexts.length < 1) {
      Network.open();
      PeerCursor.myCursor.peerId = Network.peerId;
    }
  }

  async showRoomSetting() {
    await this.modalService.open(RoomSettingComponent, { width: 700, height: 400, left: 0, top: 400 });
    this.reload();
    this.help = '「一覧を更新」ボタンを押すと接続可能なルーム一覧を表示します。';
  }
}