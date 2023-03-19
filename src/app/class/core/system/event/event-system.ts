import { Network } from '../network/network';
import { Event, EventContext } from './event';
import { Listener } from './listener';
import { Callback, EventMap } from './observer';
import { Subject } from './subject';

type EventName = string;

export class EventSystem implements Subject {
  private static _instance: EventSystem
  static get instance(): EventSystem {
    if (!EventSystem._instance) {
      EventSystem._instance = new EventSystem();
      EventSystem._instance.initializeNetworkEvent();
    }
    return EventSystem._instance;
  }

  private listenerMap: Map<EventName, Listener[]> = new Map();
  private keyMap: Map<any, Listener[]> = new Map();

  private constructor() {
    console.log('EventSystem ready...');
  }

  register(key: any): Listener {
    let listener: Listener = new Listener(this, key);
    return listener;
  }

  unregister(key: any): void
  unregister(key: any, eventName: string): void
  unregister(key: any, callback: Callback<any>): void
  unregister(key: any, eventName: string, callback: Callback<any>): void
  unregister(...args: any[]): void {
    if (args.length === 1) {
      this._unregister(args[0], null, null);
    } else if (args.length === 2) {
      if (typeof args[1] === 'string') {
        this._unregister(args[0], args[1], null);
      } else {
        this._unregister(args[0], null, args[1]);
      }
    } else {
      this._unregister(args[0], args[1], args[2]);
    }
  }

  private _unregister(key: any = this, eventName: string, callback: Callback<any>) {
    let listeners: Listener[] = [];
    if (key != null) {
      listeners = this.getListenersByKey(key);
    } else if (eventName != null) {
      listeners = this.getListenersByEventName(eventName);
    } else {
      let listenersIterator = this.listenerMap.values();
      for (let array of listenersIterator) {
        listeners = listeners.concat(array);
      }
    }
    for (let listener of listeners.concat()) {
      if (listener.isEqual(key, eventName, callback)) {
        listener.unregister();
      }
    }
  }

  registerListener(listener: Listener): Listener {
    let listeners = this.getListenersByEventName(listener.eventName);

    listeners.push(listener);
    listeners.sort((a, b) => b.priority - a.priority);
    this.listenerMap.set(listener.eventName, listeners);

    listeners = this.getListenersByKey(listener.key);
    listeners.push(listener);
    this.keyMap.set(listener.key, listeners);

    return listener;
  }

  unregisterListener(listener: Listener): Listener {
    let listeners = this.getListenersByEventName(listener.eventName);
    let index = listeners.indexOf(listener);
    if (index < 0) return null;
    listeners.splice(index, 1);
    if (listeners.length < 1) this.listenerMap.delete(listener.eventName);

    listeners = this.getListenersByKey(listener.key);
    index = listeners.indexOf(listener);
    if (0 <= index) listeners.splice(index, 1);
    if (listeners.length < 1) this.keyMap.delete(listener.key);

    listener.unregister();
    return listener;
  }

  call<K extends keyof EventMap>(eventName: K, data: EventMap[K], sendTo?: string): void
  call<T, S extends string>(eventName: Exclude<S, keyof EventMap>, data: T, sendTo?: string): void
  call<T>(event: Event<T>, sendTo?: string): void
  call<T>(...args: any[]): void {
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

  trigger<K extends keyof EventMap>(eventName: K, data: EventMap[K]): Event<EventMap[K]>
  trigger<T, S extends string>(eventName: Exclude<S, keyof EventMap>, data: T): Event<T>
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
    let listeners = this.getListenersByEventName(event.eventName).concat(this.getListenersByEventName('*'));
    for (let listener of listeners) {
      listener.trigger(event);
    }
    return event;
  }

  private getListenersByEventName(eventName: string): Listener[] {
    return this.listenerMap.has(eventName) ? this.listenerMap.get(eventName) : [];
  }

  private getListenersByKey(key: any): Listener[] {
    return this.keyMap.has(key) ? this.keyMap.get(key) : [];
  }

  private initializeNetworkEvent() {
    let callback = Network.instance.callback;

    callback.onOpen = (peer) => {
      this.trigger('OPEN_NETWORK', { peerId: peer.peerId });
    }
    callback.onClose = (peer) => {
      this.trigger('CLOSE_NETWORK', { peerId: peer.peerId });
    }

    callback.onConnect = (peer) => {
      this.sendSystemMessage('<' + peer.userId + '> connect <DataConnection>');
      this.trigger('CONNECT_PEER', { peerId: peer.peerId });
    }

    callback.onDisconnect = (peer) => {
      this.sendSystemMessage('<' + peer.userId + '> disconnect <DataConnection>');
      this.trigger('DISCONNECT_PEER', { peerId: peer.peerId });
    }

    callback.onData = (peer, data: EventContext<never>[]) => {
      for (let event of data) {
        this.trigger(event);
      }
    }

    callback.onError = (peer, errorType, errorMessage, errorObject) => {
      this.sendSystemMessage('<' + peer.userId + '> ' + errorMessage);
      this.trigger('NETWORK_ERROR', { peerId: peer.peerId, errorType: errorType, errorMessage: errorMessage, errorObject: errorObject });
    }
  }

  private sendSystemMessage(message: string) {
    console.log(message);
  }
}
