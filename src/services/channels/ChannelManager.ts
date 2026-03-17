/**
 * Channel Manager
 * 
 * 统一管理多个消息渠道，自动选择合适的渠道发送消息
 */

import {
  ChannelService,
  ChannelType,
  ChannelConfig,
  SendResult,
  RichMessage,
  InteractiveMessage,
  MessageOptions,
  RetryOptions,
} from './ChannelService';
import { FeishuService } from './FeishuService';
import { WhatsAppService } from './WhatsAppService';
import { TelegramService } from './TelegramService';

interface ChannelEntry {
  service: ChannelService;
  config: ChannelConfig;
}

/**
 * Channel Manager
 * 
 * 提供统一的渠道管理，支持：
 * - 多渠道注册
 * - 自动选择可用渠道
 * - 失败自动重试
 * - 优先级配置
 */
export class ChannelManager {
  private channels: Map<ChannelType, ChannelEntry> = new Map();
  private defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
  };

  constructor(configs?: ChannelConfig[]) {
    if (configs) {
      for (const config of configs) {
        this.registerChannel(config);
      }
    }
  }

  /**
   * 注册渠道服务
   */
  registerChannel(config: ChannelConfig): void {
    if (!config.enabled) {
      console.log(`[ChannelManager] Channel ${config.type} is disabled, skipping...`);
      return;
    }

    let service: ChannelService;

    switch (config.type) {
      case 'feishu':
        service = new FeishuService(config);
        break;
      case 'whatsapp':
        service = new WhatsAppService(config);
        break;
      case 'telegram':
        service = new TelegramService(config);
        break;
      default:
        throw new Error(`Unknown channel type: ${config.type}`);
    }

    this.channels.set(config.type, {
      service,
      config,
    });

    console.log(`[ChannelManager] Registered channel: ${config.type}`);
  }

  /**
   * 注销渠道服务
   */
  unregisterChannel(channelType: ChannelType): boolean {
    const removed = this.channels.delete(channelType);
    if (removed) {
      console.log(`[ChannelManager] Unregistered channel: ${channelType}`);
    }
    return removed;
  }

  /**
   * 获取渠道服务
   */
  getChannel(channelType: ChannelType): ChannelService | undefined {
    return this.channels.get(channelType)?.service;
  }

  /**
   * 获取所有已注册的渠道类型
   */
  getRegisteredChannels(): ChannelType[] {
    return Array.from(this.channels.keys());
  }

  /**
   * 发送消息（自动选择渠道）
   * 
   * @param userId 用户ID
   * @param message 消息内容
   * @param options 发送选项
   */
  async sendMessage(
    userId: string,
    message: string,
    options?: MessageOptions
  ): Promise<SendResult> {
    const channels = this.getChannelsInPriority(options?.channel, options?.priority);

    if (channels.length === 0) {
      return {
        success: false,
        error: 'No available channels',
        channel: 'feishu' as ChannelType, // 默认值
      };
    }

    const retryOptions = options?.retryOnFailure !== false
      ? this.defaultRetryOptions
      : { maxRetries: 0, retryDelayMs: 0, backoffMultiplier: 1 };

    return this.sendWithRetry(channels, userId, message, retryOptions);
  }

  /**
   * 发送富文本消息
   */
  async sendRichMessage(
    userId: string,
    message: RichMessage,
    options?: MessageOptions
  ): Promise<SendResult> {
    const channels = this.getChannelsInPriority(options?.channel, options?.priority);

    if (channels.length === 0) {
      return {
        success: false,
        error: 'No available channels',
        channel: 'feishu' as ChannelType,
      };
    }

    const retryOptions = options?.retryOnFailure !== false
      ? this.defaultRetryOptions
      : { maxRetries: 0, retryDelayMs: 0, backoffMultiplier: 1 };

    return this.sendRichWithRetry(channels, userId, message, retryOptions);
  }

  /**
   * 发送交互式消息
   */
  async sendInteractiveMessage(
    userId: string,
    message: InteractiveMessage,
    options?: MessageOptions
  ): Promise<SendResult> {
    const channels = this.getChannelsInPriority(options?.channel, options?.priority);

    if (channels.length === 0) {
      return {
        success: false,
        error: 'No available channels',
        channel: 'feishu' as ChannelType,
      };
    }

    const retryOptions = options?.retryOnFailure !== false
      ? this.defaultRetryOptions
      : { maxRetries: 0, retryDelayMs: 0, backoffMultiplier: 1 };

    return this.sendInteractiveWithRetry(channels, userId, message, retryOptions);
  }

  /**
   * 处理回调
   */
  async handleCallback(
    channelType: ChannelType,
    callback: Parameters<ChannelService['handleCallback']>[0]
  ): Promise<void> {
    const channel = this.channels.get(channelType);
    if (!channel) {
      throw new Error(`Channel not registered: ${channelType}`);
    }

    return channel.service.handleCallback(callback);
  }

  /**
   * 检查所有渠道可用性
   */
  async checkAllChannels(): Promise<Map<ChannelType, boolean>> {
    const results = new Map<ChannelType, boolean>();

    for (const [type, entry] of this.channels.entries()) {
      try {
        const available = await entry.service.isAvailable();
        results.set(type, available);
      } catch (error) {
        console.error(`[ChannelManager] Error checking channel ${type}:`, error);
        results.set(type, false);
      }
    }

    return results;
  }

  /**
   * 获取按优先级排序的渠道列表
   */
  private getChannelsInPriority(
    preferredChannel?: ChannelType,
    priority?: number
  ): ChannelEntry[] {
    const entries = Array.from(this.channels.values());

    // 按优先级排序
    entries.sort((a, b) => {
      const priorityA = a.config.priority ?? 0;
      const priorityB = b.config.priority ?? 0;
      return priorityB - priorityA;
    });

    // 如果指定了首选渠道，将其移到前面
    if (preferredChannel) {
      const preferred = entries.findIndex((e) => e.config.type === preferredChannel);
      if (preferred > 0) {
        const [item] = entries.splice(preferred, 1);
        entries.unshift(item);
      }
    }

    // 过滤并返回指定优先级的渠道
    if (priority !== undefined) {
      return entries.filter((e) => (e.config.priority ?? 0) >= priority);
    }

    return entries;
  }

  /**
   * 发送消息（带重试）
   */
  private async sendWithRetry(
    channels: ChannelEntry[],
    userId: string,
    message: string,
    retryOptions: RetryOptions
  ): Promise<SendResult> {
    let lastError: SendResult | null = null;

    for (const entry of channels) {
      for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
        try {
          const result = await entry.service.sendMessage(userId, message);

          if (result.success) {
            return result;
          }

          lastError = result;

          // 如果失败，等待后重试
          if (attempt < retryOptions.maxRetries) {
            await this.delay(
              retryOptions.retryDelayMs * Math.pow(retryOptions.backoffMultiplier, attempt)
            );
          }
        } catch (error) {
          lastError = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            channel: entry.config.type,
          };

          if (attempt < retryOptions.maxRetries) {
            await this.delay(
              retryOptions.retryDelayMs * Math.pow(retryOptions.backoffMultiplier, attempt)
            );
          }
        }
      }
    }

    return (
      lastError || {
        success: false,
        error: 'All channels failed',
        channel: 'feishu' as ChannelType,
      }
    );
  }

  /**
   * 发送富文本消息（带重试）
   */
  private async sendRichWithRetry(
    channels: ChannelEntry[],
    userId: string,
    message: RichMessage,
    retryOptions: RetryOptions
  ): Promise<SendResult> {
    let lastError: SendResult | null = null;

    for (const entry of channels) {
      for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
        try {
          const result = await entry.service.sendRichMessage(userId, message);

          if (result.success) {
            return result;
          }

          lastError = result;

          if (attempt < retryOptions.maxRetries) {
            await this.delay(
              retryOptions.retryDelayMs * Math.pow(retryOptions.backoffMultiplier, attempt)
            );
          }
        } catch (error) {
          lastError = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            channel: entry.config.type,
          };

          if (attempt < retryOptions.maxRetries) {
            await this.delay(
              retryOptions.retryDelayMs * Math.pow(retryOptions.backoffMultiplier, attempt)
            );
          }
        }
      }
    }

    return (
      lastError || {
        success: false,
        error: 'All channels failed',
        channel: 'feishu' as ChannelType,
      }
    );
  }

  /**
   * 发送交互式消息（带重试）
   */
  private async sendInteractiveWithRetry(
    channels: ChannelEntry[],
    userId: string,
    message: InteractiveMessage,
    retryOptions: RetryOptions
  ): Promise<SendResult> {
    let lastError: SendResult | null = null;

    for (const entry of channels) {
      for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
        try {
          const result = await entry.service.sendInteractiveMessage(userId, message);

          if (result.success) {
            return result;
          }

          lastError = result;

          if (attempt < retryOptions.maxRetries) {
            await this.delay(
              retryOptions.retryDelayMs * Math.pow(retryOptions.backoffMultiplier, attempt)
            );
          }
        } catch (error) {
          lastError = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            channel: entry.config.type,
          };

          if (attempt < retryOptions.maxRetries) {
            await this.delay(
              retryOptions.retryDelayMs * Math.pow(retryOptions.backoffMultiplier, attempt)
            );
          }
        }
      }
    }

    return (
      lastError || {
        success: false,
        error: 'All channels failed',
        channel: 'feishu' as ChannelType,
      }
    );
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 设置默认重试选项
   */
  setDefaultRetryOptions(options: RetryOptions): void {
    this.defaultRetryOptions = options;
  }
}

// 导出单例实例创建函数
export function createChannelManager(configs?: ChannelConfig[]): ChannelManager {
  return new ChannelManager(configs);
}
