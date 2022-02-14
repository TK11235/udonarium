import { Injectable, NgZone } from '@angular/core';
import { setZeroTimeout } from '@udonarium/core/system/util/zero-timeout';

type BatchTask = () => void;

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private batchTask: Map<any, BatchTask> = new Map();
  private batchTaskTimer: NodeJS.Timer = null;

  constructor(
    private ngZone: NgZone,
  ) { }

  add(task: BatchTask, key: any = {}) {
    this.batchTask.set(key, task);
    if (this.batchTaskTimer != null) return;
    setZeroTimeout(() => this.execBatch());
    this.ngZone.runOutsideAngular(() => this.startTimer());
  }

  private startTimer() {
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
