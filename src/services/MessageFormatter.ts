import { Notification, NotificationType } from '../types/notification';

export class MessageFormatter {
  /**
   * Format task started notification
   */
  static formatTaskCreated(taskId: string, title: string): Notification {
    return {
      type: 'task_started',
      taskId,
      userId: '',
      title: 'Task Started',
      content: `Task "${title}" has been started`,
      priority: 'normal',
      timestamp: Date.now(),
    };
  }

  /**
   * Format progress notification
   */
  static formatProgress(
    taskId: string,
    progress: number,
    message?: string
  ): Notification {
    return {
      type: 'progress',
      taskId,
      userId: '',
      title: 'Task Progress',
      content: message || `Progress: ${progress}%`,
      priority: 'normal',
      timestamp: Date.now(),
    };
  }

  /**
   * Format confirmation request notification
   */
  static formatConfirmation(
    taskId: string,
    title: string,
    message: string,
    actions?: Notification['actions']
  ): Notification {
    return {
      type: 'need_confirmation',
      taskId,
      userId: '',
      title: `Confirmation Needed: ${title}`,
      content: message,
      priority: 'high',
      actions,
      timestamp: Date.now(),
    };
  }

  /**
   * Format task completed notification
   */
  static formatCompleted(
    taskId: string,
    title: string,
    summary?: string
  ): Notification {
    return {
      type: 'task_completed',
      taskId,
      userId: '',
      title: 'Task Completed',
      content: summary || `Task "${title}" has been completed successfully`,
      priority: 'normal',
      timestamp: Date.now(),
    };
  }

  /**
   * Format error notification
   */
  static formatError(
    taskId: string,
    error: string,
    details?: string
  ): Notification {
    return {
      type: 'task_failed',
      taskId,
      userId: '',
      title: 'Task Failed',
      content: details ? `${error}: ${details}` : error,
      priority: 'urgent',
      timestamp: Date.now(),
    };
  }

  /**
   * Format error alert notification
   */
  static formatErrorAlert(taskId: string, message: string): Notification {
    return {
      type: 'error_alert',
      taskId,
      userId: '',
      title: 'Error Alert',
      content: message,
      priority: 'urgent',
      timestamp: Date.now(),
    };
  }

  /**
   * Format progress bar as string
   */
  static formatProgressBar(
    current: number,
    total: number,
    width: number = 20
  ): string {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const filled = Math.round((current / total) * width) || 0;
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage}% (${current}/${total})`;
  }

  /**
   * Format notification to string message
   */
  static toMessage(notification: Notification): string {
    const emoji = this.getEmoji(notification.type);
    return `${emoji} **${notification.title}**\n${notification.content}`;
  }

  private static getEmoji(type: NotificationType): string {
    const emojis: Record<NotificationType, string> = {
      task_started: '🚀',
      subtask_completed: '✅',
      progress: '📊',
      need_confirmation: '❓',
      task_completed: '🎉',
      task_failed: '❌',
      error_alert: '⚠️',
    };
    return emojis[type] || '📢';
  }
}
