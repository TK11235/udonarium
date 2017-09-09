import { NgZone, Component, ViewChild, ViewContainerRef, AfterViewInit, OnDestroy } from '@angular/core';

import { ModalService } from './service/modal.service';
import { PanelService, PanelOption } from './service/panel.service';
import { PointerDeviceService } from './service/pointer-device.service';
import { ContextMenuService } from './service/context-menu.service';
import { AppConfigService, AppConfig } from './service/app-config.service';

import { ModalComponent } from './component/modal/modal.component';
import { UIPanelComponent } from './component/ui-panel/ui-panel.component';
import { PeerMenuComponent } from './component/peer-menu/peer-menu.component';
import { GameObjectInventoryComponent } from './component/game-object-inventory/game-object-inventory.component';
import { ChatWindowComponent } from './component/chat-window/chat-window.component';
import { GameTableSettingComponent } from './component/game-table-setting/game-table-setting.component';
import { FileStorageComponent } from './component/file-storage/file-storage.component';
import { GameCharacterSheetComponent } from './component/game-character-sheet/game-character-sheet.component';
import { GameCharacterGeneratorComponent } from './component/game-character-generator/game-character-generator.component';
import { ChatPaletteComponent } from './component/chat-palette/chat-palette.component';
import { JukeboxComponent } from './component/jukebox/jukebox.component'
import { LobbyComponent } from './component/lobby/lobby.component';
import { TextViewComponent } from './component/text-view/text-view.component';

import { ChatMessage } from './class/chat-message';
import { ChatTabList } from './class/chat-tab-list';
import { ChatTab } from './class/chat-tab';
import { DiceBot } from './class/dice-bot';
import { Room } from './class/room';
import { EventSystem, Network } from './class/core/system/system';
import { MimeType } from './class/core/file-storage/mime-type';
import { FileArchiver } from './class/core/file-storage/file-archiver';
import { FileSharingSystem } from './class/core/file-storage/file-sharing-system';
import { FileStorage } from './class/core/file-storage/file-storage';
import { AudioSharingSystem } from './class/core/file-storage/audio-sharing-system';
import { AudioStorage } from './class/core/file-storage/audio-storage';
import { ImageFile } from './class/core/file-storage/image-file';
import { ObjectNode } from './class/core/synchronize-object/object-node';
import { ObjectFactory } from './class/core/synchronize-object/object-factory';
import { ObjectSerializer } from './class/core/synchronize-object/object-serializer';
import { ObjectStore } from './class/core/synchronize-object/object-store';
import { ObjectSynchronizer } from './class/core/synchronize-object/object-synchronizer';
import { PeerCursor } from './class/peer-cursor';
import { Jukebox } from './class/Jukebox';

import * as Beautify from 'vkbeautify';
import { XmlUtil } from 'app/class/core/synchronize-object/xml-util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'Unreal Dice Online';//'TRPG Tool-X';

  @ViewChild('modalLayer', { read: ViewContainerRef }) modalLayerViewContainerRef: ViewContainerRef;
  private lazyUpdateTimer: NodeJS.Timer = null;

  constructor(
    private modalService: ModalService,
    private panelService: PanelService,
    private pointerDeviceService: PointerDeviceService,
    private appConfigService: AppConfigService,
    private ngZone: NgZone
  ) {

    EventSystem;
    Network;
    FileArchiver.instance;
    FileSharingSystem.instance;
    FileStorage.instance;
    AudioSharingSystem.instance;
    AudioStorage.instance;
    ObjectFactory.instance;
    ObjectSerializer.instance;
    ObjectStore.instance;
    ObjectSynchronizer.instance;

    appConfigService.initialize();
    pointerDeviceService.initialize();
    //Network.open();

    let diceBot: DiceBot = new DiceBot('DiceBot');
    diceBot.initialize();

    let jukebox: Jukebox = new Jukebox('Jukebox');
    jukebox.initialize();

    //let chatTabList: ChatTabList = new ChatTabList('MainTabList');
    //chatTabList.initialize();

    let chatTab: ChatTab = new ChatTab('MainTab');
    chatTab.name = 'メインタブ';
    chatTab.initialize();
    //chatTabList.appendChild(chatTab);

    chatTab = new ChatTab('SubTab');
    chatTab.name = 'サブタブ';
    chatTab.initialize();
    //chatTabList.appendChild(chatTab);
    //let tabletopIndexer = new ObjectNode('TabletopIndexer');
    //tabletopIndexer.initialize();

    let fileContext = ImageFile.createEmpty('none_icon').toContext();
    fileContext.url = './assets/images/ic_account_circle_black_24dp_2x.png';
    let noneIconImage = FileStorage.instance.add(fileContext);

    PeerCursor.createMyCursor();
    PeerCursor.myCursor.name = 'プレイヤー';
    PeerCursor.myCursor.imageIdentifier = noneIconImage.identifier;

    EventSystem.register(this)
      .on('*', () => {
        if (this.lazyUpdateTimer === null) {
          this.lazyUpdateTimer = setTimeout(() => {
            this.lazyUpdateTimer = null;
            this.ngZone.run(() => { });
          }, 100);
        }
      }).on<AppConfig>('LOAD_CONFIG', 0, event => {
        console.log('LOAD_CONFIG !!!', event.data);
        Network.setApiKey(event.data.webrtc.key);
        Network.open();
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
      this.panelService.open(ChatWindowComponent, { width: 700, height: 400, left: 0, top: 400 });
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
        option.width = 600;
        break;
      case 'GameTableSettingComponent':
        component = GameTableSettingComponent;
        option = { width: 500, height: 300, left: 100 };
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
      this.panelService.open(component, option);
    }
  }

  save() {
    let files: File[] = [];
    let roomXml = this.getRoomXml();
    let chatXml = this.getChatXml();
    files.push(new File([roomXml], 'data.xml', { type: 'text/plain' }));
    files.push(new File([chatXml], 'chat.xml', { type: 'text/plain' }));

    files = files.concat(this.getImageFiles(roomXml));
    files = files.concat(this.getImageFiles(chatXml));

    FileArchiver.instance.save(files, 'ルームデータ');
  }

  private getRoomXml(): string {
    let xml = new Room().toXml();
    xml = Beautify.xml(xml, 2);
    return xml;
  }

  private getChatXml(): string {
    let xml = new ChatTabList().toXml();
    xml = Beautify.xml(xml, 2);
    return xml;
  }

  private getImageFiles(xml: string): File[] {
    let xmlElement: Element = XmlUtil.xml2element(xml);
    let files: File[] = [];
    if (!xmlElement) return files;

    let images: { [identifier: string]: ImageFile } = {};
    let imageElements = xmlElement.querySelectorAll('*[type="image"]');

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].innerHTML;
      images[identifier] = FileStorage.instance.get(identifier);
    }

    imageElements = xmlElement.querySelectorAll('*[imageIdentifier]');

    for (let i = 0; i < imageElements.length; i++) {
      let identifier = imageElements[i].getAttribute('imageIdentifier');
      images[identifier] = FileStorage.instance.get(identifier);
    }
    for (let identifier in images) {
      let image = images[identifier];
      if (image && image.blob) {
        files.push(new File([image.blob], image.identifier + '.' + MimeType.extension(image.blob.type), { type: image.blob.type }));
      }
    }
    return files;
  }
}
