/**
 * LLM 客户端
 * 封装 LLM API 调用，支持 MiniMax 模型和重试机制
 */

import { LLMConfig } from '../types/config';
import { ChatMessage, LLMRequestOptions, LLMResponse } from '../types/planning';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // ms
const DEFAULT_TIMEOUT = 60000; // 60 秒

/**
 * LLM 客户端错误
 */
export class LLMClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'LLMClientError';
  }
}

/**
 * LLM 客户端类
 */
export class LLMClient {
  private config: LLMConfig;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  /**
   * 构造函数
   */
  constructor(
    config: LLMConfig,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      timeout?: number;
    }
  ) {
    this.config = config;
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelay = options?.retryDelay ?? DEFAULT_RETRY_DELAY;
    this.timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  }

  /**
   * 发送聊天请求
   */
  async chat(
    messages: ChatMessage[],
    options?: LLMRequestOptions
  ): Promise<LLMResponse> {
    const model = options?.model ?? this.config.model;
    const temperature = options?.temperature ?? this.config.temperature;
    const maxTokens = options?.max_tokens ?? this.config.max_tokens;

    return this.requestWithRetry({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
  }

  /**
   * 带重试的请求
   */
  private async requestWithRetry(payload: {
    model: string;
    messages: ChatMessage[];
    temperature: number;
    max_tokens: number;
  }): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.makeRequest(payload);
      } catch (error) {
        lastError = error as Error;

        // 如果是客户端错误（4xx），不重试
        if (error instanceof LLMClientError && error.statusCode && error.statusCode < 500) {
          throw error;
        }

        // 如果还有重试次数，等待后重试
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * (attempt + 1)); // 指数退避
        }
      }
    }

    throw lastError;
  }

  /**
   * 发起 HTTP 请求
   */
  private async makeRequest(payload: {
    model: string;
    messages: ChatMessage[];
    temperature: number;
    max_tokens: number;
  }): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.config.base_url}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.api_key}`,
        },
        body: JSON.stringify({
          model: payload.model,
          messages: payload.messages,
          temperature: payload.temperature,
          max_tokens: payload.max_tokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new LLMClientError(
          `LLM API 请求失败: ${response.status} ${response.statusText}`,
          'API_ERROR',
          response.status
        );
      }

      const data = await response.json() as {
        choices?: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      if (!data.choices || data.choices.length === 0) {
        throw new LLMClientError('LLM 响应为空', 'EMPTY_RESPONSE');
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof LLMClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new LLMClientError('请求超时', 'TIMEOUT');
        }
        throw new LLMClientError(`请求失败: ${error.message}`, 'REQUEST_FAILED');
      }

      throw new LLMClientError('未知错误', 'UNKNOWN');
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

export default LLMClient;
