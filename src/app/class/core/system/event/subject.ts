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
  call(eventName: string, data: any, sendTo?: string);
  call(event: Event<any>, sendTo?: string);
  trigger(eventName: string, data: any): Event<any>;
  trigger(event: Event<any>): Event<any>;
  trigger(event: EventContext): Event<any>;
}