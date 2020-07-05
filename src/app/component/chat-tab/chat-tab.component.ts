import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { ChatMessage, ChatMessageContext } from '@udonarium/chat-message';
import { ChatTab } from '@udonarium/chat-tab';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system';
import { setZeroTimeout } from '@udonarium/core/system/util/zero-timeout';

import { PanelService } from 'service/panel.service';

const ua = window.navigator.userAgent.toLowerCase();
const isiOS = ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 || ua.indexOf('macintosh') > -1 && 'ontouchend' in document;

@Component({
  selector: 'chat-tab',
  templateUrl: './chat-tab.component.html',
  styleUrls: ['./chat-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatTabComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges, AfterViewChecked {
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
      text: "更新日誌：2020/06/05 \n  加上最小化視窗功能, 方便手機端使用\n2020/06/09 更新package的版本。點擊聊天視窗的角色圖可以更改圖示。更改背景GIF圖為月亮，雲動的太快，好暈。\n2020/06/17 更新直到今天的官方修正，版本號沒有改變。"
    }
    , {
      from: "System",
      timestamp: 2445551999,
      imageIdentifier: "",
      tag: "",
      name: "連結:",
      text: "https://udonarium.app/ 原版連結\nhttps://discord.gg/vx4kcm7 意見留言DISCORD群\nhttps://www.facebook.com/groups/HKTRPG 香港TRPG研究社\nhttps://www.hktrpg.com/ TRPG百科\nhttps://www.patreon.com/HKTRPG HKTPRG開發支援\n\n\n\n\n"
    }
  ];

  private topTimestamp = 0;
  private botomTimestamp = 0;

  private needUpdate = true;

  @ViewChild('logContainer', { static: true }) logContainerRef: ElementRef<HTMLDivElement>;
  @ViewChild('messageContainer', { static: true }) messageContainerRef: ElementRef<HTMLDivElement>;

  private topElm: HTMLElement = null;
  private bottomElm: HTMLElement = null;
  private topElmBox: ClientRect = null;
  private bottomElmBox: ClientRect = null;

  private topIndex = 0;
  private bottomIndex = 0;

  private minMessageHeight: number = 61;

  private preScrollTop = 0;
  private scrollSpeed = 0;

  private _chatMessages: ChatMessage[] = [];
  get chatMessages(): ChatMessage[] {
    if (!this.chatTab) return [];
    if (this.needUpdate) {
      this.needUpdate = false;
      let chatMessages = this.chatTab ? this.chatTab.chatMessages : [];
      this.adjustIndex();

      this._chatMessages = chatMessages.slice(this.topIndex, this.bottomIndex + 1);
      this.topTimestamp = 0 < this._chatMessages.length ? this._chatMessages[0].timestamp : 0;
      this.botomTimestamp = 0 < this._chatMessages.length ? this._chatMessages[this._chatMessages.length - 1].timestamp : 0;
    }
    return this._chatMessages;
  }

  get minScrollHeight(): number {
    let length = this.chatTab ? this.chatTab.chatMessages.length : this.sampleMessages.length;
    return (length < 10000 ? length : 10000) * this.minMessageHeight;
  }

  get topSpace(): number { return this.minScrollHeight - this.bottomSpace; }
  get bottomSpace(): number {

    return this.chatTab ? (this.chatTab.chatMessages.length - this.bottomIndex - 1) * this.minMessageHeight : (this.sampleMessages.length - this.bottomIndex - 1);
  }

  private scrollEventTimer: NodeJS.Timer = null;
  private addMessageEventTimer: NodeJS.Timer = null;

  private callbackOnScroll: any = () => this.onScroll();
  private callbackOnScrollToBottom: any = () => this.resetMessages();

  @Input() chatTab: ChatTab;
  @Output() onAddMessage: EventEmitter<null> = new EventEmitter();

  constructor(
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef,
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
        if (!message || !this.chatTab.contains(message)) return;

        if (this.topTimestamp < message.timestamp) {
          this.changeDetector.markForCheck();
          this.needUpdate = true;
          this.onMessageInit();
        }
      })
      .on('UPDATE_GAME_OBJECT', event => {
        let message = ObjectStore.instance.get(event.data.identifier);
        if (message && message instanceof ChatMessage
          && this.topTimestamp <= message.timestamp && message.timestamp < this.botomTimestamp
          && this.chatTab.contains(message)) {
          this.changeDetector.markForCheck();
        }
      });
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.onScroll();
      this.panelService.scrollablePanel.addEventListener('scroll', this.callbackOnScroll, false);
      this.panelService.scrollablePanel.addEventListener('scrolltobottom', this.callbackOnScrollToBottom, false);
    });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.panelService.scrollablePanel.removeEventListener('scroll', this.callbackOnScroll, false);
    this.panelService.scrollablePanel.removeEventListener('scrolltobottom', this.callbackOnScrollToBottom, false);
  }

  ngOnChanges() {
    Promise.resolve().then(() => this.resetMessages());
  }

  ngAfterViewChecked() {
    if (!this.topElm || !this.bottomElm) return;
    this.ngZone.runOutsideAngular(() => {
      Promise.resolve().then(() => this.adjustScrollPosition());
    });
  }

  onMessageInit() {
    if (this.addMessageEventTimer != null) return;
    this.ngZone.runOutsideAngular(() => {
      this.addMessageEventTimer = setTimeout(() => {
        this.ngZone.run(() => {
          clearTimeout(this.addMessageEventTimer);
          this.addMessageEventTimer = null;
          this.onAddMessage.emit()
        });
      }, 66);
    });
  }

  resetMessages() {
    let lastIndex = this.chatTab ? this.chatTab.chatMessages.length - 1 : this.sampleMessages.length - 1;
    this.topIndex = lastIndex - Math.floor(this.panelService.scrollablePanel.clientHeight / this.minMessageHeight);
    this.bottomIndex = lastIndex;
    this.needUpdate = true;
    this.preScrollTop = -1;
    this.scrollSpeed = 0;
    this.topElm = this.bottomElm = null;
    this.adjustIndex();
    this.changeDetector.markForCheck();
  }

  trackByChatMessage(index: number, message: ChatMessage) {
    return message.identifier;
  }

  private adjustIndex() {
    let chatMessages = this.chatTab ? this.chatTab.chatMessages : [];
    let lastIndex = 0 < chatMessages.length ? chatMessages.length - 1 : 0;

    if (this.topIndex < 0) {
      this.topIndex = 0;
    }
    if (lastIndex < this.bottomIndex) {
      this.bottomIndex = lastIndex;
    }

    if (this.topIndex < 0) this.topIndex = 0;
    if (this.bottomIndex < 0) this.bottomIndex = 0;
    if (lastIndex < this.topIndex) this.topIndex = lastIndex;
    if (lastIndex < this.bottomIndex) this.bottomIndex = lastIndex;
  }

  private getScrollPosition(): { top: number, bottom: number, clientHeight: number, scrollHeight: number } {
    let top = this.panelService.scrollablePanel.scrollTop;
    let clientHeight = this.panelService.scrollablePanel.clientHeight;
    let scrollHeight = this.panelService.scrollablePanel.scrollHeight;
    if (top < 0) top = 0;
    if (scrollHeight - clientHeight < top)
      top = scrollHeight - clientHeight;
    let bottom = top + clientHeight;
    return { top, bottom, clientHeight, scrollHeight };
  }

  private adjustScrollPosition() {
    if (!this.topElm || !this.bottomElm) return;

    let hasTopElm = this.logContainerRef.nativeElement.contains(this.topElm);
    let hasBotomElm = this.logContainerRef.nativeElement.contains(this.bottomElm);

    let hasTopBlank = !hasTopElm;
    let hasBotomBlank = !hasBotomElm;

    if (hasTopElm || hasBotomElm) {
      let elm: HTMLElement = null;
      let prevBox: ClientRect = null;
      let currentBox: ClientRect = null;
      let diff: number = 0;
      if (hasBotomElm) {
        elm = this.bottomElm;
        prevBox = this.bottomElmBox;
      } else if (hasTopElm) {
        elm = this.topElm;
        prevBox = this.topElmBox;
      }
      currentBox = elm.getBoundingClientRect();
      diff = Math.floor(prevBox.top - currentBox.top - this.scrollSpeed);
      if ((!hasTopBlank || !hasBotomBlank) && 3 ** 2 < diff ** 2) {
        this.panelService.scrollablePanel.scrollTop -= diff;
      }

      let logBox: ClientRect = this.logContainerRef.nativeElement.getBoundingClientRect();
      let messageBox: ClientRect = this.messageContainerRef.nativeElement.getBoundingClientRect();

      let messageBoxTop = messageBox.top - logBox.top;
      let messageBoxBottom = messageBoxTop + messageBox.height;

      let scrollPosition = this.getScrollPosition();

      hasTopBlank = scrollPosition.top < messageBoxTop;
      hasBotomBlank = messageBoxBottom < scrollPosition.bottom && scrollPosition.bottom < scrollPosition.scrollHeight;
    }

    this.topElm = this.bottomElm = null;

    if (hasTopBlank || hasBotomBlank || (!hasTopElm && !hasBotomElm)) {
      setZeroTimeout(() => this.lazyScrollUpdate());
    }
  }

  private markForReadIfNeeded() {
    if (!this.chatTab) return;
    if (!this.chatTab.hasUnread) return;

    let scrollPosition = this.getScrollPosition();
    if (scrollPosition.scrollHeight <= scrollPosition.bottom + 100) {
      setZeroTimeout(() => {
        this.chatTab.markForRead();
        this.changeDetector.markForCheck();
        this.ngZone.run(() => { });
      });
    }
  }

  private onScroll() {
    if (this.scrollEventTimer != null) return;
    this.scrollEventTimer = setTimeout(() => this.lazyScrollUpdate(), 100);
  }

  private lazyScrollUpdate() {
    clearTimeout(this.scrollEventTimer);
    this.scrollEventTimer = null;

    let chatMessageElements = this.messageContainerRef.nativeElement.querySelectorAll<HTMLElement>('chat-message');
    let maxHeight = this.minMessageHeight;

    for (let i = chatMessageElements.length - 1; 0 <= i; i--) {
      let height = chatMessageElements[i].clientHeight;
      if (maxHeight < height) maxHeight = height;
    }

    let messageBoxTop = this.messageContainerRef.nativeElement.offsetTop;
    let messageBoxBottom = messageBoxTop + this.messageContainerRef.nativeElement.clientHeight;

    let preTopIndex = this.topIndex;
    let preBottomIndex = this.bottomIndex;

    let scrollPosition = this.getScrollPosition();
    this.scrollSpeed = scrollPosition.top - this.preScrollTop;
    this.preScrollTop = scrollPosition.top;

    let scrollWideTop = scrollPosition.top - 400;
    let scrollWideBottom = scrollPosition.bottom + 400;

    this.markForReadIfNeeded();

    if (scrollWideTop >= messageBoxBottom || messageBoxTop >= scrollWideBottom) {
      let lastIndex = this.chatTab ? this.chatTab.chatMessages.length - 1 : this.sampleMessages.length - 1;
      let scrollBottomHeight = scrollPosition.scrollHeight - scrollPosition.top - scrollPosition.clientHeight;

      this.bottomIndex = lastIndex - Math.floor(scrollBottomHeight / this.minMessageHeight);
      this.topIndex = this.bottomIndex - Math.floor(scrollPosition.clientHeight / this.minMessageHeight);

      this.bottomIndex += 1;
      this.topIndex -= 1;
    } else {
      if (scrollWideTop < messageBoxTop) {
        this.topIndex -= Math.floor((messageBoxTop - scrollWideTop) / maxHeight) + 1;
      } else if (scrollWideTop > messageBoxTop) {
        if (!isiOS) this.topIndex += Math.floor((scrollWideTop - messageBoxTop) / maxHeight);
      }

      if (messageBoxBottom > scrollWideBottom) {
        if (!isiOS) this.bottomIndex -= Math.floor((messageBoxBottom - scrollWideBottom) / maxHeight);
      } else if (messageBoxBottom < scrollWideBottom) {
        this.bottomIndex += Math.floor((scrollWideBottom - messageBoxBottom) / maxHeight) + 1;
      }
    }

    this.adjustIndex();
    let isChangedIndex = this.topIndex != preTopIndex || this.bottomIndex != preBottomIndex;

    if (!isChangedIndex) return;

    this.needUpdate = true;

    this.topElm = chatMessageElements[0];
    this.bottomElm = chatMessageElements[chatMessageElements.length - 1];
    this.topElmBox = this.topElm.getBoundingClientRect();
    this.bottomElmBox = this.bottomElm.getBoundingClientRect();

    setZeroTimeout(() => {
      let scrollPosition = this.getScrollPosition();
      this.scrollSpeed = scrollPosition.top - this.preScrollTop;
      this.preScrollTop = scrollPosition.top;
      this.changeDetector.markForCheck();
      this.ngZone.run(() => { });
    });
  }
}
