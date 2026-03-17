/**
 * Task Manager 类型定义
 */

// TaskStatus 枚举
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

// AgentType 类型
export type AgentType = 'malong' | 'longyaren' | 'search' | 'browser';

// Channel 类型
export type Channel = 'web' | 'feishu' | 'whatsapp' | 'telegram';

// Subtask 接口
export interface Subtask {
  id: string;
  taskId: string;
  description: string;
  agent: AgentType;
  status: TaskStatus;
  input: string;
  output?: any;
  dependsOn: string[];
  expected_output?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Task 接口
export interface Task {
  id: string;
  userId: string;
  channel: Channel;
  input: string;
  description?: string;  // 任务描述
  think?: string;        // AI 思考过程
  status: TaskStatus;
  currentStep: number;
  subtasks: Subtask[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  metadata: Record<string, any>;
}

// TaskInput 接口
export interface TaskInput {
  userId: string;
  channel: Channel;
  message: string;
  metadata?: Record<string, any>;
}

// 状态转换类型
export type StateTransition = {
  from: TaskStatus;
  to: TaskStatus;
  allowed: boolean;
};

// 可用的状态转换映射
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.RUNNING, TaskStatus.PAUSED, TaskStatus.FAILED],
  [TaskStatus.RUNNING]: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.PAUSED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.FAILED]: [TaskStatus.PENDING, TaskStatus.RUNNING],
  [TaskStatus.PAUSED]: [TaskStatus.RUNNING, TaskStatus.PENDING, TaskStatus.FAILED]
};
