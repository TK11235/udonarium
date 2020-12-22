import { EventSystem } from '../system';
import { ResettableTimeout } from '../system/util/resettable-timeout';

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
  private timeoutTimer: ResettableTimeout;

  private constructor(readonly peerId: PeerId) { }

  static create(peerId: PeerId, requests: SynchronizeRequest[]): SynchronizeTask {
    if (SynchronizeTask.tasksMap.size < 1) {
      EventSystem.register(SynchronizeTask.key)
        .on('DISCONNECT_PEER', event => {
          SynchronizeTask.onDisconnect(event.data.peerId);
        })
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
    if (this.timeoutTimer) this.timeoutTimer.clear();
    this.timeoutTimer = null;
    this.onsynchronize = this.onfinish = this.ontimeout = null;

    for (let request of this.requestMap.values()) {
      this.deleteTasksMap(request.identifier);
    };

    this.requestMap.clear();
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
      setTimeout(() => this.finish());
      return;
    }

    this.resetTimeout();
  }

  private finish() {
    if (this.onfinish) this.onfinish(this);
    this.cancel();
  }

  private timeout() {
    if (this.ontimeout) this.ontimeout(this, Array.from(this.requestMap.values()).filter(request => 0 <= request.ttl));
    this.finish();
  }

  private static onDisconnect(peerId: PeerId) {
    for (let tasks of SynchronizeTask.tasksMap.values()) {
      for (let task of tasks.concat()) {
        if (task.peerId === peerId) task.timeout();
      }
    }
    if (SynchronizeTask.tasksMap.size < 1) EventSystem.unregister(SynchronizeTask.key);
  }

  private static onUpdate(identifier: ObjectIdentifier) {
    if (!SynchronizeTask.tasksMap.has(identifier)) return;
    let tasks = SynchronizeTask.tasksMap.get(identifier);
    for (let task of tasks.concat()) {
      task.onUpdate(identifier);
    }
    if (SynchronizeTask.tasksMap.size < 1) EventSystem.unregister(SynchronizeTask.key);
  }

  private onUpdate(identifier: ObjectIdentifier) {
    this.requestMap.delete(identifier);
    if (this.onsynchronize) this.onsynchronize(this, identifier);
    if (this.requestMap.size < 1) {
      this.finish();
    } else {
      this.resetTimeout();
    }
  }

  private deleteTasksMap(identifier: ObjectIdentifier) {
    let tasks = SynchronizeTask.tasksMap.get(identifier);
    let index = tasks.indexOf(this);
    if (-1 < index) tasks.splice(index, 1);
    if (tasks.length < 1) SynchronizeTask.tasksMap.delete(identifier);
  }

  private resetTimeout() {
    if (this.timeoutTimer == null) this.timeoutTimer = new ResettableTimeout(() => this.timeout(), 30 * 1000);
    this.timeoutTimer.reset();
  }
}
