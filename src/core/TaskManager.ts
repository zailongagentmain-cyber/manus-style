/**
 * Task Manager - 任务管理器核心模块
 */

import { randomUUID } from 'crypto';
import { Task, TaskInput, TaskStatus, Subtask } from '../types/task';
import { TaskStateMachine } from './TaskStateMachine';
import { TaskStorage, TaskQuery } from './TaskStorage';

export interface CreateTaskOptions {
  subtasks?: Partial<Subtask>[];
}

export class TaskManager {
  private storage: TaskStorage;

  constructor(storageDir?: string) {
    this.storage = new TaskStorage({ storageDir });
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `task_${Date.now()}_${randomUUID().slice(0, 8)}`;
  }

  /**
   * 创建任务
   */
  createTask(input: TaskInput, options: CreateTaskOptions = {}): Task {
    const now = new Date();
    const taskId = this.generateId();

    // 创建子任务
    const subtasks: Subtask[] = (options.subtasks || []).map((st, index) => ({
      id: `subtask_${taskId}_${index}`,
      taskId,
      description: st.description || '',
      agent: st.agent || 'malong',
      status: TaskStatus.PENDING,
      input: st.input || '',
      output: undefined,
      dependsOn: st.dependsOn || [],
      startedAt: undefined,
      completedAt: undefined,
      error: undefined
    }));

    const task: Task = {
      id: taskId,
      userId: input.userId,
      channel: input.channel,
      input: input.message,
      status: TaskStatus.PENDING,
      currentStep: 0,
      subtasks,
      createdAt: now,
      updatedAt: now,
      completedAt: undefined,
      result: undefined,
      error: undefined,
      metadata: input.metadata || {}
    };

    return this.storage.create(task);
  }

  /**
   * 获取任务
   */
  getTask(id: string): Task | null {
    return this.storage.get(id);
  }

  /**
   * 更新任务
   */
  updateTask(id: string, updates: Partial<Task>): Task | null {
    const task = this.storage.get(id);
    if (!task) return null;

    // 如果更新状态，验证状态转换
    if (updates.status && updates.status !== task.status) {
      try {
        TaskStateMachine.transition(task.status, updates.status);
      } catch (error) {
        throw error;
      }
    }

    return this.storage.update(id, updates);
  }

  /**
   * 列出任务
   */
  listTasks(query: TaskQuery = {}): Task[] {
    const result = this.storage.query(query);
    return result.tasks;
  }

  /**
   * 删除任务
   */
  deleteTask(id: string): boolean {
    return this.storage.delete(id);
  }

  /**
   * 暂停任务
   */
  pauseTask(id: string): Task | null {
    const task = this.storage.get(id);
    if (!task) return null;

    if (task.status !== TaskStatus.RUNNING) {
      throw new Error(`Cannot pause task in status: ${task.status}`);
    }

    return this.storage.update(id, { 
      status: TaskStatus.PAUSED,
      updatedAt: new Date()
    });
  }

  /**
   * 恢复/继续任务
   */
  resumeTask(id: string): Task | null {
    const task = this.storage.get(id);
    if (!task) return null;

    if (task.status !== TaskStatus.PAUSED) {
      throw new Error(`Cannot resume task in status: ${task.status}`);
    }

    return this.storage.update(id, { 
      status: TaskStatus.RUNNING,
      updatedAt: new Date()
    });
  }

  /**
   * 取消任务
   */
  cancelTask(id: string): Task | null {
    const task = this.storage.get(id);
    if (!task) return null;

    if (TaskStateMachine.isFinalStatus(task.status)) {
      throw new Error(`Cannot cancel task in final status: ${task.status}`);
    }

    return this.storage.update(id, { 
      status: TaskStatus.FAILED,
      error: 'Task cancelled by user',
      updatedAt: new Date()
    });
  }

  /**
   * 开始任务
   */
  startTask(id: string): Task | null {
    const task = this.storage.get(id);
    if (!task) return null;

    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.PAUSED) {
      throw new Error(`Cannot start task in status: ${task.status}`);
    }

    return this.storage.update(id, { 
      status: TaskStatus.RUNNING,
      updatedAt: new Date()
    });
  }

  /**
   * 完成任务
   */
  completeTask(id: string, result?: any): Task | null {
    const task = this.storage.get(id);
    if (!task) return null;

    if (task.status !== TaskStatus.RUNNING) {
      throw new Error(`Cannot complete task in status: ${task.status}`);
    }

    return this.storage.update(id, { 
      status: TaskStatus.COMPLETED,
      result,
      completedAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * 标记任务失败
   */
  failTask(id: string, error?: string): Task | null {
    const task = this.storage.get(id);
    if (!task) return null;

    if (TaskStateMachine.isFinalStatus(task.status)) {
      throw new Error(`Cannot fail task in final status: ${task.status}`);
    }

    return this.storage.update(id, { 
      status: TaskStatus.FAILED,
      error,
      completedAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * 获取用户的任务列表
   */
  getUserTasks(userId: string, limit?: number): Task[] {
    return this.listTasks({ userId, limit });
  }

  /**
   * 获取可用状态转换
   */
  getAvailableTransitions(id: string): TaskStatus[] {
    const task = this.storage.get(id);
    if (!task) return [];
    return TaskStateMachine.getAvailableTransitions(task.status);
  }
}
