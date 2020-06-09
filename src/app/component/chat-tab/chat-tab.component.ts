import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { ChatMessage, ChatMessageContext } from '@udonarium/chat-message';
import { ChatTab } from '@udonarium/chat-tab';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system';

import { ChatMessageService } from 'service/chat-message.service';
import { PanelService } from 'service/panel.service';

const DEFAULT_MESSAGE_LENGTH = 200;

@Component({
  selector: 'chat-tab',
  templateUrl: './chat-tab.component.html',
  styleUrls: ['./chat-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatTabComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges, AfterViewChecked {
  maxMessages: number = 0;
  preScrollBottom: number = -1;

  sampleMessages: ChatMessageContext[] = [
    {
      from: "System",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz",
      text: "烏冬說明: 這是由日本作者TK11235 所開發的開源TRPG跑團平台，使用MIT授權方式。特點是地圖顯示使用2.5D的方式，架構簡單，容易擴充。原版地址在底下。\n在這個平台中，主要的資料由使用者之間彼此傳送及處理，HKTRPG只是提供一個中文化的平台，棋子圖片等等都是儲存在使用者的電腦之中，所以離開前，請大家先按《保存房間》生成ZIP檔案，下次再使用時按《讀取房間》上傳檔案，不然房間就會像煙火一樣燒光。"
    }, {
      from: "System",
      to: "???",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz > 玩家",
      text: "使用教學: 對桌面右鍵->新增角色(或其他)，再對它連按兩下左鍵或按右鍵->顯示詳情，編輯內容，以後可以收進倉庫中。而在倉庫中，也是按右鍵，把角色移到桌面"
    }, {
      from: "System",
      to: "???",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz > 玩家",
      text: "密語並不會儲存到ZIP中。而當你的ID更新之後，你將無法再看見之前傳給您的密語，還請多加注意。"
    }, {
      from: "System",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz",
      text: "推薦使用桌面版Chrome。目前不支援以手機進行操作。\n"
    }, {
      from: "System",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz",
      text: "源碼：　https://github.com/zeteticl/udonarium\n 更新日誌：2020/02/19 \n 功能表可以在桌面直接生成角色，右鍵新增單張卡牌，人物複製可以選擇有序號或無序號，可輸出LOG，名字會有隨機數字，增加圖片標籤功能，音樂分成BGM和效果音，在關上網頁前會彈出提示的功能(防止沒有儲存房間)，對(角色，迷霧，地形 和倉庫角色)按兩下左鍵可以顯示詳情。"
    }, {
      from: "System",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz",
      text: "更新日誌：2020/02/22 \n 新增GM圖層(其實是鎖起來，只有自己看得見，根據玩家名稱來儲存，所以轉換名稱就會失效)，儲存玩家名稱。"
    }, {
      from: "System",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz",
      text: "更新日誌：2020/03/10 \n 新增文字倉庫，因為Coding能力問題，文字倉庫需要關閉重開才會更新內容。\n Ctrl+S 可以儲存房間。\n增加高度設定，用來裝飾房間"
    }, {
      from: "System",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz",
      text: "更新日誌：2020/03/12 \n 增加角色卡能力可以顯示在聊天視窗，如果使用指令，可以作為擲骰功能。"
    }, {
      from: "System",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz",
      text: "更新日誌：2020/03/21 \n  筆記倉庫加回位置，人物倉庫直接顯示部份指令。\n 2020/03/28\n 增加效果音的開關鍵，debug: 右鍵不會再彈出普通的Menu\n2020/04/17 更新COC骰表"
    }
    , {
      from: "System",
      timestamp: 0,
      imageIdentifier: "",
      tag: "",
      name: "教學Zzzzzz",
      text: "更新日誌：2020/06/05 \n  加上最小化視窗功能, 方便手機端使用\n2020/06/09 更新package的版本。點擊聊天視窗的角色圖可以更改圖示。更改背景GIF圖為月亮，雲動的太快，好暈。"
    }
    , {
      from: "System",
      timestamp: 9999999999999,
      imageIdentifier: "",
      tag: "",
      name: "連結:",
      text: "https://udonarium.app/ 原版連結\nhttps://discord.gg/vx4kcm7 意見留言DISCORD群\nhttps://www.facebook.com/groups/HKTRPG 香港TRPG研究社\nhttps://www.hktrpg.com/ TRPG百科\nhttps://www.patreon.com/HKTRPG HKTPRG開發支援"
    }
  ];

  private oldestTimestamp = 0;
  private needUpdate = true;
  private _chatMessages: ChatMessage[] = [];
  get chatMessages(): ChatMessage[] {
    if (!this.chatTab) return [];
    if (this.needUpdate) {
      let chatMessages = this.chatTab.chatMessages;
      let length = chatMessages.length;
      this._chatMessages = length <= this.maxMessages
        ? chatMessages
        : chatMessages.slice(length - this.maxMessages);
      this.oldestTimestamp = 0 < this._chatMessages.length ? this._chatMessages[0].timestamp : 0;
      this.needUpdate = false;
    }
    return this._chatMessages;
  }

  get hasMany(): boolean {
    if (!this.chatTab) return false;
    return this.maxMessages < this.chatTab.chatMessages.length;
  };

  private callbackOnScroll: any = (e) => this.onScroll(e);

  private asyncMessagesInitializeTimer: NodeJS.Timer;

  @Input() chatTab: ChatTab;
  @Output() onAddMessage: EventEmitter<null> = new EventEmitter();

  constructor(
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef,
    private chatMessageService: ChatMessageService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    let messages: ChatMessage[] = [];
    for (let context of this.sampleMessages) {
      let message = new ChatMessage();
      for (let key in context) {
        if (key === 'identifier') continue;
        if (key === 'tabIdentifier') continue;
        if (key === 'text') {
          message.value = context[key];
          continue;
        }
        if (context[key] == null || context[key] === '') continue;
        message.setAttribute(key, context[key]);
      }
      messages.push(message);
    }
    this.sampleMessages = messages;

    EventSystem.register(this)
      .on('MESSAGE_ADDED', event => {
        let message = ObjectStore.instance.get<ChatMessage>(event.data.messageIdentifier);
        if (!message || message.parent !== this.chatTab) return;
        let time = this.chatMessageService.getTime();

        if (!this.needUpdate && this.oldestTimestamp < message.timestamp) this.changeDetector.markForCheck();
        this.needUpdate = true;

        if (time - (1000 * 60 * 3) < message.timestamp) {
          let top = this.panelService.scrollablePanel.scrollHeight - this.panelService.scrollablePanel.clientHeight;
          if (this.panelService.scrollablePanel.scrollTop < top - 150) {
            this.maxMessages += 1;
          }
        } else {
          this.maxMessages = 3;
          clearInterval(this.asyncMessagesInitializeTimer);
          this.asyncMessagesInitializeTimer = setInterval(() => {
            clearInterval(this.asyncMessagesInitializeTimer);
            this.ngZone.run(() => this.resetMessages());
          }, 2000);
        }
      })
      .on('UPDATE_GAME_OBJECT', event => {
        let message = ObjectStore.instance.get(event.data.identifier);
        if (message && message instanceof ChatMessage && this.oldestTimestamp <= message.timestamp && this.chatTab.contains(message)) this.changeDetector.markForCheck();
      });
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.panelService.scrollablePanel.addEventListener('scroll', this.callbackOnScroll, false));
    });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.panelService.scrollablePanel.removeEventListener('scroll', this.callbackOnScroll, false);
  }

  ngOnChanges() {
    this.resetMessages();
  }

  ngAfterViewChecked() {
    if (0 <= this.preScrollBottom) {
      this.panelService.scrollablePanel.scrollTop = this.panelService.scrollablePanel.scrollHeight - this.preScrollBottom;
      this.preScrollBottom = -1;
    }
  }

  moreMessages(length: number = 100) {
    if (!this.hasMany) return;

    this.maxMessages += length;
    let maxLength = this.chatTab.chatMessages.length;
    if (this.chatTab && maxLength < this.maxMessages) this.maxMessages = maxLength;
    this.changeDetector.markForCheck();
    this.needUpdate = true;

    this.preScrollBottom = this.panelService.scrollablePanel.scrollHeight - this.panelService.scrollablePanel.scrollTop;
  }

  onMessageInit() {
    this.onAddMessage.emit();
  }

  resetMessages() {
    this.needUpdate = true;
    this.maxMessages = 10;

    clearInterval(this.asyncMessagesInitializeTimer);
    let length = DEFAULT_MESSAGE_LENGTH;
    this.asyncMessagesInitializeTimer = setInterval(() => {
      if (this.hasMany && 0 < length) {
        length -= 10;
        this.moreMessages(10);
      } else {
        clearInterval(this.asyncMessagesInitializeTimer);
      }
    }, 0);
  }

  trackByChatMessage(index: number, message: ChatMessage) {
    return message.identifier;
  }

  private onScroll(e: Event) {
    if (this.hasMany && this.panelService.scrollablePanel.scrollTop <= 200) {
      this.moreMessages(8);
      this.ngZone.run(() => { });
    } else if (this.chatTab.hasUnread) {
      let top = this.panelService.scrollablePanel.scrollHeight - this.panelService.scrollablePanel.clientHeight;
      if (top - 100 <= this.panelService.scrollablePanel.scrollTop) {
        this.chatTab.markForRead();
        this.ngZone.run(() => { });
      }
    }
  }
}
