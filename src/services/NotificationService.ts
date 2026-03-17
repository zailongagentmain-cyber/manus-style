import { Notification, NotificationType, Priority } from '../types/notification';
import { MessageFormatter } from './MessageFormatter';
import { wsService } from './WebSocketService';

export interface NotificationOptions {
  userId?: string;
  taskId: string;
  title: string;
  content: string;
  priority?: Priority;
  actions?: Notification['actions'];
}

export interface ChannelAdapter {
  send(notification: Notification): Promise<void>;
}

/**
 * Notification Service - handles sending notifications to various channels
 */
export class NotificationService {
  private channels: ChannelAdapter[] = [];
  private wsEnabled: boolean = true;

  constructor(wsEnabled: boolean = true) {
    this.wsEnabled = wsEnabled;
  }

  /**
   * Add a channel adapter
   */
  addChannel(channel: ChannelAdapter): void {
    this.channels.push(channel);
  }

  /**
   * Send notification to all channels
   */
  async send(notification: Notification): Promise<void> {
    // Send via WebSocket
    if (this.wsEnabled) {
      wsService.broadcast(notification);
      wsService.sendToTaskSubscribers(notification.taskId, notification);
    }

    // Send via other channels
    const promises = this.channels.map((channel) =>
      channel.send(notification).catch((err) =>
        console.error('[NotificationService] Channel send error:', err)
      )
    );

    await Promise.all(promises);
  }

  /**
   * Notify task started
   */
  async notifyTaskStarted(taskId: string, userId: string, title: string): Promise<void> {
    const notification: Notification = {
      type: 'task_started',
      taskId,
      userId,
      title: '🚀 Task Started',
      content: `Task "${title}" has been started`,
      priority: 'normal',
      timestamp: Date.now(),
    };
    await this.send(notification);
  }

  /**
   * Notify task progress
   */
  async notifyTaskProgress(
    taskId: string,
    userId: string,
    progress: number,
    message?: string
  ): Promise<void> {
    const notification: Notification = {
      type: 'progress',
      taskId,
      userId,
      title: '📊 Progress Update',
      content: message || `Progress: ${progress}%`,
      priority: progress >= 100 ? 'normal' : 'low',
      timestamp: Date.now(),
    };
    await this.send(notification);
  }

  /**
   * Notify subtask completed
   */
  async notifySubtaskCompleted(
    taskId: string,
    userId: string,
    subtaskName: string,
    progress?: number
  ): Promise<void> {
    const content = progress
      ? `Subtask "${subtaskName}" completed (${progress}%)`
      : `Subtask "${subtaskName}" completed`;
    
    const notification: Notification = {
      type: 'subtask_completed',
      taskId,
      userId,
      title: '✅ Subtask Completed',
      content,
      priority: 'low',
      timestamp: Date.now(),
    };
    await this.send(notification);
  }

  /**
   * Notify needs confirmation
   */
  async notifyNeedsConfirmation(
    taskId: string,
    userId: string,
    title: string,
    message: string,
    actions?: Notification['actions']
  ): Promise<void> {
    const notification: Notification = {
      type: 'need_confirmation',
      taskId,
      userId,
      title: `❓ Confirmation Needed: ${title}`,
      content: message,
      priority: 'high',
      actions,
      timestamp: Date.now(),
    };
    await this.send(notification);
  }

  /**
   * Notify task completed
   */
  async notifyTaskCompleted(
    taskId: string,
    userId: string,
    title: string,
    summary?: string
  ): Promise<void> {
    const notification: Notification = {
      type: 'task_completed',
      taskId,
      userId,
      title: '🎉 Task Completed',
      content: summary || `Task "${title}" has been completed successfully`,
      priority: 'normal',
      timestamp: Date.now(),
    };
    await this.send(notification);
  }

  /**
   * Notify task failed
   */
  async notifyTaskFailed(
    taskId: string,
    userId: string,
    error: string,
    details?: string
  ): Promise<void> {
    const notification: Notification = {
      type: 'task_failed',
      taskId,
      userId,
      title: '❌ Task Failed',
      content: details ? `${error}: ${details}` : error,
      priority: 'urgent',
      timestamp: Date.now(),
    };
    await this.send(notification);
  }

  /**
   * Send error alert
   */
  async sendErrorAlert(
    taskId: string,
    userId: string,
    message: string
  ): Promise<void> {
    const notification: Notification = {
      type: 'error_alert',
      taskId,
      userId,
      title: '⚠️ Error Alert',
      content: message,
      priority: 'urgent',
      timestamp: Date.now(),
    };
    await this.send(notification);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
