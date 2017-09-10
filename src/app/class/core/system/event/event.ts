import { Network } from '../network/network';

export class Event<T> {
  isCancelled: boolean = false;

  constructor(
    public eventName: string,
    public data: T,
    public sendFrom?: string) { }

  get isSendFromSelf(): boolean { return this.sendFrom === Network.instance.peerId; }

  toContext(): EventContext {
    return {
      sendFrom: this.sendFrom,
      sendTo: null,
      eventName: this.eventName,
      data: this.data,
    };
  }
}

export interface EventContext {
  sendFrom: string;
  sendTo: string;
  eventName: string;
  data: any;
}
