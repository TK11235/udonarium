import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy, OnChanges, ChangeDetectorRef, AfterViewChecked } from '@angular/core';

import { ChatMessageService } from '../../service/chat-message.service';

import { ChatTab } from '../../class/chat-tab';
import { ChatMessage, ChatMessageContext } from '../../class/chat-message';
import { EventSystem } from '../../class/core/system/system';
import { PanelService } from '../../service/panel.service';

@Component({
  selector: 'chat-tab',
  templateUrl: './chat-tab.component.html',
  styleUrls: ['./chat-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatTabComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  maxMessages: number = 200;
  preScrollBottom: number = -1;

  sampleMessages: ChatMessageContext[] = [
    { from: 'System', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: 'WebRTC(SkyWay)を利用してブラウザ間通信を行うTRPGオンセツールです。接続した参加者との間で通信を行い、コマや画像ファイルなどを同期します。' },
    { from: 'System', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: 'ルームの状態を次回に持ち越したい場合は、必ず「保存」を実行してセーブデータ（zip）を生成してください。保存したzipの読み込みはブラウザ画面へのファイルドロップで行えます。' },
    { from: 'System', to: '???', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル > プレイヤー', text: 'ダイレクトメッセージ（秘密会話）はセーブデータに記録されません。' },
    { from: 'System', to: '???', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル > プレイヤー', text: 'また、過去のダイレクトメッセージはあなたのIDが更新されると同じルーム内であっても見えなくなります。注意してください。' },
    { from: 'System', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: '動作推奨環境はデスクトップChromeです。今のところ、スマホからだと上手く操作できません。' },
    { from: 'System', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: 'チュートリアルは以上です。このチュートリアルは最初のチャットを入力すると非表示になります。' },
  ];

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
      this.needUpdate = false;
    }
    return this._chatMessages;
  }

  get hasMany(): boolean {
    if (!this.chatTab) return false;
    return this.maxMessages < this.chatTab.chatMessages.length;
  };

  @Input() chatTab: ChatTab;
  @Output() onAddMessage: EventEmitter<null> = new EventEmitter();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService,
    private chatMessageService: ChatMessageService
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
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.data.aliasName === ChatMessage.aliasName) {
          if (!this.needUpdate) this.changeDetector.markForCheck();
          this.needUpdate = true;
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  ngOnChanges() {
    this.needUpdate = true;
    this.maxMessages = 200;
  }

  ngAfterViewChecked() {
    if (0 <= this.preScrollBottom) {
      this.panelService.scrollablePanel.scrollTop = this.panelService.scrollablePanel.scrollHeight - this.preScrollBottom;
      this.preScrollBottom = -1;
    }
  }

  moreMessages() {
    this.maxMessages += 100;
    if (this.chatTab && this.chatTab.chatMessages.length < this.maxMessages) this.maxMessages = this.chatTab.chatMessages.length;
    this.changeDetector.markForCheck();
    this.needUpdate = true;

    EventSystem.trigger('BROADCAST_MESSAGE', {
      from: '', name: '', text: '', timestamp: 0, tag: '', imageIdentifier: '', responseIdentifier: '',
    });

    this.preScrollBottom = this.panelService.scrollablePanel.scrollHeight - this.panelService.scrollablePanel.scrollTop;
  }

  onMessageInit() {
    this.onAddMessage.emit();
  }

  trackByChatMessage(index: number, message: ChatMessage) {
    return message.identifier;
  }
}
