import { Network } from '../network/network';

export class Event<T> implements EventContext<T>{
  readonly isSendFromSelf: boolean = false;

  constructor(
    readonly eventName: string,
    public data: T,
    readonly sendFrom: string = Network.instance.peerId) {
    this.isSendFromSelf = this.sendFrom === Network.instance.peerId;
  }

  toContext(): EventContext<T> {
    return {
      sendFrom: this.sendFrom,
      eventName: this.eventName,
      data: this.data,
    };
  }
}

export interface EventContext<T> {
  sendFrom: string;
  eventName: string;
  data: T;
}
