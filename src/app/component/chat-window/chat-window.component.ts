import { Component, OnInit, OnDestroy, NgZone, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { TextViewComponent } from '../text-view/text-view.component';

import { ChatMessageService } from '../../service/chat-message.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerDeviceService } from '../../service/pointer-device.service';

import { ChatTab } from '../../class/chat-tab';
import { ChatMessage, ChatMessageContext } from '../../class/chat-message';
import { GameCharacter } from '../../class/game-character';
import { PeerCursor } from '../../class/peer-cursor';
import { DiceBot } from '../../class/dice-bot';
import { Network, EventSystem } from '../../class/core/system/system';
import { PeerContext } from '../../class/core/system/network/peer-context';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ChatTabSettingComponent } from '../chat-tab-setting/chat-tab-setting.component';

@Component({
  selector: 'chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'scale3d(1, 1, 1)' })),
      transition('void => *', [
        //style({ transform: 'scale3d(0, 0, 0)' }),
        //animate(100)
        animate('600ms ease', keyframes([
          style({ transform: 'scale3d(0, 0, 0)', offset: 0 }),
          style({ transform: 'scale3d(1.5, 1.5, 1.5)', offset: 0.5 }),
          style({ transform: 'scale3d(0.75, 0.75, 0.75)', offset: 0.75 }),
          style({ transform: 'scale3d(1.125, 1.125, 1.125)', offset: 0.875 }),
          style({ transform: 'scale3d(1.0, 1.0, 1.0)', offset: 1.0 })
        ]))
      ]),
      transition('* => void', [
        animate(100, style({ transform: 'scale3d(0, 0, 0)' }))
      ])
    ])
  ]
})

