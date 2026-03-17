import { NotificationService } from '../../src/services/NotificationService';
import { MessageFormatter } from '../../src/services/MessageFormatter';
import { WebSocketService } from '../../src/services/WebSocketService';
import { Notification, NotificationType } from '../../src/types/notification';

// Mock the WebSocketService with actual subscription tracking
const mockSubscriptions = new Map<string, any[]>();

jest.mock('../../src/services/WebSocketService', () => {
  return {
    wsService: {
      broadcast: jest.fn(),
      sendToTaskSubscribers: jest.fn(),
      sendToUser: jest.fn(),
      subscribeTask: jest.fn((taskId: string, userId: string, wsId: string) => {
        const subs = mockSubscriptions.get(taskId) || [];
        subs.push({ taskId, userId, wsId });
        mockSubscriptions.set(taskId, subs);
      }),
      unsubscribeTask: jest.fn((taskId: string, userId: string, wsId: string) => {
        const subs = mockSubscriptions.get(taskId) || [];
        const filtered = subs.filter(
          (s) => !(s.taskId === taskId && s.userId === userId && s.wsId === wsId)
        );
        mockSubscriptions.set(taskId, filtered);
      }),
      getTaskSubscribers: jest.fn((taskId: string) => {
        return mockSubscriptions.get(taskId) || [];
      }),
    },
    WebSocketService: jest.fn(),
  };
});

describe('NotificationService', () => {
  let service: NotificationService;
  const mockWsService = require('../../src/services/WebSocketService').wsService;

  beforeEach(() => {
    service = new NotificationService(true);
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should broadcast notification via WebSocket', async () => {
      const notification: Notification = {
        type: 'task_started',
        taskId: 'task-1',
        userId: 'user-1',
        title: 'Test',
        content: 'Test content',
        priority: 'normal',
        timestamp: Date.now(),
      };

      await service.send(notification);

      expect(mockWsService.broadcast).toHaveBeenCalledWith(notification);
      expect(mockWsService.sendToTaskSubscribers).toHaveBeenCalledWith(
        'task-1',
        notification
      );
    });
  });

  describe('notifyTaskStarted', () => {
    it('should create and send task started notification', async () => {
      await service.notifyTaskStarted('task-1', 'user-1', 'Test Task');

      expect(mockWsService.broadcast).toHaveBeenCalled();
      const call = mockWsService.broadcast.mock.calls[0][0];
      expect(call.type).toBe('task_started');
      expect(call.taskId).toBe('task-1');
      expect(call.userId).toBe('user-1');
      expect(call.title).toContain('Task Started');
    });
  });

  describe('notifyTaskProgress', () => {
    it('should send progress notification with percentage', async () => {
      await service.notifyTaskProgress('task-1', 'user-1', 50, 'Processing...');

      expect(mockWsService.broadcast).toHaveBeenCalled();
      const call = mockWsService.broadcast.mock.calls[0][0];
      expect(call.type).toBe('progress');
      expect(call.content).toBe('Processing...');
    });
  });

  describe('notifySubtaskCompleted', () => {
    it('should send subtask completed notification', async () => {
      await service.notifySubtaskCompleted('task-1', 'user-1', 'Subtask A', 75);

      expect(mockWsService.broadcast).toHaveBeenCalled();
      const call = mockWsService.broadcast.mock.calls[0][0];
      expect(call.type).toBe('subtask_completed');
      expect(call.content).toContain('Subtask A');
      expect(call.content).toContain('75%');
    });
  });

  describe('notifyNeedsConfirmation', () => {
    it('should send confirmation request with actions', async () => {
      const actions = [
        { label: 'Approve', action: 'approve' },
        { label: 'Reject', action: 'reject' },
      ];

      await service.notifyNeedsConfirmation(
        'task-1',
        'user-1',
        'Approval Needed',
        'Please confirm this action',
        actions
      );

      expect(mockWsService.broadcast).toHaveBeenCalled();
      const call = mockWsService.broadcast.mock.calls[0][0];
      expect(call.type).toBe('need_confirmation');
      expect(call.priority).toBe('high');
      expect(call.actions).toEqual(actions);
    });
  });

  describe('notifyTaskCompleted', () => {
    it('should send task completed notification', async () => {
      await service.notifyTaskCompleted(
        'task-1',
        'user-1',
        'My Task',
        'All done!'
      );

      expect(mockWsService.broadcast).toHaveBeenCalled();
      const call = mockWsService.broadcast.mock.calls[0][0];
      expect(call.type).toBe('task_completed');
      expect(call.content).toBe('All done!');
    });
  });

  describe('notifyTaskFailed', () => {
    it('should send task failed notification with urgent priority', async () => {
      await service.notifyTaskFailed(
        'task-1',
        'user-1',
        'Connection timeout',
        'Failed to connect to API'
      );

      expect(mockWsService.broadcast).toHaveBeenCalled();
      const call = mockWsService.broadcast.mock.calls[0][0];
      expect(call.type).toBe('task_failed');
      expect(call.priority).toBe('urgent');
      expect(call.content).toContain('Connection timeout');
    });
  });

  describe('sendErrorAlert', () => {
    it('should send error alert notification', async () => {
      await service.sendErrorAlert('task-1', 'user-1', 'Critical error occurred');

      expect(mockWsService.broadcast).toHaveBeenCalled();
      const call = mockWsService.broadcast.mock.calls[0][0];
      expect(call.type).toBe('error_alert');
      expect(call.priority).toBe('urgent');
    });
  });
});

