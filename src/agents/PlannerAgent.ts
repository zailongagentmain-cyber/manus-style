/**
 * Planner Agent
 * 负责将用户需求拆解为可执行的子任务
 */

import { ConfigLoader } from '../core/ConfigLoader';
import { LLMClient, LLMClientError } from './LLMClient';
import {
  PLANNING_SYSTEM_PROMPT,
  generatePlanningPrompt,
} from './prompts/planning';
import {
  PlanningResponse,
  SubtaskPlan,
  ChatMessage,
  ValidationResult,
} from '../types/planning';
import { Subtask, TaskStatus, AgentType } from '../types/task';

/**
 * Planner Agent 配置
 */
export interface PlannerConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Planner Agent 错误
 */
export class PlannerError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PlannerError';
  }
}

/**
 * Planner Agent 类
 */
export class PlannerAgent {
  private llmClient: LLMClient;
  private maxRetries: number;

  /**
   * 构造函数
   */
  constructor(config?: PlannerConfig) {
    const configLoader = new ConfigLoader();
    const llmConfig = configLoader.getConfig().llm;

    this.llmClient = new LLMClient(llmConfig, {
      maxRetries: config?.maxRetries ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      timeout: config?.timeout ?? 60000,
    });

    this.maxRetries = config?.maxRetries ?? 3;
  }

  /**
   * 构造函数（使用自定义 LLM 配置）
   */
  static withConfig(llmConfig: ReturnType<ConfigLoader['getConfig']>['llm'], config?: PlannerConfig): PlannerAgent {
    const agent = new PlannerAgent(config);
    agent.llmClient = new LLMClient(llmConfig, {
      maxRetries: config?.maxRetries ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      timeout: config?.timeout ?? 60000,
    });
    return agent;
  }

  /**
   * 分解用户需求为子任务
   */
  async decompose(userRequest: string): Promise<PlanningResponse> {
    if (!userRequest || userRequest.trim().length === 0) {
      throw new PlannerError('用户请求不能为空', 'EMPTY_REQUEST');
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: PLANNING_SYSTEM_PROMPT },
      { role: 'user', content: generatePlanningPrompt(userRequest) },
    ];

