import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { ChatPalette } from '@udonarium/chat-palette';
import { ChatTab } from '@udonarium/chat-tab';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem, Network } from '@udonarium/core/system';
import { PeerContext } from '@udonarium/core/system/network/peer-context';
import { DiceBot } from '@udonarium/dice-bot';
import { GameCharacter } from '@udonarium/game-character';
import { PeerCursor } from '@udonarium/peer-cursor';

import { TextViewComponent } from 'component/text-view/text-view.component';
import { ChatMessageService } from 'service/chat-message.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { GameObjectInventoryService} from 'service/game-object-inventory.service';

@Component({
  selector: 'chat-palette',
  templateUrl: './chat-palette.component.html',
  styleUrls: ['./chat-palette.component.css']
})
export class ChatPaletteComponent implements OnInit, OnDestroy {
  @ViewChild('textArea', { static: true }) textAreaElementRef: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatPlette', { static: false }) chatPletteElementRef: ElementRef<HTMLSelectElement>;
  @Input() character: GameCharacter = null;

  get palette(): ChatPalette { return this.character.chatPalette; }
  sendTo: string = '';
  get isDirect(): boolean { return this.sendTo != null && this.sendTo.length ? true : false }
  private _gameType: string = '';
  get gameType(): string { return this._gameType };
  set gameType(gameType: string) {
    this._gameType = gameType;
    if (this.character.chatPalette) this.character.chatPalette.dicebot = gameType;
  };
  chatTabidentifier: string = '';
  text: string = '';

  isEdit: boolean = false;
  editPalette: string = '';

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

  private writingEventInterval: NodeJS.Timer = null;
  private previousWritingLength: number = 0;

  private doubleClickTimer: NodeJS.Timer = null;

  get diceBotInfos() { return DiceBot.diceBotInfos }

  get chatTab(): ChatTab { return ObjectStore.instance.get<ChatTab>(this.chatTabidentifier); }
  get myPeer(): PeerCursor { return PeerCursor.myCursor; }
  get otherPeers(): PeerCursor[] { return ObjectStore.instance.getObjects(PeerCursor); }

  constructor(
    public chatMessageService: ChatMessageService,
    private panelService: PanelService,
    private pointerDeviceService: PointerDeviceService,
    private inventoryService: GameObjectInventoryService
  ) { }

