import { Event, EventContext } from './event';
import { Callback, Observer } from './observer';

export interface Subject {
  register(key: any): Observer;
  unregister(key: any);
  unregister(key: any, eventName: string);
  unregister(key: any, callback: Callback<any>);
  unregister(key: any, eventName: string, callback: Callback<any>);
  registerListener(listener: Observer): Observer;
  unregisterListener(listener: Observer): Observer;
  call<T>(eventName: string, data: T, sendTo?: string);
  call<T>(event: Event<T>, sendTo?: string);
  trigger<T>(eventName: string, data: T): Event<T>;
  trigger<T>(event: Event<T>): Event<T>;
  trigger<T>(event: EventContext<T>): Event<T>;
}
