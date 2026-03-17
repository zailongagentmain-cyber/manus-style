/**
 * 码龙 (Malong) Agent Client
 * 专攻代码实现的 AI 程序员助手
 */

import { AgentClient } from './AgentClient';
import { AgentType } from '../../types/task';
import { OpenClawClient } from '../OpenClawClient';

export class MalongClient implements AgentClient {
  private openClawClient: OpenClawClient;

  constructor(openClawClient?: OpenClawClient) {
    this.openClawClient = openClawClient || new OpenClawClient();
  }

  async execute(input: string): Promise<any> {
    const result = await this.openClawClient.spawn({
      agent: 'malong',
      input,
    });

    if (!result.success) {
      throw new Error(result.error || 'Malong execution failed');
    }

    return result.output;
  }

  getType(): AgentType {
    return 'malong';
  }

  getCapabilities(): string[] {
    return [
      'Python 开发',
      '数据处理',
      '算法实现',
      'API 调用',
      'Web 开发',
      '代码调试',
      '代码优化',
    ];
  }

  getDescription(): string {
    return '码龙 - 技术开发主理人，专攻代码实现';
  }
}
