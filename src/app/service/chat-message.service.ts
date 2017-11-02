import { Injectable } from '@angular/core';
import { Http } from "@angular/http"

import { Network, EventSystem } from '../class/core/system/system';
import { ObjectStore } from '../class/core/synchronize-object/object-store';
import { ChatTabList } from '../class/chat-tab-list';
import { ChatTab } from '../class/chat-tab';
import { ChatMessage, ChatMessageContext } from '../class/chat-message';

@Injectable()
export class ChatMessageService {

  private timeOffset: number = Date.now();
  private performanceOffset: number = performance.now();

  gameType: string = '';

  constructor(private http: Http) {
    this.calibrateTimeOffset();
  }

  get chatTabs(): ChatTab[] {
    return ObjectStore.instance.getObjects(ChatTab);
  }

  private calibrateTimeOffset() {
    let sendTime = performance.now();
    let httpGet = this.http.get('https://ntp-a1.nict.go.jp/cgi-bin/json');
    httpGet.subscribe(
      res => {
        let endTime = performance.now();
        let latency = (endTime - sendTime) / 2;
        let timeobj = res.json();
        let st: number = timeobj.st * 1000;
        let fixedTime = st + latency;
        this.timeOffset = fixedTime;
        this.performanceOffset = endTime;
        console.log('latency: ' + latency + 'ms');
        console.log('st: ' + st + '');
        console.log('timeOffset: ' + this.timeOffset);
        console.log('performanceOffset: ' + this.performanceOffset);
        setTimeout(() => { this.calibrateTimeOffset }, 6 * 60 * 60 * 1000);
      },
      error => {
        console.error(error.status + ":" + error.statusText);
      }
    );
  }

  getTime(): number {
    return Math.floor(this.timeOffset + (performance.now() - this.performanceOffset));
  }
}
