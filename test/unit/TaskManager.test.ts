/**
 * Task Manager 单元测试
 */

import { TaskManager } from '../../src/core/TaskManager';
import { TaskStateMachine } from '../../src/core/TaskStateMachine';
import { TaskStorage } from '../../src/core/TaskStorage';
import { TaskStatus, TaskInput } from '../../src/types/task';
import * as path from 'path';
import * as fs from 'fs';

// 测试用的临时目录
const TEST_STORAGE_DIR = path.join(__dirname, '.test-task-data');

describe('TaskStateMachine', () => {
  beforeAll(() => {
    // 确保测试目录存在
    if (!fs.existsSync(TEST_STORAGE_DIR)) {
      fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // 清理测试目录
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true });
    }
  });

  describe('canTransition', () => {
    it('应该允许 PENDING -> RUNNING', () => {
      expect(TaskStateMachine.canTransition(TaskStatus.PENDING, TaskStatus.RUNNING)).toBe(true);
    });

    it('应该允许 PENDING -> PAUSED', () => {
      expect(TaskStateMachine.canTransition(TaskStatus.PENDING, TaskStatus.PAUSED)).toBe(true);
    });

    it('应该允许 RUNNING -> COMPLETED', () => {
      expect(TaskStateMachine.canTransition(TaskStatus.RUNNING, TaskStatus.COMPLETED)).toBe(true);
    });

    it('应该允许 RUNNING -> FAILED', () => {
      expect(TaskStateMachine.canTransition(TaskStatus.RUNNING, TaskStatus.FAILED)).toBe(true);
    });

    it('应该允许 RUNNING -> PAUSED', () => {
      expect(TaskStateMachine.canTransition(TaskStatus.RUNNING, TaskStatus.PAUSED)).toBe(true);
    });

    it('应该允许 PAUSED -> RUNNING', () => {
      expect(TaskStateMachine.canTransition(TaskStatus.PAUSED, TaskStatus.RUNNING)).toBe(true);
    });

    it('应该禁止 COMPLETED -> 任何状态', () => {
      expect(TaskStateMachine.canTransition(TaskStatus.COMPLETED, TaskStatus.PENDING)).toBe(false);
      expect(TaskStateMachine.canTransition(TaskStatus.COMPLETED, TaskStatus.RUNNING)).toBe(false);
      expect(TaskStateMachine.canTransition(TaskStatus.COMPLETED, TaskStatus.FAILED)).toBe(false);
    });

    it('应该禁止 PENDING -> COMPLETED', () => {
      expect(TaskStateMachine.canTransition(TaskStatus.PENDING, TaskStatus.COMPLETED)).toBe(false);
    });
  });

  describe('transition', () => {
    it('应该成功执行合法转换', () => {
      expect(TaskStateMachine.transition(TaskStatus.PENDING, TaskStatus.RUNNING)).toBe(TaskStatus.RUNNING);
    });

    it('应该抛出非法转换错误', () => {
      expect(() => {
        TaskStateMachine.transition(TaskStatus.PENDING, TaskStatus.COMPLETED);
      }).toThrow();
    });
  });

  describe('getAvailableTransitions', () => {
    it('应该返回 PENDING 的可用转换', () => {
      const transitions = TaskStateMachine.getAvailableTransitions(TaskStatus.PENDING);
      expect(transitions).toContain(TaskStatus.RUNNING);
      expect(transitions).toContain(TaskStatus.PAUSED);
      expect(transitions).toContain(TaskStatus.FAILED);
    });

    it('应该返回 COMPLETED 无可用转换', () => {
      const transitions = TaskStateMachine.getAvailableTransitions(TaskStatus.COMPLETED);
      expect(transitions).toHaveLength(0);
    });
  });

  describe('isFinalStatus', () => {
    it('COMPLETED 是终态', () => {
      expect(TaskStateMachine.isFinalStatus(TaskStatus.COMPLETED)).toBe(true);
    });

    it('FAILED 是终态', () => {
      expect(TaskStateMachine.isFinalStatus(TaskStatus.FAILED)).toBe(true);
    });

    it('RUNNING 不是终态', () => {
      expect(TaskStateMachine.isFinalStatus(TaskStatus.RUNNING)).toBe(false);
    });
  });

  describe('isActiveStatus', () => {
    it('RUNNING 是活跃状态', () => {
      expect(TaskStateMachine.isActiveStatus(TaskStatus.RUNNING)).toBe(true);
    });

    it('PAUSED 是活跃状态', () => {
      expect(TaskStateMachine.isActiveStatus(TaskStatus.PAUSED)).toBe(true);
    });

    it('COMPLETED 不是活跃状态', () => {
      expect(TaskStateMachine.isActiveStatus(TaskStatus.COMPLETED)).toBe(false);
    });
  });
});

