import { Component, OnDestroy, OnInit } from '@angular/core';

import { ChatTab } from '@udonarium/chat-tab';
import { ObjectSerializer } from '@udonarium/core/synchronize-object/object-serializer';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system';

import { ChatMessageService } from 'service/chat-message.service';
import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';
import { SaveDataService } from 'service/save-data.service';


@Component({
  selector: 'app-chat-tab-setting',
  templateUrl: './chat-tab-setting.component.html',
  styleUrls: ['./chat-tab-setting.component.css']
})
export class ChatTabSettingComponent implements OnInit, OnDestroy {
  selectedTab: ChatTab = null;
  selectedTabXml: string = '';
  enableEdit: boolean = false;
  get tabName(): string { return this.selectedTab.name; }
  set tabName(tabName: string) { if (this.isEditable) this.selectedTab.name = tabName; }

  get chatTabs(): ChatTab[] { return this.chatMessageService.chatTabs; }
  get isEmpty(): boolean { return this.chatMessageService.chatTabs.length < 1 }
  get isDeleted(): boolean { return this.selectedTab ? ObjectStore.instance.get(this.selectedTab.identifier) == null : false; }
  get isEditable(): boolean { return !this.isEmpty && !this.isDeleted; }

  get receiveInfo(): boolean { return this.selectedTab.receiveInfo; }
  set receiveInfo(receiveInfo: boolean) {
    this.chatMessageService.setReceiveInfo(this.selectedTab, receiveInfo);
  }

  constructor(
    private modalService: ModalService,
    private panelService: PanelService,
    private chatMessageService: ChatMessageService,
    private saveDataService: SaveDataService
  ) { }

  ngOnInit() {
    this.modalService.title = this.panelService.title = '聊天分頁設定';
    EventSystem.register(this)
      .on('DELETE_GAME_OBJECT', 1000, event => {
        if (!this.selectedTab || event.data.identifier !== this.selectedTab.identifier) return;
        let object = ObjectStore.instance.get(event.data.identifier);
        if (object !== null) {
          this.selectedTabXml = object.toXml();
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  onChangeSelectTab(identifier: string) {
    this.selectedTab = ObjectStore.instance.get<ChatTab>(identifier);
    this.selectedTabXml = '';
  }

  create() {
    let chatTab = new ChatTab();
    chatTab.name = '分頁';
    chatTab.initialize();
  }

  save() {
    if (!this.selectedTab) return;
    let fileName: string = 'chat_' + this.selectedTab.name;

    this.saveDataService.saveGameObject(this.selectedTab, fileName);
  }

  save_log() {
    if (!this.selectedTab) return;

    let msg_arr = this.selectedTab.children;
    if (msg_arr.length <= 0) return;

    function twobit(n: number) {
      return (n <= 9 ? "0" + n : n);
    }

    let date = new Date();
    let y = date.getFullYear();
    let m = twobit(date.getMonth() + 1);
    let d = twobit(date.getDate());
    let h = twobit(date.getHours());
    let min = twobit(date.getMinutes());
    let sec = twobit(date.getSeconds());
    let fileName: string = 'chatlog_' + y + m + d + "_" + h + min + sec + "_" + this.selectedTab.name + ".html";

    let html_doc = "";
    for (let i = 0; i < msg_arr.length; i++) {
      let msg = msg_arr[i];
      let color = msg["color"] ? msg["color"] : "#000000";
      let name = msg["name"].match(/^<BCDice：/) ? "<span style='padding-left:20px;'>&nbsp;</span>" : (msg["name"] + ": ");
      html_doc += "<font color='" + color + "'><b>" + name + "</b>" + msg.value + "</font><br>\n";
    }
    this.downloadHtml(fileName, html_doc);
  }

  downloadHtml(filename, html) {
    var evt = new MouseEvent('click', {
      'view': window,
      'bubbles': true,
      'cancelable': true
    });
    var aLink = document.createElement('a');
    aLink.download = filename;
    aLink.href = "data:text/html;charset=UTF-8," + encodeURIComponent(html);
    aLink.dispatchEvent(evt);
  }

  delete() {
    if (!this.isEmpty && this.selectedTab) {
      this.selectedTabXml = this.selectedTab.toXml();
      this.selectedTab.destroy();
    }
  }

  allMessageClear() {
    this.chatTabs.map(function (nowTab) {
      let chatTab = new ChatTab();
      chatTab.name = nowTab.name;

      nowTab.destroy();
      chatTab.initialize();
    });

    let chatTab: ChatTab = new ChatTab('MainTab');
    chatTab.name = '主要分頁';
    chatTab.initialize();
  }

  restore() {
    if (this.selectedTab && this.selectedTabXml) {
      let restoreTable = ObjectSerializer.instance.parseXml(this.selectedTabXml);
      this.selectedTabXml = '';
    }
  }
}