    try {
      const response = await this.llmClient.chat(messages);
      return this.parseResponse(response.content);
    } catch (error) {
      if (error instanceof LLMClientError) {
        throw new PlannerError(`LLM 调用失败: ${error.message}`, 'LLM_ERROR');
      }
      throw error;
    }
  }

  /**
   * 解析 LLM 响应
   */
  parseResponse(response: string): PlanningResponse {
    try {
      // 尝试提取 JSON
      const jsonStr = this.extractJson(response);
      const parsed = JSON.parse(jsonStr) as PlanningResponse;

      // 验证基本结构
      if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
        throw new PlannerError('响应缺少 subtasks 字段', 'INVALID_RESPONSE');
      }

      if (!parsed.execution_order) {
        parsed.execution_order = 'serial';
      }

      if (!parsed.summary) {
        parsed.summary = '';
      }

      return parsed;
    } catch (error) {
      if (error instanceof PlannerError) {
        throw error;
      }
      throw new PlannerError(`解析 LLM 响应失败: ${(error as Error).message}`, 'PARSE_ERROR');
    }
  }

  /**
   * 从响应中提取 JSON
   */
  private extractJson(response: string): string {
    // 尝试直接解析
    try {
      JSON.parse(response);
      return response;
    } catch {
      // 继续尝试其他方法
    }

    // 尝试提取 ```json ... ``` 块
    const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // 尝试提取 ``` ... ``` 块
    const anyBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (anyBlockMatch) {
      return anyBlockMatch[1];
    }

    // 尝试提取 { ... }
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    throw new PlannerError('无法从响应中提取 JSON', 'JSON_EXTRACT_ERROR');
  }

  /**
   * 转换为 Subtask 列表
   */
  convertToSubtasks(plan: PlanningResponse, taskId: string): Subtask[] {
    // 创建 ID 映射: step_1 -> task_123_subtask_1
    const idMap = new Map<string, string>();
    plan.subtasks.forEach((subtaskPlan, index) => {
      const newId = `${taskId}_subtask_${index + 1}`;
      idMap.set(subtaskPlan.id, newId);
    });

    return plan.subtasks.map((subtaskPlan, index) => {
      const id = `${taskId}_subtask_${index + 1}`;
      // 转换依赖 ID
      const dependsOn = subtaskPlan.depends_on.map((depId) => idMap.get(depId) || depId);
      return {
        id,
        taskId,
        description: subtaskPlan.description,
        agent: subtaskPlan.agent as AgentType,
        status: TaskStatus.PENDING,
        input: subtaskPlan.input,
        dependsOn,
        expected_output: subtaskPlan.expected_output,
      };
    });
  }

  /**
   * 验证子任务
   */
  validateSubtasks(subtasks: Subtask[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查是否为空
    if (subtasks.length === 0) {
      errors.push('子任务列表不能为空');
      return { valid: false, errors, warnings };
    }

    // 获取所有子任务 ID
    const subtaskIds = new Set(subtasks.map((s) => s.id));

    // 验证每个子任务
    for (const subtask of subtasks) {
      // 检查必填字段
      if (!subtask.id || subtask.id.trim() === '') {
        errors.push(`子任务缺少 id`);
      }

      if (!subtask.description || subtask.description.trim() === '') {
        errors.push(`子任务缺少描述`);
      }

      if (!subtask.agent) {
        errors.push(`子任务 ${subtask.id} 缺少 agent 类型`);
      } else if (!this.isValidAgentType(subtask.agent)) {
        errors.push(`子任务 ${subtask.id} 的 agent 类型无效: ${subtask.agent}`);
      }

      if (!subtask.input || subtask.input.trim() === '') {
        warnings.push(`子任务 ${subtask.id} 的输入为空`);
      }

      // 检查依赖
      for (const depId of subtask.dependsOn) {
        if (!subtaskIds.has(depId)) {
          errors.push(
            `子任务 ${subtask.id} 依赖 ${depId}，但该子任务不存在`
          );
        }
      }
    }

    // 检查循环依赖
    const cycle = this.detectCircularDependency(subtasks);
    if (cycle) {
      errors.push(`检测到循环依赖: ${cycle.join(' -> ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 检查 agent 类型是否有效
   */
  private isValidAgentType(agent: string): agent is AgentType {
    return ['malong', 'longyaren', 'search', 'browser'].includes(agent);
  }

  /**
   * 检测循环依赖
   */
  private detectCircularDependency(subtasks: Subtask[]): string[] | null {
    const graph = new Map<string, string[]>();

    // 构建依赖图
    for (const subtask of subtasks) {
      graph.set(subtask.id, subtask.dependsOn);
    }

    // DFS 检测环
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): string[] | null => {
      if (recursionStack.has(nodeId)) {
        return [...path, nodeId];
      }

      if (visited.has(nodeId)) {
        return null;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependencies = graph.get(nodeId) || [];
      for (const depId of dependencies) {
        const result = dfs(depId, [...path, nodeId]);
        if (result) {
          return result;
        }
      }

      recursionStack.delete(nodeId);
      return null;
    };

    for (const subtask of subtasks) {
      if (!visited.has(subtask.id)) {
        const cycle = dfs(subtask.id, []);
        if (cycle) {
          return cycle;
        }
      }
    }

    return null;
  }

  /**
   * 完整的任务规划流程
   */
  async plan(userRequest: string, taskId: string): Promise<{
    subtasks: Subtask[];
    validation: ValidationResult;
  }> {
    // 1. 分解需求
    const planningResponse = await this.decompose(userRequest);

    // 2. 转换为 Subtask
    const subtasks = this.convertToSubtasks(planningResponse, taskId);

    // 3. 验证子任务
    const validation = this.validateSubtasks(subtasks);

    return {
      subtasks,
      validation,
    };
  }
}

export default PlannerAgent;
