import { Network } from '../network/network';

export class Event<T> {
  readonly isSendFromSelf: boolean = false;

  constructor(
    readonly eventName: string,
    public data: T,
    readonly sendFrom: string = Network.instance.peerId) {
    this.isSendFromSelf = this.sendFrom === Network.instance.peerId;
  }

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
