/**
 * Agent 调度器
 * 负责封装 OpenClaw sessions_spawn，实现任务执行器
 */

import { randomUUID } from 'crypto';
import { Task, Subtask, TaskStatus, AgentType } from '../types/task';
import { OpenClawClient } from './OpenClawClient';
import {
  MalongClient,
  LongyarenClient,
  SearchClient,
  BrowserClient,
  AgentClient,
} from './clients';

export interface ExecutionPlan {
  stages: Subtask[][];
  dependencies: Map<string, string[]>;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  results: Map<string, any>;
  errors: Map<string, string>;
  duration: number;
  summary: string;
}

/**
 * Agent 调度器
 * 负责选择合适的 Agent 并执行任务
 */
export class AgentScheduler {
  private openClawClient: OpenClawClient;
  private agents: Map<AgentType, AgentClient>;

  constructor(openClawClient?: OpenClawClient) {
    this.openClawClient = openClawClient || new OpenClawClient();
    this.agents = new Map();

    // 初始化所有 Agent Clients
    this.registerDefaultAgents();
  }

  /**
   * 注册默认的 Agent Clients
   */
  private registerDefaultAgents(): void {
    this.agents.set('malong', new MalongClient(this.openClawClient));
    this.agents.set('longyaren', new LongyarenClient(this.openClawClient));
    this.agents.set('search', new SearchClient(this.openClawClient));
    this.agents.set('browser', new BrowserClient(this.openClawClient));
  }

  /**
   * 注册自定义 Agent Client
   */
  registerAgent(agentType: AgentType, client: AgentClient): void {
    this.agents.set(agentType, client);
  }

  /**
   * 获取 Agent Client
   */
  getAgent(agentType: AgentType): AgentClient | undefined {
    return this.agents.get(agentType);
  }

  /**
   * 列出所有可用的 Agent
   */
  listAgents(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  /**
   * 调度任务执行
   */
  async schedule(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const results = new Map<string, any>();
    const errors = new Map<string, string>();

    try {
      // 构建执行计划
      const plan = this.buildExecutionPlan(task.subtasks);

      // 根据依赖关系执行
      const executionMode = this.determineExecutionMode(task.subtasks);

      let executionResults: any[];

      if (executionMode === 'parallel') {
        executionResults = await this.executeInParallel(task.subtasks);
      } else {
        executionResults = await this.executeSerially(task.subtasks);
      }

      // 收集结果
      task.subtasks.forEach((subtask, index) => {
        if (executionResults[index]) {
          results.set(subtask.id, executionResults[index]);
          subtask.status = TaskStatus.COMPLETED;
          subtask.output = executionResults[index];
        } else if (errors.has(subtask.id)) {
          subtask.status = TaskStatus.FAILED;
        }
      });

      return {
        taskId: task.id,
        success: errors.size === 0,
        results,
        errors,
        duration: Date.now() - startTime,
        summary: this.summarize(task),
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        results,
        errors,
        duration: Date.now() - startTime,
        summary: `任务执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 执行单个子任务
   */
  async executeSubtask(subtask: Subtask): Promise<any> {
    const agent = this.selectAgent(subtask.agent);

    if (!agent) {
      throw new Error(`Unknown agent type: ${subtask.agent}`);
    }

    try {
      subtask.status = TaskStatus.RUNNING;
      subtask.startedAt = new Date();

      const output = await agent.execute(subtask.input);

      subtask.status = TaskStatus.COMPLETED;
      subtask.completedAt = new Date();
      subtask.output = output;

      return output;
    } catch (error) {
      subtask.status = TaskStatus.FAILED;
      subtask.error = error instanceof Error ? error.message : 'Unknown error';
      subtask.completedAt = new Date();
      throw error;
    }
  }

  /**
   * 选择合适的 Agent
   */
  selectAgent(agentType: AgentType): AgentClient | undefined {
    return this.agents.get(agentType);
  }

  /**
   * 构建执行计划 (DAG)
   */
  buildExecutionPlan(subtasks: Subtask[]): ExecutionPlan {
    const dependencies = new Map<string, string[]>();
    const stages: Subtask[][] = [];

    // 构建依赖图
    subtasks.forEach((subtask) => {
      dependencies.set(subtask.id, subtask.dependsOn);
    });

    // 拓扑排序分组
    const completed = new Set<string>();
    let remaining = [...subtasks];

    while (remaining.length > 0) {
      const currentStage: Subtask[] = [];

      // 找出所有依赖都已完成的子任务
      for (const subtask of remaining) {
        const deps = dependencies.get(subtask.id) || [];
        const canExecute = deps.every((dep) => completed.has(dep));

        if (canExecute) {
          currentStage.push(subtask);
        }
      }

      if (currentStage.length === 0 && remaining.length > 0) {
        // 存在循环依赖，选择第一个继续
        currentStage.push(remaining[0]);
      }

      stages.push(currentStage);
      currentStage.forEach((st) => completed.add(st.id));
      remaining = remaining.filter((st) => !currentStage.includes(st));
    }

    return { stages, dependencies };
  }

  /**
   * 确定执行模式
   */
  private determineExecutionMode(subtasks: Subtask[]): 'serial' | 'parallel' {
    // 检查是否有依赖关系
    const hasDependencies = subtasks.some((st) => st.dependsOn.length > 0);

    // 如果有依赖关系，串行执行；否则可以并行
    return hasDependencies ? 'serial' : 'parallel';
  }

  /**
   * 串行执行
   */
  async executeSerially(subtasks: Subtask[]): Promise<any[]> {
    const results: any[] = [];

    for (const subtask of subtasks) {
      try {
        const result = await this.executeSubtask(subtask);
        results.push(result);
      } catch (error) {
        results.push(null);
        // 可以选择在这里停止或继续
      }
    }

    return results;
  }

  /**
   * 并行执行
   */
  async executeInParallel(subtasks: Subtask[]): Promise<any[]> {
    const promises = subtasks.map(async (subtask) => {
      try {
        return await this.executeSubtask(subtask);
      } catch (error) {
        return null;
      }
    });

    return Promise.all(promises);
  }

  /**
   * 汇总结果
   */
  summarize(task: Task): string {
    const completed = task.subtasks.filter(
      (st) => st.status === TaskStatus.COMPLETED
    ).length;
    const failed = task.subtasks.filter(
      (st) => st.status === TaskStatus.FAILED
    ).length;
    const total = task.subtasks.length;

    if (failed === 0) {
      return `任务完成: ${completed}/${total} 个子任务成功`;
    } else {
      return `任务部分完成: ${completed} 成功, ${failed} 失败`;
    }
  }
}

/**
 * 创建默认的 AgentScheduler 实例
 */
export const agentScheduler = new AgentScheduler();
