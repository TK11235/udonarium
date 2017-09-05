import { Observer, Callback } from './observer';
import { Event, EventContext } from './event';

export interface Subject {
  register(target: any): Observer;
  unregister(target: any);
  unregister(target: any, eventName: string);
  unregister(target: any, callback: Callback<any>);
  unregister(target: any, eventName: string, callback: Callback<any>);
  registerListener(listener: Observer): Observer;
  unregisterListener(listener: Observer): Observer;
  call(eventName: string, data: any, sendTo?: string);
  call(event: Event<any>, sendTo?: string);
  trigger(eventName: string, data: any): Event<any>;
  trigger(event: Event<any>): Event<any>;
  trigger(event: EventContext): Event<any>;
}