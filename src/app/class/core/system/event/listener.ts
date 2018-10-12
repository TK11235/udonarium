import { Event } from './event';
import { Callback, EventMap, Observer } from './observer';
import { Subject } from './subject';

export class Listener implements Observer {
  private _subject: Subject;
  private _key: any;
  private _eventName: string;
  private _priority: number = 0;
  private _callback: Callback<any>;
  private _isOnlyOnce: boolean;
  private _isRegistered: boolean = false;

  get subject() { return this._subject; }
  get key() { return this._key; }
  get eventName() { return this._eventName; }
  get priority() { return this._priority; }
  get callback() { return this._callback; }
  get isOnlyOnce() { return this._isOnlyOnce; }
  get isRegistered() { return this._isRegistered; }

  constructor(subject: Subject, key: any) {
    this._subject = subject;
    this._key = key;
  }

  on<K extends keyof EventMap>(eventName: K, callback: Callback<EventMap[K]>): Listener
  on<K extends keyof EventMap>(eventName: K, priority: number, callback: Callback<EventMap[K]>): Listener
  on(eventName: string, callback: Callback<any>): Listener
  on(eventName: string, priority: number, callback: Callback<any>): Listener
  on<T>(eventName: string, callback: Callback<T>): Listener
  on<T>(eventName: string, priority: number, callback: Callback<T>): Listener
  on(...args: any[]): Listener {
    this._isOnlyOnce = false;
    if (args.length === 2) {
      return this.register(args[0], 0, args[1]);
    } else {
      return this.register(args[0], args[1], args[2]);
    }
  }

  once<K extends keyof EventMap>(eventName: K, callback: Callback<EventMap[K]>): Listener
  once<K extends keyof EventMap>(eventName: K, priority: number, callback: Callback<EventMap[K]>): Listener
  once(eventName: string, callback: Callback<any>): Listener
  once(eventName: string, priority: number, callback: Callback<any>): Listener
  once<T>(eventName: string, callback: Callback<T>): Listener
  once<T>(eventName: string, priority: number, callback: Callback<T>): Listener
  once(...args: any[]): Listener {
    let listener = this.on.apply(this, args);
    this._isOnlyOnce = true;
    return listener;
  }

  private register(eventName: string, priority: number, callback: Callback<any>): Listener {
    if (this.isRegistered) this.unregister();
    this._eventName = eventName ? eventName : '*';
    this._priority = priority;
    this._callback = callback;

    this.subject.registerListener(this);
    this._isRegistered = true;
    return new Listener(this.subject, this.key);
  }

  unregister(): this {
    this.subject.unregisterListener(this);
    this._callback = null;
    this._isRegistered = false;
    return this;
  }

  trigger(event: Event<any>) {
    if (this.callback && this.isRegistered) {
      this.callback.apply(this.key, [event, this]);
      if (this.isOnlyOnce) this.unregister();
    }
  }

  isEqual(key: any, eventName: string, callback: Callback<any>) {
    let matchTarget = (key == null || key === this.key);
    let matchEventName = (eventName == null || eventName === this.eventName);
    let matchCallback = (callback == null || callback === this.callback);

    return matchTarget && matchEventName && matchCallback;
  }
}
