/**
 * Agent Client 接口定义
 */

import { AgentType } from '../../types/task';

export interface AgentClient {
  /**
   * 执行任务
   */
  execute(input: string): Promise<any>;

  /**
   * 获取 Agent 类型
   */
  getType(): AgentType;

  /**
   * 获取能力列表
   */
  getCapabilities(): string[];

  /**
   * 获取 Agent 描述
   */
  getDescription(): string;
}
