import { ResettableTimeout } from '../util/resettable-timeout';
import { SkyWayDataConnection } from './skyway-data-connection';

export class SkyWayStatsMonitor {
  private static updateWebRTCStatsTimer: ResettableTimeout = null;
  private static monitoringConnections: Set<SkyWayDataConnection> = new Set();

  private constructor() { }

  static add(connection: SkyWayDataConnection) {
    this.monitoringConnections.add(connection);
    connection.updateStatsAsync();
    this.restart();
  }

  static remove(connection: SkyWayDataConnection) {
    this.monitoringConnections.delete(connection);
  }

  private static restart() {
    if (this.updateWebRTCStatsTimer == null) {
      this.updateWebRTCStatsTimer = new ResettableTimeout(() => this.doMonitoringAsync(), this.calcIntervalTime());
    } else if (!this.updateWebRTCStatsTimer.isActive) {
      this.updateWebRTCStatsTimer.reset(this.calcIntervalTime());
    }
  }

  private static calcIntervalTime(): number {
    let ms = 2000 + 1000 * this.monitoringConnections.size;
    return Math.min(ms, 10000);
  }

  private static async doMonitoringAsync() {
    for (let connection of this.monitoringConnections) {
      if (connection.open) {
        await connection.updateStatsAsync();
      } else {
        this.remove(connection);
      }
    }
    if (this.monitoringConnections.size < 1) {
      this.updateWebRTCStatsTimer = null;
      return;
    }
    this.restart();
  }
}