describe('TaskStorage', () => {
  let storage: TaskStorage;

  beforeEach(() => {
    // 每次测试使用新的存储实例和独立目录
    const testDir = path.join(TEST_STORAGE_DIR, `storage_${Date.now()}_${Math.random()}`);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    storage = new TaskStorage({ storageDir: testDir });
  });

  describe('CRUD 操作', () => {
    it('应该创建任务', () => {
      const task = {
        id: 'task_1',
        userId: 'user_1',
        channel: 'feishu' as const,
        input: 'test input',
        status: TaskStatus.PENDING,
        currentStep: 0,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      };

      const created = storage.create(task);
      expect(created.id).toBe('task_1');
    });

    it('应该获取任务', () => {
      const task = {
        id: 'task_2',
        userId: 'user_1',
        channel: 'feishu' as const,
        input: 'test input',
        status: TaskStatus.PENDING,
        currentStep: 0,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      };

      storage.create(task);
      const found = storage.get('task_2');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('task_2');
    });

    it('应该返回 null 当任务不存在', () => {
      const found = storage.get('nonexistent');
      expect(found).toBeNull();
    });

    it('应该更新任务', () => {
      const task = {
        id: 'task_3',
        userId: 'user_1',
        channel: 'feishu' as const,
        input: 'test input',
        status: TaskStatus.PENDING,
        currentStep: 0,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      };

      storage.create(task);
      const updated = storage.update('task_3', { status: TaskStatus.RUNNING });
      
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe(TaskStatus.RUNNING);
    });

    it('应该删除任务', () => {
      const task = {
        id: 'task_4',
        userId: 'user_1',
        channel: 'feishu' as const,
        input: 'test input',
        status: TaskStatus.PENDING,
        currentStep: 0,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      };

      storage.create(task);
      const deleted = storage.delete('task_4');
      expect(deleted).toBe(true);

      const found = storage.get('task_4');
      expect(found).toBeNull();
    });
  });

  describe('查询功能', () => {
    beforeEach(() => {
      // 创建多个测试任务
      const tasks = [
        { id: 'task_a', userId: 'user_1', channel: 'feishu' as const, input: 'a', status: TaskStatus.PENDING, currentStep: 0, subtasks: [], createdAt: new Date(), updatedAt: new Date(), metadata: {} },
        { id: 'task_b', userId: 'user_1', channel: 'feishu' as const, input: 'b', status: TaskStatus.RUNNING, currentStep: 0, subtasks: [], createdAt: new Date(), updatedAt: new Date(), metadata: {} },
        { id: 'task_c', userId: 'user_2', channel: 'web' as const, input: 'c', status: TaskStatus.COMPLETED, currentStep: 0, subtasks: [], createdAt: new Date(), updatedAt: new Date(), metadata: {} },
      ];
      tasks.forEach(t => storage.create(t));
    });

    it('应该按用户 ID 查询', () => {
      const result = storage.query({ userId: 'user_1' });
      expect(result.tasks).toHaveLength(2);
    });

    it('应该按状态查询', () => {
      const result = storage.query({ status: TaskStatus.PENDING });
      expect(result.tasks).toHaveLength(1);
    });

    it('应该按渠道查询', () => {
      const result = storage.query({ channel: 'feishu' });
      expect(result.tasks).toHaveLength(2);
    });

    it('应该支持分页', () => {
      const result = storage.query({ limit: 1, offset: 0 });
      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(3);
    });
  });
});

