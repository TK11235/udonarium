import { AfterViewInit, Component, NgZone, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';

import { ChatTab } from './class/chat-tab';
import { AudioSharingSystem } from './class/core/file-storage/audio-sharing-system';
import { AudioStorage } from './class/core/file-storage/audio-storage';
import { FileArchiver } from './class/core/file-storage/file-archiver';
import { FileSharingSystem } from './class/core/file-storage/image-sharing-system';
import { FileStorage } from './class/core/file-storage/image-storage';
import { ImageFile } from './class/core/file-storage/image-file';
import { ObjectFactory } from './class/core/synchronize-object/object-factory';
import { ObjectSerializer } from './class/core/synchronize-object/object-serializer';
import { ObjectStore } from './class/core/synchronize-object/object-store';
import { ObjectSynchronizer } from './class/core/synchronize-object/object-synchronizer';
import { EventSystem, Network } from './class/core/system/system';
import { DiceBot } from './class/dice-bot';
import { Jukebox } from './class/Jukebox';
import { PeerCursor } from './class/peer-cursor';
import { ChatWindowComponent } from './component/chat-window/chat-window.component';
import { FileStorageComponent } from './component/file-storage/file-storage.component';
import { GameCharacterGeneratorComponent } from './component/game-character-generator/game-character-generator.component';
import { GameCharacterSheetComponent } from './component/game-character-sheet/game-character-sheet.component';
import { GameObjectInventoryComponent } from './component/game-object-inventory/game-object-inventory.component';
import { GameTableSettingComponent } from './component/game-table-setting/game-table-setting.component';
import { JukeboxComponent } from './component/jukebox/jukebox.component';
import { PeerMenuComponent } from './component/peer-menu/peer-menu.component';
import { TextViewComponent } from './component/text-view/text-view.component';
import { AppConfig, AppConfigService } from './service/app-config.service';
import { ContextMenuService } from './service/context-menu.service';
import { ModalService } from './service/modal.service';
import { PanelOption, PanelService } from './service/panel.service';
import { PointerDeviceService } from './service/pointer-device.service';
import { SaveDataService } from './service/save-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {

  @ViewChild('modalLayer', { read: ViewContainerRef }) modalLayerViewContainerRef: ViewContainerRef;
  private lazyUpdateTimer: NodeJS.Timer = null;
  private openPanelCount: number = 0;

  constructor(
    private modalService: ModalService,
    private panelService: PanelService,
    private pointerDeviceService: PointerDeviceService,
    private appConfigService: AppConfigService,
    private saveDataService: SaveDataService,
    private ngZone: NgZone
  ) {

    this.ngZone.runOutsideAngular(() => {
      EventSystem;
      Network;
      FileArchiver.instance.initialize();
      FileSharingSystem.instance.initialize();
      FileStorage.instance;
      AudioSharingSystem.instance.initialize();
      AudioStorage.instance;
      ObjectFactory.instance;
      ObjectSerializer.instance;
      ObjectStore.instance;
      ObjectSynchronizer.instance.initialize();
    });
    appConfigService.initialize();
    pointerDeviceService.initialize();

    let diceBot: DiceBot = new DiceBot('DiceBot');
    diceBot.initialize();

    let jukebox: Jukebox = new Jukebox('Jukebox');
    jukebox.initialize();


    let chatTab: ChatTab = new ChatTab('MainTab');
    chatTab.name = 'メインタブ';
    chatTab.initialize();

    chatTab = new ChatTab('SubTab');
    chatTab.name = 'サブタブ';
    chatTab.initialize();

    let fileContext = ImageFile.createEmpty('none_icon').toContext();
    fileContext.url = './assets/images/ic_account_circle_black_24dp_2x.png';
    let noneIconImage = FileStorage.instance.add(fileContext);

    PeerCursor.createMyCursor();
    PeerCursor.myCursor.name = 'プレイヤー';
    PeerCursor.myCursor.imageIdentifier = noneIconImage.identifier;

    EventSystem.register(this)
      .on('*', event => {
        if (!event.isSendFromSelf && this.lazyUpdateTimer === null) {
          this.lazyUpdateTimer = setTimeout(() => {
            this.lazyUpdateTimer = null;
            this.ngZone.run(() => { });
          }, 100);
        }
      }).on<AppConfig>('LOAD_CONFIG', 0, event => {
        console.log('LOAD_CONFIG !!!', event.data);
        Network.setApiKey(event.data.webrtc.key);
        Network.open();
      }).on<AppConfig>('FILE_LOADED', 0, event => {
        this.lazyUpdateTimer = setTimeout(() => {
          this.lazyUpdateTimer = null;
          this.ngZone.run(() => { });
        }, 100);
      })
      .on('OPEN_PEER', 0, event => {
        console.log('OPEN_PEER', event.data.peer);
        PeerCursor.myCursor.peerId = event.data.peer;
      }).on('CLOSE_OTHER_PEER', 0, event => {
        //
      }).on('LOST_CONNECTION_PEER', 0, async event => {
        console.log('LOST_CONNECTION_PEER', event.data.peer);
        await this.modalService.open(TextViewComponent, { title: 'Peer情報の再取得', text: 'Peer情報が破棄されました。\nこのウィンドウを閉じると再接続を試みます。' });
        Network.open();
      });
  }
  ngAfterViewInit() {
    PanelService.defaultParentViewContainerRef = ModalService.defaultParentViewContainerRef = ContextMenuService.defaultParentViewContainerRef = this.modalLayerViewContainerRef;
    setTimeout(() => {
      this.panelService.open(PeerMenuComponent, { width: 500, height: 450, left: 100 });
      this.panelService.open(ChatWindowComponent, { width: 700, height: 400, left: 0, top: 450 });
    }, 0);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  open(componentName: string) {
    let component: { new(...args: any[]): any } = null;
    let option: PanelOption = { width: 450, height: 600, left: 100 }
    switch (componentName) {
      case 'PeerMenuComponent':
        component = PeerMenuComponent;
        break;
      case 'ChatWindowComponent':
        component = ChatWindowComponent;
        option.width = 700;
        break;
      case 'GameTableSettingComponent':
        component = GameTableSettingComponent;
        option = { width: 540, height: 350, left: 100 };
        break;
      case 'FileStorageComponent':
        component = FileStorageComponent;
        break;
      case 'GameCharacterSheetComponent':
        component = GameCharacterSheetComponent;
        break;
      case 'JukeboxComponent':
        component = JukeboxComponent;
        break;
      case 'GameCharacterGeneratorComponent':
        component = GameCharacterGeneratorComponent;
        option = { width: 500, height: 300, left: 100 };
        break;
      case 'GameObjectInventoryComponent':
        component = GameObjectInventoryComponent;
        break;
    }
    if (component) {
      option.top = (this.openPanelCount % 10 + 1) * 20;
      option.left = 100 + (this.openPanelCount % 20 + 1) * 5;
      this.openPanelCount = this.openPanelCount + 1;
      console.log('openPanelCount:', this.openPanelCount);
      this.panelService.open(component, option);
    }
  }

  save() {
    let roomName = Network.peerContext && 0 < Network.peerContext.roomName.length
      ? Network.peerContext.roomName
      : 'ルームデータ';
    this.saveDataService.saveRoom(roomName);
  }
}
