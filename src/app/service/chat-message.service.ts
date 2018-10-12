import { Injectable } from '@angular/core';

import { ChatTab } from '@udonarium/chat-tab';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';

@Injectable()
export class ChatMessageService {

  private timeOffset: number = Date.now();
  private performanceOffset: number = performance.now();

  gameType: string = '';

  constructor() {
    this.calibrateTimeOffset();
  }

  get chatTabs(): ChatTab[] {
    return ObjectStore.instance.getObjects(ChatTab);
  }

  private calibrateTimeOffset() {
    let sendTime = performance.now();
    fetch('https://ntp-a1.nict.go.jp/cgi-bin/json')
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Network response was not ok.');
      })
      .then(jsonObj => {
        let endTime = performance.now();
        let latency = (endTime - sendTime) / 2;
        let timeobj = jsonObj;
        let st: number = timeobj.st * 1000;
        let fixedTime = st + latency;
        this.timeOffset = fixedTime;
        this.performanceOffset = endTime;
        console.log('latency: ' + latency + 'ms');
        console.log('st: ' + st + '');
        console.log('timeOffset: ' + this.timeOffset);
        console.log('performanceOffset: ' + this.performanceOffset);
        setTimeout(() => { this.calibrateTimeOffset(); }, 6 * 60 * 60 * 1000);
      })
      .catch(error => {
        console.warn('There has been a problem with your fetch operation: ', error.message);
        setTimeout(() => { this.calibrateTimeOffset(); }, 6 * 60 * 60 * 1000);
      });
  }

  getTime(): number {
    return Math.floor(this.timeOffset + (performance.now() - this.performanceOffset));
  }
}
