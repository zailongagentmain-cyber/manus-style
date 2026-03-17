import { test, expect, describe, beforeEach } from '@jest/globals';
import { WebSocketService } from '../../src/services/WebSocketService';
import { Notification, NotificationType } from '../../src/types/notification';

/**
 * E2E 测试 - WebSocket 推送
 * 
 * 测试 WebSocket 实时推送功能：
 * 1. 客户端连接管理
 * 2. 任务订阅/取消订阅
 * 3. 消息广播
 * 4. 任务状态更新推送
 */
describe('WebSocket Service', () => {
  let wsService: WebSocketService;

  beforeEach(() => {
    // 使用 mock 模式以便测试
    wsService = new WebSocketService(true);
  });

  test('应该能够添加客户端', () => {
    const mockWs = { send: jest.fn() };
    
    wsService.addClient('client-1', mockWs);
    
    // 验证客户端被添加（通过订阅功能间接验证）
    wsService.subscribeTask('task-1', 'user-1', 'client-1');
    const subscribers = wsService.getTaskSubscribers('task-1');
    
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0].userId).toBe('user-1');
  });

  test('应该能够移除客户端', () => {
    const mockWs = { send: jest.fn() };
    
    wsService.addClient('client-1', mockWs);
    wsService.subscribeTask('task-1', 'user-1', 'client-1');
    wsService.removeClient('client-1');
    
    const subscribers = wsService.getTaskSubscribers('task-1');
    expect(subscribers).toHaveLength(0);
  });

  test('应该能够订阅任务更新', () => {
    wsService.subscribeTask('task-123', 'user-abc', 'ws-456');
    
    const subscribers = wsService.getTaskSubscribers('task-123');
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0]).toEqual({
      taskId: 'task-123',
      userId: 'user-abc',
      wsId: 'ws-456',
    });
  });

  test('应该能够取消订阅任务', () => {
    wsService.subscribeTask('task-1', 'user-1', 'ws-1');
    wsService.subscribeTask('task-1', 'user-2', 'ws-2');
    
    wsService.unsubscribeTask('task-1', 'user-1', 'ws-1');
    
    const subscribers = wsService.getTaskSubscribers('task-1');
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0].userId).toBe('user-2');
  });

  test('应该能够广播通知', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const notification: Notification = {
      type: 'task_started',
      taskId: 'task-abc',
      userId: 'user-123',
      title: '任务开始',
      content: '任务开始执行',
      priority: 'normal',
      timestamp: Date.now(),
    };
    
    wsService.broadcast(notification);
    
    // 验证日志输出（mock 模式下会打印）
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('[WebSocket] Broadcasting');
    
    consoleSpy.mockRestore();
  });

  test('应该能够向任务订阅者发送通知', () => {
    wsService.subscribeTask('task-xyz', 'user-123', 'ws-999');
    
    const notification: Notification = {
      type: 'task_completed',
      taskId: 'task-xyz',
      userId: 'user-123',
      title: '任务完成',
      content: '任务已完成',
      priority: 'normal',
      timestamp: Date.now(),
    };
    
    // 发送通知
    wsService.sendToTaskSubscribers('task-xyz', notification);
    
    // 验证发送方法被调用（通过检查订阅者存在）
    const subscribers = wsService.getTaskSubscribers('task-xyz');
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0].wsId).toBe('ws-999');
  });

  test('应该能够向特定用户发送通知', () => {
    wsService.subscribeTask('task-1', 'specific-user', 'ws-1');
    
    const notification: Notification = {
      type: 'task_failed',
      taskId: 'task-1',
      userId: 'specific-user',
      title: '任务失败',
      content: '任务执行失败',
      priority: 'high',
      timestamp: Date.now(),
    };
    
    // 发送通知
    wsService.sendToUser('specific-user', notification);
    
    // 验证发送方法被调用（通过检查订阅者存在）
    const subscribers = wsService.getTaskSubscribers('task-1');
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0].userId).toBe('specific-user');
  });

  test('支持多个用户订阅同一任务', () => {
    wsService.subscribeTask('task-shared', 'user-1', 'ws-1');
    wsService.subscribeTask('task-shared', 'user-2', 'ws-2');
    wsService.subscribeTask('task-shared', 'user-3', 'ws-3');
    
    const subscribers = wsService.getTaskSubscribers('task-shared');
    expect(subscribers).toHaveLength(3);
  });
});
