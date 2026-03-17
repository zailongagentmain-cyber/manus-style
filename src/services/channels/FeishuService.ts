/**
 * Feishu Service
 * 
 * 实现飞书消息推送服务
 */

import {
  ChannelService,
  RichMessage,
  InteractiveMessage,
  ChannelCallback,
  SendResult,
  ChannelConfig,
} from './ChannelService';

interface FeishuMessage {
  msg_type: 'text' | 'interactive' | 'post';
  content: {
    text?: string;
    card?: object;
    post?: object;
  };
  uuid?: string;
}

interface FeishuCard {
  config: {
    wide_screen_mode: boolean;
  };
  header: {
    title: {
      tag: 'plain_text';
      content: string;
    };
    template: string;
  };
  elements: Array<{
    tag: 'div' | 'action';
    text?: {
      tag: 'plain_text' | 'lark_md';
      content: string;
    };
    actions?: Array<{
      tag: 'button';
      text: {
        tag: 'plain_text';
        content: string;
      };
      type: 'primary' | 'default' | 'danger';
      url?: string;
      action_id?: string;
      value?: Record<string, unknown>;
    }>;
  }>;
}

/**
 * Feishu Service 实现
 */
export class FeishuService implements ChannelService {
  readonly channelType = 'feishu' as const;

  private appId: string;
  private appSecret: string;
  private verificationToken?: string;
  private accessToken?: string;
  private retryOptions: ChannelConfig['retryOptions'];

  constructor(config: ChannelConfig) {
    if (!config.appId || !config.appSecret) {
      throw new Error('Feishu appId and appSecret are required');
    }
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.verificationToken = config.verificationToken;
    this.retryOptions = config.retryOptions || {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2,
    };
  }

  /**
   * 发送纯文本消息
   */
  async sendMessage(userId: string, message: string): Promise<SendResult> {
    try {
      const feishuMessage: FeishuMessage = {
        msg_type: 'text',
        content: { text: message },
        uuid: this.generateUUID(),
      };

      // TODO: 真实 API 调用 - 使用 OpenClaw Message 工具发送
      // const response = await this.callFeishuAPI('POST', '/open-apis/im/v1/messages', {
      //   receive_id: userId,
      //   msg_type: 'text',
      //   content: JSON.stringify({ text: message }),
      // });

      // 模拟发送成功
      console.log(`[FeishuService] Sending text to ${userId}: ${message}`);
      
      return {
        success: true,
        messageId: this.generateUUID(),
        channel: 'feishu',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 发送卡片消息
   */
  async sendCard(userId: string, card: FeishuCard): Promise<SendResult> {
    try {
      // 模拟发送卡片消息
      console.log(`[FeishuService] Sending card to ${userId}`);
      
      return {
        success: true,
        messageId: this.generateUUID(),
        channel: 'feishu',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 发送富文本消息
   */
  async sendRichMessage(userId: string, message: RichMessage): Promise<SendResult> {
    try {
      // 构建卡片消息
      const card = this.buildRichMessageCard(message);
      return this.sendCard(userId, card);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 发送交互式消息（带按钮）
   */
  async sendInteractiveMessage(
    userId: string,
    message: InteractiveMessage
  ): Promise<SendResult> {
    try {
      const card = this.buildInteractiveCard(message);
      return this.sendCard(userId, card);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 处理按钮回调
   */
  async handleActionCallback(callback: ChannelCallback): Promise<void> {
    console.log(`[FeishuService] Handling action callback:`, callback);
    
    // TODO: 实现真实的回调处理逻辑
    // 根据 actionId 处理不同的动作
    if (callback.actionId) {
      switch (callback.actionId) {
        case 'confirm':
          // 处理确认操作
          break;
        case 'cancel':
          // 处理取消操作
          break;
        default:
          // 处理其他自定义动作
      }
    }
  }

  /**
   * 处理回调（实现接口）
   */
  async handleCallback(callback: ChannelCallback): Promise<void> {
    return this.handleActionCallback(callback);
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    // TODO: 实现真实的可用性检查
    // 可以尝试调用飞书 API 验证凭证
    return true;
  }

  /**
   * 构建富消息卡片
   */
  private buildRichMessageCard(message: RichMessage): FeishuCard {
    const elements: FeishuCard['elements'] = [];

    // 添加内容
    if (message.content) {
      elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: message.content,
        },
      });
    }

    // 添加图片
    if (message.images && message.images.length > 0) {
      for (const img of message.images) {
        elements.push({
          tag: 'div',
          text: {
            tag: 'plain_text',
            content: `[图片: ${img.alt || 'image'}]`,
          },
        });
      }
    }

    return {
      config: {
        wide_screen_mode: true,
      },
      header: {
        title: {
          tag: 'plain_text',
          content: message.title || '通知',
        },
        template: 'blue',
      },
      elements,
    };
  }

  /**
   * 构建交互式卡片
   */
  private buildInteractiveCard(message: InteractiveMessage): FeishuCard {
    const elements: FeishuCard['elements'] = [];

    // 添加内容
    if (message.content) {
      elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: message.content,
        },
      });
    }

    // 添加按钮
    if (message.actions && message.actions.length > 0) {
      const actions = message.actions
        .filter((action) => action.type === 'button')
        .map((action) => ({
          tag: 'button' as const,
          text: {
            tag: 'plain_text' as const,
            content: action.text,
          },
          type: action.style === 'primary' ? 'primary' as const : 'default' as const,
          url: action.url,
          action_id: action.actionId,
          value: action.value ? (() => {
            try {
              return JSON.parse(action.value!);
            } catch {
              return action.value;
            }
          })() : undefined,
        }));

      if (actions.length > 0) {
        elements.push({
          tag: 'action',
          actions,
        });
      }
    }

    return {
      config: {
        wide_screen_mode: true,
      },
      header: {
        title: {
          tag: 'plain_text',
          content: message.title || '交互消息',
        },
        template: 'blue',
      },
      elements,
    };
  }

  /**
   * 生成 UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown): SendResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[FeishuService] Error: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
      channel: 'feishu',
    };
  }
}
