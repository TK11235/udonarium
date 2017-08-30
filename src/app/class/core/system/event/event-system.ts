import { Listener, Callback } from './listener';
import { Event, EventContext } from './event';
import { Network } from '../network/network';

export class EventSystem {
  private static _instance: EventSystem
  static get instance(): EventSystem {
    if (!EventSystem._instance) EventSystem._instance = new EventSystem();
    return EventSystem._instance;
  }

  private listenersHash: { [eventName: string]: Listener[] } = {};
  private constructor() { console.log('EventSystem ready...'); }

  register(target: any = this): Listener {
    let listener: Listener = new Listener(target);
    return listener;
  }

  unregister(target: any)
  unregister(target: any, eventName: string)
  unregister(target: any, callback: Callback<any>)
  unregister(target: any, eventName: string, callback: Callback<any>)
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

  private _unregister(target: any = this, eventName: string, callback: Callback<any>) {
    for (let eventName in this.listenersHash) {
      let listeners = this.getListeners(eventName);
      for (let listener of listeners.concat()) {
        if (listener.isEqual(target, eventName, callback)) {
          //this.unregisterListener(listener);
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

  call(eventName: string, data: any, sendTo?: string)
  call(event: Event<any>, sendTo?: string)
  call(...args: any[]) {
    if (typeof args[0] === 'string') {
      this._call(new Event(args[0], args[1]), args[2]);
    } else {
      this._call(args[0], args[1]);
    }
  }

  private _call(event: Event<any>, sendTo?: string) {
    if (event.sendFrom == null) event.sendFrom = Network.instance.peerId;
    let context = event.toContext();
    context.sendTo = sendTo;
    Network.instance.send(context);
  }

  trigger(eventName: string, data: any): Event<any>
  trigger(event: Event<any>): Event<any>
  trigger(event: EventContext): Event<any>
  trigger(...args: any[]): Event<any> {
    if (args.length === 2) {
      this._trigger(new Event(args[0], args[1], Network.instance.peerId));
    } else if (args[0] instanceof Event) {
      return this._trigger(args[0]);
    } else {
      return this._trigger(new Event(args[0].eventName, args[0].data, args[0].sendFrom));
    }
  }

  private _trigger(event: Event<any>): Event<any> {
    if (event.sendFrom == null) event.sendFrom = Network.instance.peerId;
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
}
setTimeout(function () { EventSystem.instance; }, 0);
