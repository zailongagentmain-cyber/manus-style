/**
 * 龙雅人 (Longyaren) Agent Client
 * 负责长文本分析、推理和规划
 */

import { AgentClient } from './AgentClient';
import { AgentType } from '../../types/task';
import { OpenClawClient } from '../OpenClawClient';

export class LongyarenClient implements AgentClient {
  private openClawClient: OpenClawClient;

  constructor(openClawClient?: OpenClawClient) {
    this.openClawClient = openClawClient || new OpenClawClient();
  }

  async execute(input: string): Promise<any> {
    const result = await this.openClawClient.spawn({
      agent: 'longyaren',
      input,
    });

    if (!result.success) {
      throw new Error(result.error || 'Longyaren execution failed');
    }

    return result.output;
  }

  getType(): AgentType {
    return 'longyaren';
  }

  getCapabilities(): string[] {
    return [
      '长文本分析',
      '逻辑推理',
      '任务规划',
      '需求分析',
      '方案设计',
      '文档撰写',
    ];
  }

  getDescription(): string {
    return '龙雅人 - 长文本分析、推理与规划专家';
  }
}
