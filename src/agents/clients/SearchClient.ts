/**
 * 搜索 (Search) Agent Client
 * 负责网络搜索和信息检索
 */

import { AgentClient } from './AgentClient';
import { AgentType } from '../../types/task';
import { OpenClawClient } from '../OpenClawClient';

export class SearchClient implements AgentClient {
  private openClawClient: OpenClawClient;

  constructor(openClawClient?: OpenClawClient) {
    this.openClawClient = openClawClient || new OpenClawClient();
  }

  async execute(input: string): Promise<any> {
    const result = await this.openClawClient.spawn({
      agent: 'search',
      input,
    });

    if (!result.success) {
      throw new Error(result.error || 'Search execution failed');
    }

    return result.output;
  }

  getType(): AgentType {
    return 'search';
  }

  getCapabilities(): string[] {
    return [
      '网络搜索',
      '信息检索',
      '新闻聚合',
      '数据采集',
      '内容摘要',
    ];
  }

  getDescription(): string {
    return '搜索 Agent - 网络搜索与信息检索专家';
  }
}
