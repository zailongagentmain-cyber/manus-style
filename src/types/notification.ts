export type NotificationType =
  | 'task_started'
  | 'subtask_completed'
  | 'progress'
  | 'need_confirmation'
  | 'task_completed'
  | 'task_failed'
  | 'error_alert';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationAction {
  label: string;
  action: string;
  payload?: any;
}

export interface Notification {
  type: NotificationType;
  taskId: string;
  userId: string;
  title: string;
  content: string;
  priority: Priority;
  actions?: NotificationAction[];
  timestamp?: number;
}

export interface TaskSubscription {
  taskId: string;
  userId: string;
  wsId: string;
}
