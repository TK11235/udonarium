import { EventSystem } from '../system';

type PeerId = string;
type ObjectIdentifier = string;

export interface SynchronizeRequest {
  identifier: string;
  version: number;
  holderIds: string[];
  ttl: number;
}

export class SynchronizeTask {
  private static key: any = {};
  private static tasksMap: Map<ObjectIdentifier, SynchronizeTask[]> = new Map();

  onsynchronize: (task: SynchronizeTask, identifier: string) => void;
  onfinish: (task: SynchronizeTask) => void;
  ontimeout: (task: SynchronizeTask, remainedRequests: SynchronizeRequest[]) => void;

  private requestMap: Map<ObjectIdentifier, SynchronizeRequest> = new Map();
  private timeoutTimer: NodeJS.Timer;

  private constructor(readonly peerId: PeerId) { }

  static create(peerId: PeerId, requests: SynchronizeRequest[]): SynchronizeTask {
    if (SynchronizeTask.tasksMap.size < 1) {
      EventSystem.register(SynchronizeTask.key)
        .on('UPDATE_GAME_OBJECT', event => {
          if (event.isSendFromSelf) return;
          SynchronizeTask.onUpdate(event.data.identifier);
        })
        .on('DELETE_GAME_OBJECT', event => {
          if (event.isSendFromSelf) return;
          SynchronizeTask.onUpdate(event.data.identifier);
        });
    }
    let task = new SynchronizeTask(peerId);
    task.initialize(requests);
    return task;
  }

  private cancel() {
    clearTimeout(this.timeoutTimer);
    this.onfinish = this.ontimeout = null;
  }

  private initialize(requests: SynchronizeRequest[]) {
    for (let request of requests) {
      request.ttl--;
      this.requestMap.set(request.identifier, request);
      let tasks: SynchronizeTask[] = SynchronizeTask.tasksMap.get(request.identifier);
      if (tasks == null) tasks = [];
      tasks.push(this);
      SynchronizeTask.tasksMap.set(request.identifier, tasks);
      let sendTo = this.peerId != null && request.holderIds.includes(this.peerId) ? this.peerId : null;
      EventSystem.call('REQUEST_GAME_OBJECT', request.identifier, sendTo);
    }

    if (this.requestMap.size < 1) {
      setTimeout(() => {
        if (this.onfinish) this.onfinish(this);
        this.cancel();
      });
      return;
    }

    this.resetTimeout();
  }

  private static onUpdate(identifier: ObjectIdentifier) {
    if (!SynchronizeTask.tasksMap.has(identifier)) return;
    let tasks = SynchronizeTask.tasksMap.get(identifier);
    for (let task of tasks.concat()) {
      task.onUpdate(identifier);
      if (task.requestMap.size < 1) tasks.splice(tasks.indexOf(task), 1);
    }
    if (tasks.length < 1) SynchronizeTask.tasksMap.delete(identifier);
    if (SynchronizeTask.tasksMap.size < 1) EventSystem.unregister(SynchronizeTask.key);
  }

  private onUpdate(identifier: ObjectIdentifier) {
    this.requestMap.delete(identifier);
    if (this.onsynchronize) this.onsynchronize(this, identifier);
    if (this.requestMap.size < 1) {
      if (this.onfinish) this.onfinish(this);
      this.cancel();
    } else {
      this.resetTimeout();
    }
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
