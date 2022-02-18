import { Injectable } from '@angular/core';

import { EventSystem } from '@udonarium/core/system';

import * as yaml from 'js-yaml';

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

const objectPropertyKeys = Object.getOwnPropertyNames(Object.prototype);
const arrayPropertyKeys = Object.getOwnPropertyNames(Array.prototype);

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
  }

  private async initAppConfig() {
    try {
      console.log('YAML読み込み...');
      let config = await this.loadYaml();
      let obj = yaml.load(config);
      AppConfigService.applyConfig(obj);
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
    if (config == null) return root;
    let keys = Object.getOwnPropertyNames(config);
    for (let key of keys) {
      let invalidPropertyKeys = Array.isArray(config) || Array.isArray(root) ? objectPropertyKeys.concat(arrayPropertyKeys) : objectPropertyKeys;
      if (invalidPropertyKeys.includes(key)) {
        console.log(`skip invalid key (${key})`);
        continue;
      } else if (config[key] != null && typeof config[key] === 'object') {
        if (root[key] == null) root[key] = Array.isArray(config[key]) ? [] : {};
        AppConfigService.applyConfig(config[key], root[key]);
      } else if (typeof config[key] !== 'function' && typeof root[key] !== 'function') {
        root[key] = config[key];
      }
    }
    return root;
  }
}