describe('TaskManager', () => {
  let manager: TaskManager;

  beforeEach(() => {
    // 每次测试使用新的管理器实例和独立目录
    const testDir = path.join(TEST_STORAGE_DIR, `manager_${Date.now()}_${Math.random()}`);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    manager = new TaskManager(testDir);
  });

  describe('createTask', () => {
    it('应该创建任务', () => {
      const input: TaskInput = {
        userId: 'user_1',
        channel: 'feishu',
        message: 'test message'
      };

      const task = manager.createTask(input);
      
      expect(task.id).toMatch(/^task_/);
      expect(task.userId).toBe('user_1');
      expect(task.channel).toBe('feishu');
      expect(task.input).toBe('test message');
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it('应该支持创建带子任务的任务', () => {
      const input: TaskInput = {
        userId: 'user_1',
        channel: 'feishu',
        message: 'test message'
      };

      const task = manager.createTask(input, {
        subtasks: [
          { description: 'step 1', agent: 'search' as const, input: 'query' },
          { description: 'step 2', agent: 'browser' as const, input: 'url' }
        ]
      });

      expect(task.subtasks).toHaveLength(2);
      expect(task.subtasks[0].agent).toBe('search');
      expect(task.subtasks[1].agent).toBe('browser');
    });

    it('应该支持元数据', () => {
      const input: TaskInput = {
        userId: 'user_1',
        channel: 'feishu',
        message: 'test',
        metadata: { priority: 'high', tags: ['urgent'] }
      };

      const task = manager.createTask(input);
      expect(task.metadata.priority).toBe('high');
      expect(task.metadata.tags).toContain('urgent');
    });
  });

  describe('getTask', () => {
    it('应该获取任务', () => {
      const input: TaskInput = {
        userId: 'user_1',
        channel: 'feishu',
        message: 'test'
      };

      const created = manager.createTask(input);
      const found = manager.getTask(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it('应该返回 null 当任务不存在', () => {
      const found = manager.getTask('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('应该更新任务', () => {
      const input: TaskInput = {
        userId: 'user_1',
        channel: 'feishu',
        message: 'test'
      };

      const task = manager.createTask(input);
      const updated = manager.updateTask(task.id, { currentStep: 1 });

      expect(updated?.currentStep).toBe(1);
    });

    it('应该验证状态转换', () => {
      const input: TaskInput = {
        userId: 'user_1',
        channel: 'feishu',
        message: 'test'
      };

      const task = manager.createTask(input);
      
      // PENDING -> COMPLETED 应该失败
      expect(() => {
        manager.updateTask(task.id, { status: TaskStatus.COMPLETED });
      }).toThrow();
    });
  });

  describe('listTasks', () => {
    it('应该列出所有任务', () => {
      manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'a' });
      manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'b' });

      const tasks = manager.listTasks();
      expect(tasks).toHaveLength(2);
    });

    it('应该支持用户过滤', () => {
      manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'a' });
      manager.createTask({ userId: 'user_2', channel: 'feishu', message: 'b' });

      const tasks = manager.listTasks({ userId: 'user_1' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].userId).toBe('user_1');
    });
  });

  describe('deleteTask', () => {
    it('应该删除任务', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      
      const deleted = manager.deleteTask(task.id);
      expect(deleted).toBe(true);

      const found = manager.getTask(task.id);
      expect(found).toBeNull();
    });

    it('应该返回 false 当任务不存在', () => {
      const deleted = manager.deleteTask('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('pauseTask', () => {
    it('应该暂停运行中的任务', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      manager.startTask(task.id); // 先启动任务
      
      const paused = manager.pauseTask(task.id);
      expect(paused?.status).toBe(TaskStatus.PAUSED);
    });

    it('应该抛出错误当任务不在运行中', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      
      expect(() => {
        manager.pauseTask(task.id);
      }).toThrow();
    });
  });

  describe('resumeTask', () => {
    it('应该恢复暂停的任务', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      manager.startTask(task.id);
      manager.pauseTask(task.id);
      
      const resumed = manager.resumeTask(task.id);
      expect(resumed?.status).toBe(TaskStatus.RUNNING);
    });

    it('应该抛出错误当任务不在暂停状态', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      
      expect(() => {
        manager.resumeTask(task.id);
      }).toThrow();
    });
  });

  describe('cancelTask', () => {
    it('应该取消任务', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      
      const cancelled = manager.cancelTask(task.id);
      expect(cancelled?.status).toBe(TaskStatus.FAILED);
      expect(cancelled?.error).toBe('Task cancelled by user');
    });

    it('应该抛出错误当任务已是终态', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      manager.startTask(task.id);
      manager.completeTask(task.id, { result: 'done' });
      
      expect(() => {
        manager.cancelTask(task.id);
      }).toThrow();
    });
  });

  describe('startTask', () => {
    it('应该启动待处理任务', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      
      const started = manager.startTask(task.id);
      expect(started?.status).toBe(TaskStatus.RUNNING);
    });

    it('应该恢复暂停的任务', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      manager.startTask(task.id);
      manager.pauseTask(task.id);
      
      const resumed = manager.startTask(task.id);
      expect(resumed?.status).toBe(TaskStatus.RUNNING);
    });
  });

  describe('completeTask', () => {
    it('应该完成任务', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      manager.startTask(task.id);
      
      const completed = manager.completeTask(task.id, { result: 'success' });
      expect(completed?.status).toBe(TaskStatus.COMPLETED);
      expect(completed?.result).toEqual({ result: 'success' });
      expect(completed?.completedAt).toBeDefined();
    });

    it('应该抛出错误当任务不在运行中', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      
      expect(() => {
        manager.completeTask(task.id);
      }).toThrow();
    });
  });

  describe('failTask', () => {
    it('应该标记任务失败', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      manager.startTask(task.id);
      
      const failed = manager.failTask(task.id, 'Something went wrong');
      expect(failed?.status).toBe(TaskStatus.FAILED);
      expect(failed?.error).toBe('Something went wrong');
    });
  });

  describe('getAvailableTransitions', () => {
    it('应该返回可用状态转换', () => {
      const task = manager.createTask({ userId: 'user_1', channel: 'feishu', message: 'test' });
      
      const transitions = manager.getAvailableTransitions(task.id);
      expect(transitions).toContain(TaskStatus.RUNNING);
    });

    it('应该返回空数组当任务不存在', () => {
      const transitions = manager.getAvailableTransitions('nonexistent');
      expect(transitions).toHaveLength(0);
    });
  });
});