export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('textArea') textAreaElementRef: ElementRef;

  sender: string = 'Guest';
  text: string = '';
  sendTo: string = '';
  get isDirect(): boolean { return this.sendTo != null && this.sendTo.length ? true : false }
  //gameType: string = '';
  get gameType(): string { return this.chatMessageService.gameType; }
  set gameType(gameType: string) { this.chatMessageService.gameType = gameType; }
  gameHelp: string = '';

  private shouldUpdateCharacterList: boolean = true;
  private _gameCharacters: GameCharacter[] = [];
  get gameCharacters(): GameCharacter[] {
    if (this.shouldUpdateCharacterList) {
      this.shouldUpdateCharacterList = false;
      this._gameCharacters = this.objectStore
        .getObjects<GameCharacter>(GameCharacter)
        .filter(character => this.allowsChat(character));
    }
    return this._gameCharacters;
  }

  gameCharacter: GameCharacter = null;

  private _chatTabidentifier: string = '';
  get chatTabidentifier(): string { return this._chatTabidentifier; }
  set chatTabidentifier(chatTabidentifier: string) {
    if (this._chatTabidentifier !== chatTabidentifier) this.scrollToBottom(true);
    this._chatTabidentifier = chatTabidentifier;
    this.updatePanelTitle();
  }

  get chatTab(): ChatTab { return this.objectStore.get<ChatTab>(this.chatTabidentifier); }
  maxLogLength: number = 1000;
  isAutoScroll: boolean = true;
  scrollToBottomTimer: NodeJS.Timer = null;

  eventSystem = EventSystem;
  objectStore = ObjectStore.instance;
  //network = Network;

  private writingEventInterval: NodeJS.Timer = null;
  private previousWritingLength: number = 0;
  writingPeers: Map<string, NodeJS.Timer> = new Map();
  writingPeerNames: string[] = [];

  get network() { return Network; };
  get diceBotInfos() { return DiceBot.diceBotInfos }
  get myPeer(): PeerCursor { return PeerCursor.myCursor; }//this.objectStore.get<PeerCursor>(this.network.peerId); }
  get otherPeers(): PeerCursor[] { return ObjectStore.instance.getObjects(PeerCursor); }

  constructor(
    private ngZone: NgZone,
    //private eventSystem: EventSystem,
    //private objectStore: objectStore,
    //private network: Network,
    public chatMessageService: ChatMessageService,
    private panelService: PanelService,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.sender = this.network.peerId;
    console.log(this.chatMessageService.chatTabs);
    this.chatTabidentifier = 0 < this.chatMessageService.chatTabs.length ? this.chatMessageService.chatTabs[0].identifier : '';

    this.eventSystem.register(this)
      .on<ChatMessageContext>('BROADCAST_MESSAGE', -1000, event => {
        if (event.isSendFromSelf && event.data.tabIdentifier === this.chatTabidentifier) {
          this.scrollToBottom(true);
        } else {
          this.checkAutoScroll();
        }
        if (this.writingPeers.has(event.sendFrom)) {
          clearTimeout(this.writingPeers.get(event.sendFrom));
          this.writingPeers.delete(event.sendFrom);
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
      }).on('CLOSE_OTHER_PEER', event => {
        let object = this.objectStore.get(this.sendTo);
        if (object instanceof PeerCursor && object.peerId === event.data.peer) {
          this.sendTo = '';
        }
      })
      .on<string>('WRITING_A_MESSAGE', event => {
        if (event.isSendFromSelf || event.data !== this.chatTabidentifier) return;
        if (this.writingPeers.has(event.sendFrom)) clearTimeout(this.writingPeers.get(event.sendFrom));
        this.writingPeers.set(event.sendFrom, setTimeout(() => {
          this.ngZone.run(() => {
            this.writingPeers.delete(event.sendFrom);
            this.updateWritingPeerNames();
          });
        }, 2000));
        this.updateWritingPeerNames();
      });
    this.updatePanelTitle();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.scrollToBottom(true);
    }, 0);
  }

  ngOnDestroy() {
    this.eventSystem.unregister(this);
  }

  private updateWritingPeerNames() {
    this.writingPeerNames = Array.from(this.writingPeers.keys()).map(peerId => {
      let peer = PeerCursor.find(peerId);
      return peer ? peer.name : '';
    });
  }

  // @TODO やり方はもう少し考えた方がいいい
  scrollToBottom(isForce: boolean = false) {
    if (!this.panelService.scrollablePanel || this.scrollToBottomTimer != null) return;

    if (isForce) {
      this.isAutoScroll = true;
    }
    if (this.isAutoScroll) {
      this.scrollToBottomTimer = setTimeout(() => {
        this.scrollToBottomTimer = null;
        this.panelService.scrollablePanel.scrollTop = this.panelService.scrollablePanel.scrollHeight;
      }, 0);
    }
  }

  // @TODO
  checkAutoScroll() {
    if (!this.panelService.scrollablePanel) return;
    let top = this.panelService.scrollablePanel.scrollHeight - this.panelService.scrollablePanel.clientHeight;
    if (top <= this.panelService.scrollablePanel.scrollTop) {
      this.isAutoScroll = true;
    } else {
      this.isAutoScroll = false;
    }
  }

  updatePanelTitle() {
    if (this.chatTab) {
      this.panelService.title = 'チャットウィンドウ - ' + this.chatTab.name;
    } else {
      this.panelService.title = 'チャットウィンドウ';
    }
  }

  onSelectedTab(identifier: string) {
    //this.chatTabidentifier = identifier;
    this.updatePanelTitle();
  }

  onSelectedCharacter(identifier: string) {
    let object = this.objectStore.get(identifier);
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

  showDicebotHelp() {
    DiceBot.getHelpMessage(this.gameType).then(help => {
      this.gameHelp = help;

      let gameName: string = 'ダイスボット';
      for (let diceBotInfo of DiceBot.diceBotInfos) {
        if (diceBotInfo.script === this.gameType) {
          gameName = 'ダイスボット<' + diceBotInfo.game + '＞'
        }
      }
      gameName += 'の説明';

      let coordinate = this.pointerDeviceService.pointers[0];
      let option: PanelOption = { left: coordinate.x, top: coordinate.y, width: 600, height: 500 };
      let textView = this.panelService.open(TextViewComponent, option);
      textView.title = gameName;
      textView.text =
        '【ダイスボット】チャットにダイス用の文字を入力するとダイスロールが可能\n'
        + '入力例）２ｄ６＋１　攻撃！\n'
        + '出力例）2d6+1　攻撃！\n'
        + '　　　　  diceBot: (2d6) → 7\n'
        + '上記のようにダイス文字の後ろに空白を入れて発言する事も可能。\n'
        + '以下、使用例\n'
        + '　3D6+1>=9 ：3d6+1で目標値9以上かの判定\n'
        + '　1D100<=50 ：D100で50％目標の下方ロールの例\n'
        + '　3U6[5] ：3d6のダイス目が5以上の場合に振り足しして合計する(上方無限)\n'
        + '　3B6 ：3d6のダイス目をバラバラのまま出力する（合計しない）\n'
        + '　10B6>=4 ：10d6を振り4以上のダイス目の個数を数える\n'
        + '　(8/2)D(4+6)<=(5*3)：個数・ダイス・達成値には四則演算も使用可能\n'
        + '　C(10-4*3/2+2)：C(計算式）で計算だけの実行も可能\n'
        + '　choice[a,b,c]：列挙した要素から一つを選択表示。ランダム攻撃対象決定などに\n'
        + '　S3d6 ： 各コマンドの先頭に「S」を付けると他人結果の見えないシークレットロール\n'
        + '　3d6/2 ： ダイス出目を割り算（切り捨て）。切り上げは /2U、四捨五入は /2R。\n'
        + '　D66 ： D66ダイス。順序はゲームに依存。D66N：そのまま、D66S：昇順。\n'
        + '===================================\n'
        + this.gameHelp;
    });
  }

  sendChat(event: KeyboardEvent) {
    if (event) event.preventDefault();

    if (!this.text.length) return;

    if (event.keyCode !== 13) return;

    if (!this.sender.length) this.sender = this.network.peerId;

    let time = this.chatMessageService.getTime();
    console.log('time:' + time);
    let chatMessage: ChatMessageContext = {
      from: this.network.peerContext.id,
      name: this.sender,
      text: this.text,
      timestamp: time,
      tag: this.gameType,
      imageIdentifier: '',
    };

    if (this.sender === this.network.peerId || !this.gameCharacter) {
      chatMessage.imageIdentifier = this.myPeer.imageIdentifier;
      chatMessage.name = this.myPeer.name;
    } else if (this.gameCharacter) {
      chatMessage.imageIdentifier = (this.gameCharacter.imageFile ? this.gameCharacter.imageFile.identifier : '');
      chatMessage.name = this.gameCharacter.name;
    }

    if (this.sendTo != null && this.sendTo.length) {
      let name = '';
      let object = this.objectStore.get(this.sendTo);
      if (object instanceof GameCharacter) {
        name = object.name;
        chatMessage.to = object.identifier;
      } else if (object instanceof PeerCursor) {
        name = object.name;
        let peer = PeerContext.create(object.peerId);
        if (peer) chatMessage.to = peer.id;
      }
      chatMessage.name += ' > ' + name;
    }
    console.log(chatMessage);

    //this.eventSystem.call('BROADCAST_MESSAGE', chatMessage);
    if (this.chatTab) this.chatTab.addMessage(chatMessage);
    //this.scrollToBottom(true);
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
        let object = this.objectStore.get(this.sendTo);
        if (object instanceof PeerCursor) {
          let peer = PeerContext.create(object.peerId);
          if (peer) sendTo = peer.id;
        }
      }
      this.eventSystem.call('WRITING_A_MESSAGE', this.chatTabidentifier, sendTo);
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
}
