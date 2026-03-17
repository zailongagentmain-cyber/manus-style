/**
 * OpenClawClient 单元测试
 */

import { OpenClawClient } from '../../src/agents/OpenClawClient';

describe('OpenClawClient', () => {
  describe('构造函数', () => {
    it('应该使用默认网关 URL 创建客户端', () => {
      const client = new OpenClawClient();
      expect(client).toBeDefined();
    });

    it('应该使用自定义网关 URL 创建客户端', () => {
      const client = new OpenClawClient('https://custom-gateway.com');
      expect(client).toBeDefined();
    });
  });

  describe('generateTaskId', () => {
    it('应该生成唯一的任务 ID', () => {
      const client = new OpenClawClient();
      const id1 = client.generateTaskId();
      const id2 = client.generateTaskId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toEqual(id2);
    });

    it('应该生成符合 UUID 格式的 ID', () => {
      const client = new OpenClawClient();
      const id = client.generateTaskId();

      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('spawn', () => {
    it('应该成功执行 malong agent', async () => {
      const client = new OpenClawClient();
      const result = await client.spawn({
        agent: 'malong',
        input: '写一个函数',
      });

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.duration).toBeDefined();
      expect(result.output).toEqual({
        message: '码龙执行完成',
        result: { code: 'generated', message: '代码已生成' },
      });
    });

    it('应该成功执行 longyaren agent', async () => {
      const client = new OpenClawClient();
      const result = await client.spawn({
        agent: 'longyaren',
        input: '分析数据',
      });

      expect(result.success).toBe(true);
      expect(result.output.message).toBe('龙雅人执行完成');
    });

    it('应该成功执行 search agent', async () => {
      const client = new OpenClawClient();
      const result = await client.spawn({
        agent: 'search',
        input: '搜索 Python 教程',
      });

      expect(result.success).toBe(true);
      expect(result.output.message).toBe('搜索执行完成');
    });

    it('应该成功执行 browser agent', async () => {
      const client = new OpenClawClient();
      const result = await client.spawn({
        agent: 'browser',
        input: '打开 Google',
      });

      expect(result.success).toBe(true);
      expect(result.output.message).toBe('浏览器执行完成');
    });

    it('应该处理未知 agent 类型', async () => {
      const client = new OpenClawClient();
      const result = await client.spawn({
        agent: 'unknown_agent',
        input: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.output.message).toBe('Unknown agent');
    });

    it('应该包含 metadata', async () => {
      const client = new OpenClawClient();
      const result = await client.spawn({
        agent: 'malong',
        input: 'test',
        metadata: { userId: 'user123', channel: 'feishu' },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('应该返回 true 当健康检查成功', async () => {
      const client = new OpenClawClient();
      const result = await client.healthCheck();

      expect(result).toBe(true);
    });
  });
});
