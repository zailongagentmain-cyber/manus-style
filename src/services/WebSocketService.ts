import { Notification, TaskSubscription } from '../types/notification';

/**
 * WebSocket Service for real-time notifications
 * Note: This is a mock implementation for framework setup
 */
export class WebSocketService {
  private subscriptions: Map<string, TaskSubscription[]> = new Map();
  private clients: Map<string, any> = new Map();
  private mockMode: boolean = true;

  constructor(mockMode: boolean = true) {
    this.mockMode = mockMode;
  }

  /**
   * Add a client connection
   */
  addClient(wsId: string, ws: any): void {
    this.clients.set(wsId, ws);
    console.log(`[WebSocket] Client connected: ${wsId}`);
  }

  /**
   * Remove a client connection
   */
  removeClient(wsId: string): void {
    // Remove client from all subscriptions
    this.subscriptions.forEach((subs, taskId) => {
      this.subscriptions.set(
        taskId,
        subs.filter((s) => s.wsId !== wsId)
      );
    });
    this.clients.delete(wsId);
    console.log(`[WebSocket] Client disconnected: ${wsId}`);
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcast(notification: Notification): void {
    const message = JSON.stringify(notification);
    
    if (this.mockMode) {
      console.log(`[WebSocket] Broadcasting: ${message}`);
      return;
    }

    this.clients.forEach((ws, wsId) => {
      this.sendToClient(wsId, notification);
    });
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: string, notification: Notification): void {
    if (this.mockMode) {
      console.log(`[WebSocket] Send to user ${userId}:`, notification);
      return;
    }

    // Find all connections for this user
    const userConnections = this.getUserConnections(userId);
    userConnections.forEach((wsId) => {
      this.sendToClient(wsId, notification);
    });
  }

  /**
   * Send notification to all subscribers of a task
   */
  sendToTaskSubscribers(taskId: string, notification: Notification): void {
    const subs = this.subscriptions.get(taskId) || [];
    
    if (this.mockMode) {
      console.log(`[WebSocket] Send to task ${taskId} subscribers:`, notification);
      return;
    }

    subs.forEach((sub) => {
      this.sendToClient(sub.wsId, notification);
    });
  }

  /**
   * Subscribe to task updates
   */
  subscribeTask(taskId: string, userId: string, wsId: string): void {
    const subs = this.subscriptions.get(taskId) || [];
    subs.push({ taskId, userId, wsId });
    this.subscriptions.set(taskId, subs);
    console.log(`[WebSocket] User ${userId} subscribed to task ${taskId}`);
  }

  /**
   * Unsubscribe from task updates
   */
  unsubscribeTask(taskId: string, userId: string, wsId: string): void {
    const subs = this.subscriptions.get(taskId) || [];
    const filtered = subs.filter(
      (s) => !(s.taskId === taskId && s.userId === userId && s.wsId === wsId)
    );
    this.subscriptions.set(taskId, filtered);
    console.log(`[WebSocket] User ${userId} unsubscribed from task ${taskId}`);
  }

  /**
   * Get task subscribers
   */
  getTaskSubscribers(taskId: string): TaskSubscription[] {
    return this.subscriptions.get(taskId) || [];
  }

  /**
   * Send message to a specific client
   */
  private sendToClient(wsId: string, notification: Notification): void {
    const ws = this.clients.get(wsId);
    if (!ws) return;

    try {
      const message = JSON.stringify(notification);
      if (ws.send) {
        ws.send(message);
      }
    } catch (error) {
      console.error(`[WebSocket] Failed to send to ${wsId}:`, error);
    }
  }

  /**
   * Get all connections for a user
   */
  private getUserConnections(userId: string): string[] {
    const connections: string[] = [];
    this.subscriptions.forEach((subs) => {
      subs.forEach((s) => {
        if (s.userId === userId) {
          connections.push(s.wsId);
        }
      });
    });
    return [...new Set(connections)];
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
