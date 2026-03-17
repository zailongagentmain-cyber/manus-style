/**
 * 浏览器 (Browser) Agent Client
 * 负责浏览器自动化操作
 */

import { AgentClient } from './AgentClient';
import { AgentType } from '../../types/task';
import { OpenClawClient } from '../OpenClawClient';

export class BrowserClient implements AgentClient {
  private openClawClient: OpenClawClient;

  constructor(openClawClient?: OpenClawClient) {
    this.openClawClient = openClawClient || new OpenClawClient();
  }

  async execute(input: string): Promise<any> {
    const result = await this.openClawClient.spawn({
      agent: 'browser',
      input,
    });

    if (!result.success) {
      throw new Error(result.error || 'Browser execution failed');
    }

    return result.output;
  }

  getType(): AgentType {
    return 'browser';
  }

  getCapabilities(): string[] {
    return [
      '网页自动化',
      '表单填写',
      '数据抓取',
      '截图',
      '点击交互',
      '页面导航',
    ];
  }

  getDescription(): string {
    return '浏览器 Agent - 浏览器自动化操作专家';
  }
}
