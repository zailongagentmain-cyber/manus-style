/**
 * Task Storage - JSON 文件存储层
 */

import * as fs from 'fs';
import * as path from 'path';
import { Task, TaskStatus } from '../types/task';

export interface TaskStorageOptions {
  storageDir?: string;
}

export interface TaskQuery {
  userId?: string;
  status?: TaskStatus;
  channel?: string;
  limit?: number;
  offset?: number;
}

export interface TaskQueryResult {
  tasks: Task[];
  total: number;
}

export class TaskStorage {
  private storageDir: string;
  private tasksFile: string;

  constructor(options: TaskStorageOptions = {}) {
    this.storageDir = options.storageDir || path.join(process.cwd(), '.task-data');
    this.tasksFile = path.join(this.storageDir, 'tasks.json');
    this.ensureStorageDir();
  }

  /**
   * 确保存储目录存在
   */
  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    if (!fs.existsSync(this.tasksFile)) {
      fs.writeFileSync(this.tasksFile, JSON.stringify({ tasks: [] }, null, 2));
    }
  }

  /**
   * 读取所有任务
   */
  private readTasks(): Task[] {
    try {
      const data = fs.readFileSync(this.tasksFile, 'utf-8');
      const parsed = JSON.parse(data);
      // 恢复 Date 对象
      return (parsed.tasks || []).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        subtasks: task.subtasks?.map((st: any) => ({
          ...st,
          startedAt: st.startedAt ? new Date(st.startedAt) : undefined,
          completedAt: st.completedAt ? new Date(st.completedAt) : undefined
        })) || []
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * 写入所有任务
   */
  private writeTasks(tasks: Task[]): void {
    fs.writeFileSync(this.tasksFile, JSON.stringify({ tasks }, null, 2));
  }

  /**
   * 创建任务
   */
  create(task: Task): Task {
    const tasks = this.readTasks();
    tasks.push(task);
    this.writeTasks(tasks);
    return task;
  }

  /**
   * 根据 ID 获取任务
   */
  get(id: string): Task | null {
    const tasks = this.readTasks();
    return tasks.find(t => t.id === id) || null;
  }

  /**
   * 更新任务
   */
  update(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.readTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date() };
    this.writeTasks(tasks);
    return tasks[index];
  }

  /**
   * 删除任务
   */
  delete(id: string): boolean {
    const tasks = this.readTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    tasks.splice(index, 1);
    this.writeTasks(tasks);
    return true;
  }

  /**
   * 查询任务
   */
  query(query: TaskQuery): TaskQueryResult {
    let tasks = this.readTasks();

    // 按用户 ID 过滤
    if (query.userId) {
      tasks = tasks.filter(t => t.userId === query.userId);
    }

    // 按状态过滤
    if (query.status) {
      tasks = tasks.filter(t => t.status === query.status);
    }

    // 按渠道过滤
    if (query.channel) {
      tasks = tasks.filter(t => t.channel === query.channel);
    }

    const total = tasks.length;

    // 排序（按创建时间倒序）
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 分页
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    tasks = tasks.slice(offset, offset + limit);

    return { tasks, total };
  }

  /**
   * 列出所有任务
   */
  list(limit?: number, offset?: number): TaskQueryResult {
    return this.query({ limit, offset });
  }

  /**
   * 统计任务数量
   */
  count(): number {
    return this.readTasks().length;
  }

  /**
   * 清理存储（可选）
   */
  clear(): void {
    this.writeTasks([]);
  }
}
