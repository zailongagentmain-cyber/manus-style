/**
 * LLMClient 单元测试
 */

import { LLMClient, LLMClientError } from '../../src/agents/LLMClient';
import { LLMConfig } from '../../src/types/config';
import { ChatMessage } from '../../src/types/planning';

// Mock fetch
global.fetch = jest.fn();

describe('LLMClient', () => {
  const mockConfig: LLMConfig = {
    model: 'abab6.5s-chat',
    base_url: 'https://api.minimax.chat',
    api_key: 'test-api-key',
    max_tokens: 1000,
    temperature: 0.7,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('构造函数', () => {
    it('应该使用默认选项创建客户端', () => {
      const client = new LLMClient(mockConfig);
      expect(client).toBeDefined();
    });

    it('应该使用自定义选项创建客户端', () => {
      const client = new LLMClient(mockConfig, {
        maxRetries: 5,
        retryDelay: 2000,
        timeout: 30000,
      });
      expect(client).toBeDefined();
    });
  });

  describe('chat', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'user', content: 'Hello' }
    ];

    it('应该发送聊天请求并返回响应', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Hello!' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new LLMClient(mockConfig);
      const result = await client.chat(mockMessages);

      expect(result.content).toBe('Hello!');
      expect(result.usage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      });
    });

    it('应该使用自定义选项', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new LLMClient(mockConfig);
      await client.chat(mockMessages, {
        model: 'custom-model',
        temperature: 0.5,
        max_tokens: 500,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('text/chatcompletion_v2'),
        expect.objectContaining({
          body: expect.stringContaining('"model":"custom-model"'),
        })
      );
    });

    it('应该在 API 错误时抛出 LLMClientError', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      const client = new LLMClient(mockConfig);

      await expect(client.chat(mockMessages)).rejects.toThrow(LLMClientError);
    });

    it('应该在空响应时抛出错误', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      const client = new LLMClient(mockConfig);

      await expect(client.chat(mockMessages)).rejects.toThrow('LLM 响应为空');
    });
  });

  describe('重试机制', () => {
    it('应该在请求失败时重试', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Success' } }],
      };

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const client = new LLMClient(mockConfig, { maxRetries: 3, retryDelay: 10 });
      const result = await client.chat([{ role: 'user', content: 'test' }]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('Success');
    });

    it('不应该在 4xx 错误时重试', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Bad request',
      });

      const client = new LLMClient(mockConfig, { maxRetries: 3, retryDelay: 10 });

      await expect(client.chat([{ role: 'user', content: 'test' }])).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('应该在达到最大重试次数后放弃', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const client = new LLMClient(mockConfig, { maxRetries: 3, retryDelay: 10 });

      await expect(client.chat([{ role: 'user', content: 'test' }])).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('超时处理', () => {
    it('应该在超时时抛出错误', async () => {
      // 模拟 fetch 返回一个会超时的 promise
      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          // 等待超时触发
          await new Promise((_, reject) => setTimeout(() => reject(abortError), 10));
          return { choices: [] };
        },
      });

      const client = new LLMClient(mockConfig, { timeout: 50 });

      await expect(client.chat([{ role: 'user', content: 'test' }])).rejects.toThrow();
    });
  });

  describe('updateConfig', () => {
    it('应该更新配置', () => {
      const client = new LLMClient(mockConfig);
      client.updateConfig({ temperature: 0.9 });
      
      const config = client.getConfig();
      expect(config.temperature).toBe(0.9);
      expect(config.model).toBe(mockConfig.model);
    });
  });

  describe('getConfig', () => {
    it('应该返回配置副本', () => {
      const client = new LLMClient(mockConfig);
      const config = client.getConfig();
      
      expect(config).toEqual(mockConfig);
      expect(config).not.toBe(mockConfig);
    });
  });

  describe('LLMClientError', () => {
    it('应该创建带有 code 和 statusCode 的错误', () => {
      const error = new LLMClientError('Test error', 'TEST_CODE', 500);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('LLMClientError');
    });
  });
});
