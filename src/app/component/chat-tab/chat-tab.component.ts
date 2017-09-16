import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { ChatMessageService } from '../../service/chat-message.service';

import { ChatTab } from '../../class/chat-tab';
import { ChatMessage, ChatMessageContext } from '../../class/chat-message';

@Component({
  selector: 'chat-tab',
  templateUrl: './chat-tab.component.html',
  styleUrls: ['./chat-tab.component.css']
})
export class ChatTabComponent implements OnInit {
  maxMessages: number = 1000;

  sampleMessages: ChatMessageContext[] = [
    { from: 'System', responseIdentifier: '', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: 'WebRTC(SkyWay)を利用してブラウザ間通信を行うTRPGオンセツールです。' },
    { from: 'System', responseIdentifier: '', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: '接続したPeer間で通信を行い、コマや画像ファイルなどを同期します。' },
    { from: 'System', responseIdentifier: '', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: 'ルームの状態を次回に持ち越したい場合は、必ず「保存」を実行してセーブデータ（zip）を生成してください。保存したzipの読み込みはブラウザ画面へのファイルドロップで行えます。' },
    { from: 'System', responseIdentifier: '', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: '動作推奨環境はデスクトップChromeです。今のところ、スマホからだと上手く操作できません。' },
    { from: 'System', responseIdentifier: '', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: 'チュートリアルは以上です。このチュートリアルは最初のチャットを入力すると非表示になります。' },
    { from: 'System', to: '???', responseIdentifier: '', timestamp: 0, imageIdentifier: '', tag: '', name: 'チュートリアル', text: 'ところでこれは隠しメッセージです' },
  ];

  get chatMessages(): ChatMessage[] {
    if (!this.chatTab) return [];
    let length = this.chatTab.chatMessages.length;
    if (length < this.maxMessages) return this.chatTab.chatMessages;
    return this.chatTab.chatMessages.slice(length - this.maxMessages, length);

  }

  @Input() chatTab: ChatTab;
  @Output() onAddMessage: EventEmitter<null> = new EventEmitter();

  constructor(
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
  }

  onMessageInit() {
    this.onAddMessage.emit();
  }
}
