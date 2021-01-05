import { Injectable } from '@angular/core';

type BatchTask = () => void;

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private batchTask: Map<any, BatchTask> = new Map();
  private batchTaskTimer: NodeJS.Timer = null;

  constructor() { }

  add(task: BatchTask, key: any = {}) {
    this.batchTask.set(key, task);
    if (this.batchTaskTimer != null) return;
    this.execBatch();
    this.batchTaskTimer = setInterval(() => {
      if (0 < this.batchTask.size) {
        this.execBatch();
      } else {
        clearInterval(this.batchTaskTimer);
        this.batchTaskTimer = null;
      }
    }, 66);
  }

  remove(key: any = {}) {
    this.batchTask.delete(key);
  }

  private execBatch() {
    this.batchTask.forEach(task => task());
    this.batchTask.clear();
  }
}
