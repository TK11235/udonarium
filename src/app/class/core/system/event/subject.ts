import { Listener, Callback } from './listener';
import { Event, EventContext } from './event';

export interface Subject {
  register(target: any): Listener;
  unregister(target: any);
  unregister(target: any, eventName: string);
  unregister(target: any, callback: Callback<any>);
  unregister(target: any, eventName: string, callback: Callback<any>);
  registerListener(listener: Listener): Listener;
  unregisterListener(listener: Listener): Listener;
  call(eventName: string, data: any, sendTo?: string);
  call(event: Event<any>, sendTo?: string);
  trigger(eventName: string, data: any): Event<any>;
  trigger(event: Event<any>): Event<any>;
  trigger(event: EventContext): Event<any>;
}