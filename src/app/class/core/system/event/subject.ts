import { Event, EventContext } from './event';
import { Callback, EventMap, Observer } from './observer';

export interface Subject {
  register(key: any): Observer;
  unregister(key: any): void;
  unregister(key: any, eventName: string): void;
  unregister(key: any, callback: Callback<any>): void;
  unregister(key: any, eventName: string, callback: Callback<any>): void;
  registerListener(listener: Observer): Observer;
  unregisterListener(listener: Observer): Observer;
  call<K extends keyof EventMap>(eventName: K, data: EventMap[K], sendTo?: string): void;
  call<T, S extends string>(eventName: Exclude<S, keyof EventMap>, data: T, sendTo?: string): void;
  call<T>(event: Event<T>, sendTo?: string): void;
  trigger<K extends keyof EventMap>(eventName: K, data: EventMap[K]): Event<EventMap[K]>;
  trigger<T, S extends string>(eventName: Exclude<S, keyof EventMap>, data: T): Event<T>;
  trigger<T>(event: Event<T>): Event<T>;
  trigger<T>(event: EventContext<T>): Event<T>;
}