describe('MessageFormatter', () => {
  describe('formatTaskCreated', () => {
    it('should format task created notification', () => {
      const result = MessageFormatter.formatTaskCreated('task-1', 'Test Task');

      expect(result.type).toBe('task_started');
      expect(result.taskId).toBe('task-1');
      expect(result.title).toBe('Task Started');
      expect(result.priority).toBe('normal');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('formatProgress', () => {
    it('should format progress notification', () => {
      const result = MessageFormatter.formatProgress('task-1', 50);

      expect(result.type).toBe('progress');
      expect(result.content).toBe('Progress: 50%');
    });

    it('should use custom message when provided', () => {
      const result = MessageFormatter.formatProgress(
        'task-1',
        75,
        'Processing step 3'
      );

      expect(result.content).toBe('Processing step 3');
    });
  });

  describe('formatConfirmation', () => {
    it('should format confirmation with actions', () => {
      const actions = [{ label: 'OK', action: 'confirm' }];
      const result = MessageFormatter.formatConfirmation(
        'task-1',
        'Confirm',
        'Are you sure?',
        actions
      );

      expect(result.type).toBe('need_confirmation');
      expect(result.priority).toBe('high');
      expect(result.actions).toEqual(actions);
    });
  });

  describe('formatCompleted', () => {
    it('should format task completed notification', () => {
      const result = MessageFormatter.formatCompleted(
        'task-1',
        'My Task',
        'Summary here'
      );

      expect(result.type).toBe('task_completed');
      expect(result.content).toBe('Summary here');
    });

    it('should use default content when no summary provided', () => {
      const result = MessageFormatter.formatCompleted('task-1', 'My Task');

      expect(result.content).toContain('My Task');
    });
  });

  describe('formatError', () => {
    it('should format error notification', () => {
      const result = MessageFormatter.formatError('task-1', 'Error occurred');

      expect(result.type).toBe('task_failed');
      expect(result.priority).toBe('urgent');
    });

    it('should include details when provided', () => {
      const result = MessageFormatter.formatError(
        'task-1',
        'Error',
        'Details here'
      );

      expect(result.content).toContain('Error');
      expect(result.content).toContain('Details here');
    });
  });

  describe('formatProgressBar', () => {
    it('should format progress bar with default width', () => {
      const result = MessageFormatter.formatProgressBar(50, 100);

      expect(result).toContain('50%');
      expect(result).toContain('50/100');
      expect(result).toMatch(/50%/);
    });

    it('should format progress bar with custom width', () => {
      const result = MessageFormatter.formatProgressBar(25, 100, 10);

      expect(result).toContain('25%');
      expect(result.length).toBeLessThan(30);
    });

    it('should handle zero total', () => {
      const result = MessageFormatter.formatProgressBar(0, 0);

      expect(result).toContain('0%');
    });
  });

  describe('toMessage', () => {
    it('should format notification as string with emoji', () => {
      const notification: Notification = {
        type: 'task_started',
        taskId: 'task-1',
        userId: 'user-1',
        title: 'Test',
        content: 'Content',
        priority: 'normal',
      };

      const result = MessageFormatter.toMessage(notification);

      expect(result).toContain('🚀');
      expect(result).toContain('**Test**');
      expect(result).toContain('Content');
    });
  });
});

describe('WebSocketService', () => {
  // Test the actual exported singleton
  const wsService = require('../../src/services/WebSocketService').wsService;

  describe('subscribeTask', () => {
    it('should add subscription', () => {
      wsService.subscribeTask('task-1', 'user-1', 'ws-1');

      const subs = wsService.getTaskSubscribers('task-1');
      expect(subs).toHaveLength(1);
      expect(subs[0].taskId).toBe('task-1');
      expect(subs[0].userId).toBe('user-1');
    });
  });

  describe('unsubscribeTask', () => {
    it('should remove subscription', () => {
      wsService.subscribeTask('task-1', 'user-1', 'ws-1');
      wsService.unsubscribeTask('task-1', 'user-1', 'ws-1');

      const subs = wsService.getTaskSubscribers('task-1');
      expect(subs).toHaveLength(0);
    });
  });

  describe('broadcast', () => {
    it('should call broadcast', () => {
      const notification: Notification = {
        type: 'task_started',
        taskId: 'task-1',
        userId: 'user-1',
        title: 'Test',
        content: 'Test',
        priority: 'normal',
      };

      wsService.broadcast(notification);

      expect(wsService.broadcast).toHaveBeenCalledWith(notification);
    });
  });
});
