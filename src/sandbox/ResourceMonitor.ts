/**
 * Resource Monitor
 * Monitors CPU/memory usage and task statistics
 */

import * as os from 'os';

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAvg: number[];
  };
  memory: {
    total: string;
    used: string;
    free: string;
    usagePercent: number;
  };
  process: {
    memory: string;
    cpu: number;
    uptime: number;
  };
  timestamp: Date;
}

export interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  queuedTasks: number;
}

export interface ResourceLimit {
  maxMemory: number; // percentage
  maxCpu: number; // percentage
}

export class ResourceMonitor {
  private taskStats: TaskStats = {
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    queuedTasks: 0,
  };

  private limits: ResourceLimit = {
    maxMemory: 80, // 80%
    maxCpu: 90, // 90%
  };

  private history: SystemMetrics[] = [];
  private maxHistorySize: number = 60; // Keep last 60 samples (1 minute at 1s interval)

  constructor() {
    // Initialize with some values
    this.taskStats = {
      totalTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      queuedTasks: 0,
    };
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;

    // Get CPU usage
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    const cpuUsage = 100 - (100 * totalIdle / totalTick);

    const metrics: SystemMetrics = {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAvg: os.loadavg(),
      },
      memory: {
        total: this.formatBytes(totalMem),
        used: this.formatBytes(usedMem),
        free: this.formatBytes(freeMem),
        usagePercent: memUsagePercent,
      },
      process: {
        memory: 'N/A', // Would need process module in real implementation
        cpu: 0,
        uptime: process.uptime(),
      },
      timestamp: new Date(),
    };

    // Add to history
    this.history.push(metrics);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return metrics;
  }

  /**
   * Get task statistics
   */
  getTaskStats(): TaskStats {
    return { ...this.taskStats };
  }

  /**
   * Record new task
   */
  recordTaskStart(): void {
    this.taskStats.totalTasks++;
    this.taskStats.activeTasks++;
  }

  /**
   * Record task completion
   */
  recordTaskComplete(): void {
    this.taskStats.activeTasks--;
    this.taskStats.completedTasks++;
  }

  /**
   * Record task failure
   */
  recordTaskFail(): void {
    this.taskStats.activeTasks--;
    this.taskStats.failedTasks++;
  }

  /**
   * Record queued task
   */
  recordTaskQueued(): void {
    this.taskStats.queuedTasks++;
  }

  /**
   * Dequeue task
   */
  recordTaskDequeued(): void {
    this.taskStats.queuedTasks--;
  }

  /**
   * Check if resources are within limits
   */
  checkResources(): { allowed: boolean; reason?: string } {
    const metrics = this.getSystemMetrics();

    if (metrics.cpu.usage > this.limits.maxCpu) {
      return {
        allowed: false,
        reason: `CPU usage (${metrics.cpu.usage.toFixed(1)}%) exceeds limit (${this.limits.maxCpu}%)`,
      };
    }

    if (metrics.memory.usagePercent > this.limits.maxMemory) {
      return {
        allowed: false,
        reason: `Memory usage (${metrics.memory.usagePercent.toFixed(1)}%) exceeds limit (${this.limits.maxMemory}%)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Set resource limits
   */
  setLimits(limits: Partial<ResourceLimit>): void {
    this.limits = { ...this.limits, ...limits };
    console.log(`[ResourceMonitor] Updated limits:`, this.limits);
  }

  /**
   * Get resource limits
   */
  getLimits(): ResourceLimit {
    return { ...this.limits };
  }

  /**
   * Get metrics history
   */
  getHistory(): SystemMetrics[] {
    return [...this.history];
  }

  /**
   * Get average metrics over history
   */
  getAverageMetrics(): { cpu: number; memory: number } {
    if (this.history.length === 0) {
      return { cpu: 0, memory: 0 };
    }

    const avgCpu = this.history.reduce((sum, m) => sum + m.cpu.usage, 0) / this.history.length;
    const avgMemory = this.history.reduce((sum, m) => sum + m.memory.usagePercent, 0) / this.history.length;

    return {
      cpu: avgCpu,
      memory: avgMemory,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.taskStats = {
      totalTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      queuedTasks: 0,
    };
    console.log('[ResourceMonitor] Statistics reset');
  }

  /**
   * Get summary report
   */
  getSummary(): {
    system: SystemMetrics;
    tasks: TaskStats;
    limits: ResourceLimit;
    status: 'healthy' | 'warning' | 'critical';
  } {
    const system = this.getSystemMetrics();
    const status = this.getStatus(system);

    return {
      system,
      tasks: this.getTaskStats(),
      limits: this.getLimits(),
      status,
    };
  }

  /**
   * Determine system status
   */
  private getStatus(metrics: SystemMetrics): 'healthy' | 'warning' | 'critical' {
    const cpu = metrics.cpu.usage;
    const mem = metrics.memory.usagePercent;

    if (cpu > this.limits.maxCpu || mem > this.limits.maxMemory) {
      return 'critical';
    }

    if (cpu > this.limits.maxCpu * 0.8 || mem > this.limits.maxMemory * 0.8) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// Export singleton instance
export const resourceMonitor = new ResourceMonitor();
