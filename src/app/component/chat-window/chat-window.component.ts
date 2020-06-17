import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { ChatMessage } from '@udonarium/chat-message';
import { ChatTab } from '@udonarium/chat-tab';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system';
import { PeerContext } from '@udonarium/core/system/network/peer-context';
import { DiceBot } from '@udonarium/dice-bot';
import { GameCharacter } from '@udonarium/game-character';
import { PeerCursor } from '@udonarium/peer-cursor';

import { ChatTabSettingComponent } from 'component/chat-tab-setting/chat-tab-setting.component';
import { TextViewComponent } from 'component/text-view/text-view.component';
import { ChatMessageService } from 'service/chat-message.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { GameObjectInventoryService} from 'service/game-object-inventory.service';
import { FileSelecterComponent } from 'component/file-selecter/file-selecter.component';

import { ModalService } from 'service/modal.service';
@Component({
  selector: 'chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})



export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('textArea', { static: true }) textAreaElementRef: ElementRef;
  public static SoundEffectSwitch: boolean = true;
  public onSoundEffectSwitchChanged() {
    if (ChatWindowComponent.SoundEffectSwitch)
      ChatWindowComponent.SoundEffectSwitch = false
    else ChatWindowComponent.SoundEffectSwitch = true
  }
  public SoundEffectSwitch2() {
    return ChatWindowComponent.SoundEffectSwitch;
  }


  sender: string = 'Guest';
  text: string = '';
  sendTo: string = '';
  get isDirect(): boolean { return this.sendTo != null && this.sendTo.length ? true : false }
  get gameType(): string { return this.chatMessageService.gameType; }
  set gameType(gameType: string) { this.chatMessageService.gameType = gameType; }
  gameHelp: string = '';

  private shouldUpdateCharacterList: boolean = true;
  private _gameCharacters: GameCharacter[] = [];
  get gameCharacters(): GameCharacter[] {
    if (this.shouldUpdateCharacterList) {
      this.shouldUpdateCharacterList = false;
      this._gameCharacters = ObjectStore.instance
        .getObjects<GameCharacter>(GameCharacter)
        .filter(character => this.allowsChat(character));
    }
    return this._gameCharacters;
  }

  gameCharacter: GameCharacter = null;

  private _chatTabidentifier: string = '';
  get chatTabidentifier(): string { return this._chatTabidentifier; }
  set chatTabidentifier(chatTabidentifier: string) {
    let hasChanged: boolean = this._chatTabidentifier !== chatTabidentifier;
    this._chatTabidentifier = chatTabidentifier;
    this.updatePanelTitle();
    if (hasChanged) {
      this.scrollToBottom(true);
    }
  }

  get chatTab(): ChatTab { return ObjectStore.instance.get<ChatTab>(this.chatTabidentifier); }
  maxLogLength: number = 1000;
  isAutoScroll: boolean = true;
  scrollToBottomTimer: NodeJS.Timer = null;

  private writingEventInterval: NodeJS.Timer = null;
  private previousWritingLength: number = 0;
  writingPeers: Map<string, NodeJS.Timer> = new Map();
  writingPeerNames: string[] = [];

  get diceBotInfos() { return DiceBot.diceBotInfos }
  get myPeer(): PeerCursor { return PeerCursor.myCursor; }
  get otherPeers(): PeerCursor[] { return ObjectStore.instance.getObjects(PeerCursor); }

  constructor(
    private modalService: ModalService,
    private ngZone: NgZone,
    public chatMessageService: ChatMessageService,
    private panelService: PanelService,
    private pointerDeviceService: PointerDeviceService,
    private inventoryService: GameObjectInventoryService
  ) { }

  ngOnInit() {
    this.sender = this.myPeer.identifier;
    this._chatTabidentifier = 0 < this.chatMessageService.chatTabs.length ? this.chatMessageService.chatTabs[0].identifier : '';
    this.gameType = this.inventoryService.gameType;
    
    EventSystem.register(this)
      .on('MESSAGE_ADDED', event => {
        if (event.data.tabIdentifier !== this.chatTabidentifier) return;
        let message = ObjectStore.instance.get<ChatMessage>(event.data.messageIdentifier);
        if (message && message.isSendFromSelf) {
          this.isAutoScroll = true;
        } else {
          this.checkAutoScroll();
        }
        if (this.isAutoScroll && this.chatTab) this.chatTab.markForRead();
        let sendFrom = message ? message.from : '?';
        if (this.writingPeers.has(sendFrom)) {
          clearTimeout(this.writingPeers.get(sendFrom));
          this.writingPeers.delete(sendFrom);
          this.updateWritingPeerNames();
        }
      })
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.data.aliasName !== GameCharacter.aliasName) return;
        this.shouldUpdateCharacterList = true;
        if (this.gameCharacter && !this.allowsChat(this.gameCharacter)) {
          this.gameCharacter = null;
          this.sender = this.myPeer.identifier;
        }
      })
      .on('DISCONNECT_PEER', event => {
        let object = ObjectStore.instance.get(this.sendTo);
        if (object instanceof PeerCursor && object.peerId === event.data.peer) {
          this.sendTo = '';
        }
      })
      .on<string>('WRITING_A_MESSAGE', event => {
        if (event.isSendFromSelf || event.data !== this.chatTabidentifier) return;
        this.ngZone.run(() => {
          if (this.writingPeers.has(event.sendFrom)) clearTimeout(this.writingPeers.get(event.sendFrom));
          this.writingPeers.set(event.sendFrom, setTimeout(() => {
            this.writingPeers.delete(event.sendFrom);
            this.updateWritingPeerNames();
          }, 2000));
          this.updateWritingPeerNames();
        });
      });
    Promise.resolve().then(() => this.updatePanelTitle());
  }

  ngAfterViewInit() {
    this.scrollToBottom(true);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  private updateWritingPeerNames() {
    this.writingPeerNames = Array.from(this.writingPeers.keys()).map(peerId => {
      let peer = PeerCursor.find(peerId);
      return peer ? peer.name : '';
    });
  }

  // @TODO やり方はもう少し考えた方がいいい
  scrollToBottom(isForce: boolean = false) {
    if (isForce) this.isAutoScroll = true;
    if (this.scrollToBottomTimer != null || !this.isAutoScroll) return;
    this.scrollToBottomTimer = setTimeout(() => {
      if (this.chatTab) this.chatTab.markForRead();
      this.scrollToBottomTimer = null;
      this.isAutoScroll = false;
      if (this.panelService.scrollablePanel) {
        this.panelService.scrollablePanel.scrollTop = this.panelService.scrollablePanel.scrollHeight;
        let event = new CustomEvent('scrolltobottom', {});
        this.panelService.scrollablePanel.dispatchEvent(event);
      }
    }, 0);
  }

  // @TODO
  checkAutoScroll() {
    if (!this.panelService.scrollablePanel) return;
    let top = this.panelService.scrollablePanel.scrollHeight - this.panelService.scrollablePanel.clientHeight;
    if (top - 150 <= this.panelService.scrollablePanel.scrollTop) {
      this.isAutoScroll = true;
    } else {
      this.isAutoScroll = false;
    }
  }

  updatePanelTitle() {
    if (this.chatTab) {
      this.panelService.title = '聊天視窗 - ' + this.chatTab.name;
    } else {
      this.panelService.title = '聊天視窗';
    }
  }

  onSelectedTab(identifier: string) {
    this.updatePanelTitle();
  }

  onSelectedCharacter(identifier: string) {
    let object = ObjectStore.instance.get(identifier);
    if (object instanceof GameCharacter) {
      this.gameCharacter = object;
    } else {
      this.gameCharacter = null;
    }
    this.sender = identifier;
  }

  onChangeGameType(gameType: string) {
    console.log('onChangeGameType ready');
    DiceBot.getHelpMessage(this.gameType).then(help => {
      console.log('onChangeGameType done\n' + help);
    });
  }

  private _color: string = "#000000";
  onChangeColor(color: string) {
    this._color = color;
  }

  showDicebotHelp() {
    DiceBot.getHelpMessage(this.gameType).then(help => {
      this.gameHelp = help;

      let gameName: string = '骰子機械人';
      for (let diceBotInfo of DiceBot.diceBotInfos) {
        if (diceBotInfo.script === this.gameType) {
          gameName = '骰子機械人<' + diceBotInfo.game + '＞'
        }
      }
      gameName += '的説明';

      let coordinate = this.pointerDeviceService.pointers[0];
      let option: PanelOption = { left: coordinate.x, top: coordinate.y, width: 600, height: 500 };
      let textView = this.panelService.open(TextViewComponent, option);
      textView.title = gameName;
      textView.text =
        '【骰子機械人】チャットに骰子用的文字を入力すると骰子ロールが可能\n'
        + '入力例）２ｄ６＋１　攻撃！\n'
        + '出力例）2d6+1　攻撃！\n'
        + '　　　　  diceBot: (2d6) → 7\n'
        + '上記的ように骰子文字的後ろに空白を入れて発言する事も可能。\n'
        + '以下、使用例\n'
        + '　3D6+1>=9 ：3d6+1で目標値9以上か的判定\n'
        + '　1D100<=50 ：D100で50％目標的下方ロール的例\n'
        + '　3U6[5] ：3d6的骰子目が5以上的場合に振り足しして合計する(上方無限)\n'
        + '　3B6 ：3d6的骰子目をバラバラ的まま出力する（合計しない）\n'
        + '　10B6>=4 ：10d6を振り4以上的骰子目的個数を数える\n'
        + '　(8/2)D(4+6)<=(5*3)：個数・骰子・達成値には四則演算も使用可能\n'
        + '　C(10-4*3/2+2)：C(計算式）で計算だけ的実行も可能\n'
        + '　choice[a,b,c]：列挙した要素から一つを選択表示。ランダム攻撃対象決定などに\n'
        + '　S3d6 ： 各コマンド的先頭に「S」を付けると他人結果的見えないシークレットロール\n'
        + '　3d6/2 ： 骰子出目を割り算（切り捨て）。切り上げは /2U、四捨五入は /2R。\n'
        + '　D66 ： D66骰子。順序はゲームに依存。D66N：そ的まま、D66S：升序。\n'
        + '===================================\n'
        + this.gameHelp;
    });
  }

  sendChat(event: KeyboardEvent) {
    if (event) event.preventDefault();

    if (!this.text.length) return;
    if (event && event.keyCode !== 13) return;

    if (!this.sender.length) this.sender = this.myPeer.identifier;
    if (this.chatTab) {
      this.chatMessageService.sendMessage(this.chatTab, this.text, this.gameType, this.sender, this.sendTo, this._color);
    }
    this.text = '';
    this.previousWritingLength = this.text.length;
    let textArea: HTMLTextAreaElement = this.textAreaElementRef.nativeElement;
    textArea.value = '';
    this.calcFitHeight();
  }

  showTabSetting() {
    let coordinate = this.pointerDeviceService.pointers[0];
    let option: PanelOption = { left: coordinate.x - 250, top: coordinate.y - 175, width: 500, height: 350 };
    let component = this.panelService.open<ChatTabSettingComponent>(ChatTabSettingComponent, option);
    component.selectedTab = this.chatTab;
  }

  onInput() {
    if (this.writingEventInterval === null && this.previousWritingLength <= this.text.length) {
      let sendTo: string = null;
      if (this.isDirect) {
        let object = ObjectStore.instance.get(this.sendTo);
        if (object instanceof PeerCursor) {
          let peer = PeerContext.create(object.peerId);
          if (peer) sendTo = peer.id;
        }
      }
      EventSystem.call('WRITING_A_MESSAGE', this.chatTabidentifier, sendTo);
      this.writingEventInterval = setTimeout(() => {
        this.writingEventInterval = null;
      }, 200);
    }
    this.previousWritingLength = this.text.length;
    this.calcFitHeight();
  }

  calcFitHeight() {
    let textArea: HTMLTextAreaElement = this.textAreaElementRef.nativeElement;
    textArea.style.height = '';
    if (textArea.scrollHeight >= textArea.offsetHeight) {
      textArea.style.height = textArea.scrollHeight + 'px';
    }
  }

  private allowsChat(gameCharacter: GameCharacter): boolean {
    switch (gameCharacter.location.name) {
      case 'table':
      case this.myPeer.peerId:
        return true;
      case 'graveyard':
        return false;
      default:
        for (const conn of Network.peerContexts) {
          if (conn.isOpen && gameCharacter.location.name === conn.fullstring) {
            return false;
          }
        }
        return true;
    }
  }
  changeIcon() {
    this.modalService.open<string>(FileSelecterComponent).then(value => {
      if (!this.myPeer || !value) return;
      this.myPeer.imageIdentifier = value;
    });
  }

  trackByChatTab(index: number, chatTab: ChatTab) {
    return chatTab.identifier;
  }
}
