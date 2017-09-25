import { Injectable } from '@angular/core';
import { Network, EventSystem } from '../class/core/system/system';
import { Database } from '../class/database/database';

import * as yaml from 'js-yaml/dist/js-yaml.min.js';
//import * as yaml from 'js-yaml';

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
    //this.initIndexDB();
    this.initAppConfig();
    //this.initLocalStorage();
    this.initDatabase();
  }

  private async initDatabase() {
    console.log('initDatabase...');
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

  private initLocalStorage() {
    let oldIds: string[] = [];
    let historyIds: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      let peer: string = localStorage.key(i);
      if(peer.match(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{8}/g)) {
        oldIds.push(peer);
        Array.prototype.push.apply(historyIds, JSON.parse(localStorage.getItem(peer)));
      }
    }
    for (let historyId of historyIds) {
      let isMine: boolean = false;
      for (let oldId of oldIds) {
        if (historyId === oldId) {
          isMine = true;
          break;
        }
      }
      if (!isMine) this.peerHistory.push(historyId);
    }

    for (let i = 0; i < localStorage.length; i++) {
      console.log('履歴: ' + localStorage.key(i), localStorage.getItem(localStorage.key(i)));
    }
    console.log('最終履歴: ', this.peerHistory);
    EventSystem.register(this)
      .on('OPEN_OTHER_PEER', -1000, () => {
        console.log('AppConfigService OPEN_OTHER_PEER', Network.peerIds);
        if (!this.isOpen) {
          localStorage.clear();
          this.isOpen = true;
        }
        localStorage.setItem(Network.peerId, JSON.stringify(Network.peerIds));
      })
      .on('CLOSE_OTHER_PEER', -1000, () => {
        console.log('AppConfigService CLOSE_OTHER_PEER', Network.peerIds);
      });
  }

  private initIndexDB() {
    let request = window.indexedDB.open('AppConfigDataBase', 1);
    request.onerror = function (event) {
      // request.errorCode に対して行うこと!
    };
    request.onsuccess = function (event) {
      // request.result に対して行うこと!
    };
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
