import { EventSystem, Network } from '../system/system';

export interface SynchronizeRequest {
  identifier: string;
  version: number;
  holderIds: string[];
  ttl: number;
}

export class SynchronizeTask {
  onsynchronize: (task: SynchronizeTask, identifier: string) => void;
  onfinish: (task: SynchronizeTask) => void;
  ontimeout: (task: SynchronizeTask, remainedRequests: SynchronizeRequest[]) => void;

  private requestMap: Map<string, SynchronizeRequest> = new Map();
  private timeoutTimer: NodeJS.Timer;

  private constructor() { }

  static create(requests: SynchronizeRequest[]): SynchronizeTask {
    let task = new SynchronizeTask();
    task.initialize(requests);
    return task;
  }

  private cancel() {
    EventSystem.unregister(this);
    clearTimeout(this.timeoutTimer);
    this.onfinish = this.ontimeout = null;
  }

  private initialize(requests: SynchronizeRequest[]) {
    for (let request of requests) {
      request.ttl--;
      this.requestMap.set(request.identifier, request);
      EventSystem.call('REQUEST_GAME_OBJECT', request.identifier, this.randomChoice(request.holderIds));
    }

    if (this.requestMap.size < 1) {
      setTimeout(() => {
        if (this.onfinish) this.onfinish(this);
        this.cancel();
      });
      return;
    }

    this.resetTimeout();
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', event => {
        if (!event.isSendFromSelf && this.requestMap.has(event.data.identifier)) this.onUpdate(event.data.identifier);
      })
      .on('DELETE_GAME_OBJECT', event => {
        if (!event.isSendFromSelf && this.requestMap.has(event.data.identifier)) this.onUpdate(event.data.identifier);
      });
  }

  private onUpdate(identifier: string) {
    this.requestMap.delete(identifier);
    if (this.onsynchronize) this.onsynchronize(this, identifier);
    this.resetTimeout();
    if (this.requestMap.size < 1) {
      if (this.onfinish) this.onfinish(this);
      this.cancel();
    }
  }

  private randomChoice(peers: string[]): string {
    let peerContexts = Network.peerContexts.filter(peerContext => peerContext.isOpen && -1 < peers.indexOf(peerContext.fullstring));
    if (peerContexts.length < 1) return null;
    let min = 0;
    let max = peerContexts.length;
    let index = Math.floor(Math.random() * (max - min)) + min;
    let peerId = peerContexts[index].fullstring;
    return peerId;
  }

  private resetTimeout() {
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      if (this.ontimeout) this.ontimeout(this, Array.from(this.requestMap.values()).filter(request => 0 <= request.ttl));
      if (this.onfinish) this.onfinish(this);
      this.cancel();
    }, 30 * 1000);
  }
}
