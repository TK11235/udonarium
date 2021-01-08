import { Network } from '../network/network';
import { Event, EventContext } from './event';
import { Listener } from './listener';
import { Callback } from './observer';
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
    let listenersIterator = this.listenerMap.values();
    for (let listeners of listenersIterator) {
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
    listeners.sort((a, b) => b.priority - a.priority);
    this.listenerMap.set(listener.eventName, listeners);
    return listener;
  }

  unregisterListener(listener: Listener): Listener {
    let listeners = this.getListeners(listener.eventName);
    let index = listeners.indexOf(listener);
    if (index < 0) return null;
    listeners.splice(index, 1);
    listener.unregister();
    if (listeners.length < 1) this.listenerMap.delete(listener.eventName);
    return listener;
  }

  call<T>(eventName: string, data: T, sendTo?: string): void
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
    let listeners = this.getListeners(event.eventName).concat(this.getListeners('*'));
    for (let listener of listeners) {
      listener.trigger(event);
    }
    return event;
  }

  private getListeners(eventName: string): Listener[] {
    return this.listenerMap.has(eventName) ? this.listenerMap.get(eventName) : [];
  }

  private initializeNetworkEvent() {
    let callback = Network.instance.callback;

    callback.onOpen = (peerId) => {
      this.trigger('OPEN_NETWORK', { peerId: peerId });
    }
    callback.onClose = (peerId) => {
      this.trigger('CLOSE_NETWORK', { peerId: peerId });
    }

    callback.onConnect = (peerId) => {
      this.sendSystemMessage('<' + peerId + '> connect <DataConnection>');
      this.trigger('CONNECT_PEER', { peerId: peerId });
    }

    callback.onDisconnect = (peerId) => {
      this.sendSystemMessage('<' + peerId + '> disconnect <DataConnection>');
      this.trigger('DISCONNECT_PEER', { peerId: peerId });
    }

    callback.onData = (peerId, data: EventContext<never>[]) => {
      for (let event of data) {
        this.trigger(event);
      }
    }

    callback.onError = (peerId, err) => {
      this.sendSystemMessage('<' + peerId + '> ' + err);
    }
  }

  private sendSystemMessage(message: string) {
    console.log(message);
  }
}
