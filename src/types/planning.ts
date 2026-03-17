/**
 * Planning 任务规划类型定义
 */

import { AgentType } from './task';

/**
 * 单个子任务规划
 */
export interface SubtaskPlan {
  id: string;
  description: string;
  agent: AgentType;
  input: string;
  depends_on: string[];
  expected_output: string;
}

/**
 * 完整的任务规划响应
 */
export interface PlanningResponse {
  subtasks: SubtaskPlan[];
  execution_order: 'serial' | 'parallel';
  summary: string;
}

/**
 * 子任务验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * LLM 聊天消息
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM 请求选项
 */
export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * LLM 响应
 */
export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
