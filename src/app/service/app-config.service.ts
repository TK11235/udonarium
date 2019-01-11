import { Injectable } from '@angular/core';

import { EventSystem, Network } from '@udonarium/core/system';
import { Database } from '@udonarium/database/database';

import * as yaml from 'js-yaml/dist/js-yaml.min.js';

export interface AppConfig {
  webrtc: {
    key: string,
    config?: {
      iceServers?: RTCIceServer[],
      certificates?: string
    }
  },
  app: {
    title: string,
    mode: string
  }
}

@Injectable()
export class AppConfigService {

  constructor() { }

  peerHistory: string[] = [];
  isOpen: boolean = false;

  static appConfig: AppConfig = {
    webrtc: {
      key: ''
    },
    app: {
      title: '',
      mode: ''
    }
  }

  initialize() {
    this.initAppConfig();
    this.initDatabase();
  }

  private async initDatabase() {
    console.log('initDatabase...');
    if (!window.indexedDB) {
      console.warn('このブラウザは安定板の IndexedDB をサポートしていません。IndexedDB の機能は利用できません。');
      return;
    }

    let db = new Database();

    let history = await db.getPeerHistory();
    history.sort((a, b) => {
      if (a.timestamp < b.timestamp) return 1;
      if (a.timestamp > b.timestamp) return -1;
      return 0;
    });

    for (let i = 1; i < history.length; i++) {
      db.deletePeerHistory(history[i].peerId);
    }

    console.log('履歴: ', history);

    this.peerHistory = [];
    if (history.length) {
      for (let historyId of history[0].history) {
        if (historyId !== history[0].peerId) {
          this.peerHistory.push(historyId);
        }
      }
    }
    console.log('最終履歴: ', this.peerHistory);

    EventSystem.register(this)
      .on('OPEN_OTHER_PEER', -1000, () => {
        console.log('AppConfigService OPEN_OTHER_PEER', Network.peerIds);
        if (!this.isOpen) {
          this.isOpen = true;
        }
        db.addPeerHistory(Network.peerId, Network.peerIds);
      })
      .on('CLOSE_OTHER_PEER', -1000, () => {
        console.log('AppConfigService CLOSE_OTHER_PEER', Network.peerIds);
      });
  }

  private async initAppConfig() {
    try {
      console.log('YAML読み込み...');
      let config = await this.loadYaml();
      let obj = yaml.safeLoad(config);
      AppConfigService.applyConfig(obj);
      console.log(AppConfigService.appConfig);
    } catch (e) {
      console.warn(e);
    }
    EventSystem.trigger('LOAD_CONFIG', AppConfigService.appConfig);
  }

  private loadYaml(): Promise<string> {
    return new Promise((resolve, reject) => {
      let config = document.querySelector('script[type$="yaml"]');
      if (!config) {
        console.warn('loadYaml element not found.');
        resolve('');
        return;
      }

      console.log('loadYaml ready...', config);
      let configString = config.textContent;
      let url = config.getAttribute('src');

      if (url == null) {
        console.warn('loadYaml url undefined.');
        resolve(configString);
        return;
      }

      let http = new XMLHttpRequest();
      http.open('get', url, true);
      http.onerror = (event) => {
        console.error(event);
        resolve(configString);
      };
      http.onreadystatechange = (event) => {
        if (http.readyState !== 4) {
          return;
        }
        if (http.status === 200) {
          console.log('loadYaml success!');
          configString = http.responseText;
        } else {
          console.warn('loadYaml fail...? status:' + http.status);
        }
        resolve(configString);
      };
      console.log('loadYaml start');
      http.send(null);
    });
  }

  private static applyConfig(config: Object, root: Object = AppConfigService.appConfig): Object {
    for (let key in config) {
      if (isArray(config[key])) {
        root[key] = config[key];
      } else if (typeof config[key] === 'object') {
        if (!(key in root)) root[key] = {};
        AppConfigService.applyConfig(config[key], root[key]);
      } else {
        root[key] = config[key];
      }
    }
    return root;
  }
}

function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}
