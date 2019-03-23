import { Network } from '../network/network';
import { Event, EventContext } from './event';
import { Listener } from './listener';
import { Callback } from './observer';
import { Subject } from './subject';

export class EventSystem implements Subject {
  private static _instance: EventSystem
  static get instance(): EventSystem {
    if (!EventSystem._instance) {
      EventSystem._instance = new EventSystem();
      EventSystem._instance.initializeNetworkEvent();
    }
    return EventSystem._instance;
  }

  private listenersHash: { [eventName: string]: Listener[] } = {};
  private constructor() {
    console.log('EventSystem ready...');
  }

  register(key: any): Listener {
    let listener: Listener = new Listener(this, key);
    return listener;
  }

  unregister(key: any)
  unregister(key: any, eventName: string)
  unregister(key: any, callback: Callback<any>)
  unregister(key: any, eventName: string, callback: Callback<any>)
  unregister(...args: any[]) {
    if (args.length === 1) {
      return this._unregister(args[0], null, null);
    } else if (args.length === 2) {
      if (typeof args[1] === 'string') {
        return this._unregister(args[0], args[1], null);
      } else {
        return this._unregister(args[0], null, args[1]);
      }
    } else {
      return this._unregister(args[0], args[1], args[2]);
    }
  }

  private _unregister(key: any = this, eventName: string, callback: Callback<any>) {
    for (let eventName in this.listenersHash) {
      let listeners = this.getListeners(eventName);
      for (let listener of listeners.concat()) {
        if (listener.isEqual(key, eventName, callback)) {
          listener.unregister();
        }
      }
    }
  }

  registerListener(listener: Listener): Listener {
    let listeners: Listener[] = this.getListeners(listener.eventName);

    listeners.push(listener);
    listeners.sort(function (a, b) {
      if (a.priority > b.priority) return -1;
      if (a.priority < b.priority) return 1;
      return 0;
    });
    return listener;
  }

  unregisterListener(listener: Listener): Listener {
    let listeners = this.getListeners(listener.eventName);
    let index = listeners.indexOf(listener);
    if (-1 < index) {
      listeners.splice(index, 1);
      listener.unregister();
      return listener;
    }
    return null;
  }

  call<T>(eventName: string, data: T, sendTo?: string)
  call<T>(event: Event<T>, sendTo?: string)
  call<T>(...args: any[]) {
    if (typeof args[0] === 'string') {
      this._call(new Event(args[0], args[1]), args[2]);
    } else {
      this._call(args[0], args[1]);
    }
  }

  private _call(event: Event<any>, sendTo?: string) {
    let context = event.toContext();
    Network.instance.send(context, sendTo);
  }

  trigger<T>(eventName: string, data: T): Event<T>
  trigger<T>(event: Event<T>): Event<T>
  trigger<T>(event: EventContext<T>): Event<T>
  trigger<T>(...args: any[]): Event<T> {
    if (args.length === 2) {
      this._trigger(new Event(args[0], args[1]));
    } else if (args[0] instanceof Event) {
      return this._trigger(args[0]);
    } else {
      return this._trigger(new Event(args[0].eventName, args[0].data, args[0].sendFrom));
    }
  }

  private _trigger<T>(event: Event<T>): Event<T> {
    for (let listener of this.getListeners(event.eventName).concat()) {
      listener.trigger(event);
    }
    for (let listener of this.getListeners('*').concat()) {
      listener.trigger(event);
    }
    return event;
  }

  private getListeners(eventName: string): Listener[] {
    if (!(eventName in this.listenersHash)) {
      this.listenersHash[eventName] = [];
    }
    return this.listenersHash[eventName];
  }

  private initializeNetworkEvent() {
    let callback = Network.instance.callback;

    callback.willOpen = (peerId, sendFrom) => {
      if (sendFrom !== Network.instance.peerId) {
        this.sendSystemMessage('Receive <' + peerId + '> connecting...');
      } else {
        this.sendSystemMessage('Request <' + peerId + '> connecting...');
      }
    }

    callback.onTimeout = (peerId) => {
      this.sendSystemMessage('timeout peer connection... <' + peerId + '>');
    }

    callback.onOpen = (peerId) => {
      this.sendSystemMessage('<' + peerId + '> is Open <DataConnection>');
      if (peerId === Network.instance.peerId) {
        this.trigger('OPEN_PEER', { peer: peerId });
      } else {
        this.trigger('OPEN_OTHER_PEER', { peer: peerId });
        this.call('OTHER_PEERS', { otherPeers: Network.instance.peerIds });
      }
    }

    callback.onData = (peerId, data: EventContext<never>[]) => {
      for (let event of data) {
        this.trigger(event);
      }
    }

    callback.onClose = (peerId) => {
      this.sendSystemMessage('<' + peerId + '> is closed <DataConnection>');
      if (peerId === Network.instance.peerId) {
        this.trigger('LOST_CONNECTION_PEER', { peer: peerId });
      } else {
        this.trigger('CLOSE_OTHER_PEER', { peer: peerId });
      }
    }

    callback.onError = (peerId, err) => {
      this.sendSystemMessage('<' + peerId + '> ' + err);
    }

    callback.onDetectUnknownPeers = (peerIds) => {
      console.warn('未接続のPeerを確認?', peerIds);
      this.trigger('OTHER_PEERS', { otherPeers: peerIds });
    }
  }

  private sendSystemMessage(message: string) {
    console.log(message);
  }
}