  ngOnInit() {
    this.panelService.title = this.character.name + ' 的對話組合版';
    this.chatTabidentifier = this.chatMessageService.chatTabs ? this.chatMessageService.chatTabs[0].identifier : '';

    this.gameType = this.character.chatPalette ? this.character.chatPalette.dicebot : '';
    this.color = this.character.chatPalette ? this.character.chatPalette.color : '#000000';

    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.data.aliasName !== GameCharacter.aliasName) return;
        this.shouldUpdateCharacterList = true;
        if (this.character && !this.allowsChat(this.character)) {
          if (0 < this.gameCharacters.length) {
            this.onSelectedCharacter(this.gameCharacters[0].identifier);
          } else {
            this.panelService.close();
          }
        }
      })
      .on('DELETE_GAME_OBJECT', -1000, event => {
        if (this.character && this.character.identifier === event.data.identifier) {
          this.panelService.close();
        }
        if (this.chatTabidentifier === event.data.identifier) {
          this.chatTabidentifier = this.chatMessageService.chatTabs ? this.chatMessageService.chatTabs[0].identifier : '';
        }
      })
      .on('DISCONNECT_PEER', event => {
        let object = ObjectStore.instance.get(this.sendTo);
        if (object instanceof PeerCursor && object.peerId === event.data.peer) {
          this.sendTo = '';
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    if (this.isEdit) this.toggleEditMode();
  }

  updatePanelTitle() {
    this.panelService.title = this.character.name + ' 的對話組合版';
  }

  onSelectedCharacter(identifier: string) {
    if (this.isEdit) this.toggleEditMode();
    let object = ObjectStore.instance.get(identifier);
    if (object instanceof GameCharacter) this.character = object;
    this.updatePanelTitle();
  }

  selectPalette(line: string) {
    this.text = line;
    let textArea: HTMLTextAreaElement = this.textAreaElementRef.nativeElement;
    textArea.value = this.text;
  }

  clickPalette(line: string) {
    if (this.doubleClickTimer && this.text === line) {
      clearTimeout(this.doubleClickTimer);
      this.doubleClickTimer = null;
      this.sendChat(null);
    } else {
      this.text = line;
      let textArea: HTMLTextAreaElement = this.textAreaElementRef.nativeElement;
      textArea.value = this.text;
      this.doubleClickTimer = setTimeout(() => { this.doubleClickTimer = null }, 400);
    }
  }

  onChangeGameType(gameType: string) {
    console.log('onChangeGameType ready');
    DiceBot.getHelpMessage(this.gameType).then(help => {
      console.log('onChangeGameType done\n' + help);
    });
  }

  private _color: string = "#000000";
  get color(): string { return this._color };
  set color(color: string) {
    this._color = color;
    if (this.character.chatPalette) this.character.chatPalette.color = color;
  };
  onChangeColor(new_color: string) {
    this._color = new_color;
    if (this.character.chatPalette) this.character.chatPalette.color = new_color;
  }

  showDicebotHelp() {
    DiceBot.getHelpMessage(this.gameType).then(help => {
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
        '【擲骰BOT】你可以在聊天中進行自定義的擲骰\n'
      + '例如輸入）2D6+1　攻撃！\n'
      + '會輸出）   2D6+1　攻撃！\n'
      + '　　　　  DiceBot: (2D6) → 7\n'
      + '如上面一樣,在骰子數字後方隔空白位打字,就可以進行發言。\n'
      + '以下還有其他例子\n'
      + '　3D6+1>=9 ：骰出3d6+1然後判定是否大過等於9\n'
      + '　1D100<=50 ：進行D100 50%的判定\n'
      + '　3U6[5] ：擲出3D6，每骰出一粒5或以上的話會有獎勵骰一粒(可以無限獎勵)\n'
      + '　3B6 ：和3D6一樣,但不進行合併計算\n'
      + '　10B6>=4 ：擲出10d6,計算其中有多少粒骰大過等於4\n'
      + '　(8/2)D(4+6)<=(5*3)：骰子粒數和條件可以用算式\n'
      + '　C(10-4*3/2+2)：C(計算式）也可以只進行數字計算\n'
      + '　Choice[a,b,c]：列出不同的元素去選擇。例如隨機選出攻擊對象\n'
      + '　S3D6 ： 進行暗骰，其他人看不到結果\n'
      + '　3D6/2 ： 骰出的點數除2 (捨棄小數點)。RoundUp /2U、四捨五入 /2R。\n'
      + '　D66 ： 投擲D66。順序根據遊戲設定。D66N：正常、D66S：升序。\n'
        + '===================================\n'
        + help;
      console.log('onChangeGameType done');
    });
  }

  sendChat(event: KeyboardEvent) {
    if (event) event.preventDefault();

    if (!this.text.length) return;
    if (event && event.keyCode !== 13) return;

    if (this.chatTab) {
      let text = this.palette.evaluate(this.text, this.character.rootDataElement);
      this.chatMessageService.sendMessage(this.chatTab, text, this.gameType, this.character.identifier, this.sendTo, this._color);
    }
    this.text = '';
    this.previousWritingLength = this.text.length;
    let textArea: HTMLTextAreaElement = this.textAreaElementRef.nativeElement;
    textArea.value = '';
    this.resetPletteSelect();
    this.calcFitHeight();
  }

  resetPletteSelect() {
    if (!this.chatPletteElementRef.nativeElement) return;
    this.chatPletteElementRef.nativeElement.selectedIndex = -1;
  }

  toggleEditMode() {
    this.isEdit = this.isEdit ? false : true;
    if (this.isEdit) {
      this.editPalette = this.palette.value + '';
    } else {
      this.palette.setPalette(this.editPalette);
    }
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
}
