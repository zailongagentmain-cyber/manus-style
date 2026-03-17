/**
 * WhatsApp Service
 * 
 * 实现 WhatsApp 消息推送服务
 */

import {
  ChannelService,
  RichMessage,
  InteractiveMessage,
  ChannelCallback,
  SendResult,
  ChannelConfig,
} from './ChannelService';

interface WhatsAppTextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
    preview_url?: boolean;
  };
}

interface WhatsAppMediaMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'image' | 'audio' | 'video' | 'document';
  image?: { link: string; caption?: string };
  audio?: { link: string };
  video?: { link: string; caption?: string };
  document?: { link: string; caption?: string; filename?: string };
}

interface WhatsAppButtonsMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button' | 'list';
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
}

/**
 * WhatsApp Service 实现
 */
export class WhatsAppService implements ChannelService {
  readonly channelType = 'whatsapp' as const;

  private phoneNumberId: string;
  private accessToken: string;
  private retryOptions: ChannelConfig['retryOptions'];

  constructor(config: ChannelConfig) {
    if (!config.phoneNumberId || !config.accessToken) {
      throw new Error('WhatsApp phoneNumberId and accessToken are required');
    }
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
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
      const whatsappMessage: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: userId,
        type: 'text',
        text: {
          body: message,
        },
      };

      // TODO: 真实 API 调用 - WhatsApp Cloud API
      // const response = await this.callWhatsAppAPI(`/${this.phoneNumberId}/messages`, whatsappMessage);

      console.log(`[WhatsAppService] Sending text to ${userId}: ${message}`);

      return {
        success: true,
        messageId: this.generateMessageId(),
        channel: 'whatsapp',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 发送媒体消息（图片、音频、视频、文档）
   */
  async sendMedia(
    userId: string,
    mediaType: 'image' | 'audio' | 'video' | 'document',
    mediaUrl: string,
    caption?: string,
    filename?: string
  ): Promise<SendResult> {
    try {
      const mediaMessage: WhatsAppMediaMessage = {
        messaging_product: 'whatsapp',
        to: userId,
        type: mediaType,
        ...this.buildMediaContent(mediaType, mediaUrl, caption, filename),
      };

      // TODO: 真实 API 调用
      console.log(`[WhatsAppService] Sending ${mediaType} to ${userId}`);

      return {
        success: true,
        messageId: this.generateMessageId(),
        channel: 'whatsapp',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 发送按钮消息（交互式）
   */
  async sendButtons(
    userId: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    footer?: string
  ): Promise<SendResult> {
    try {
      const buttonsMessage: WhatsAppButtonsMessage = {
        messaging_product: 'whatsapp',
        to: userId,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText,
          },
          footer: footer ? { text: footer } : undefined,
          action: {
            buttons: buttons.map((btn) => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title.substring(0, 20), // WhatsApp 按钮标题最长20字符
              },
            })),
          },
        },
      };

      // TODO: 真实 API 调用
      console.log(`[WhatsAppService] Sending buttons to ${userId}`);

      return {
        success: true,
        messageId: this.generateMessageId(),
        channel: 'whatsapp',
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
      // WhatsApp 不支持富文本卡片，使用纯文本 + 媒体
      let content = message.title ? `*${message.title}*\n\n` : '';
      content += message.content;

      if (message.sections) {
        for (const section of message.sections) {
          if (section.title) {
            content += `\n\n*${section.title}*\n`;
          }
          content += section.content;
          if (section.fields) {
            for (const field of section.fields) {
              content += `\n${field.label}: ${field.value}`;
            }
          }
        }
      }

      if (message.footer) {
        content += `\n\n_${message.footer}_`;
      }

      return this.sendMessage(userId, content);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 发送交互式消息
   */
  async sendInteractiveMessage(
    userId: string,
    message: InteractiveMessage
  ): Promise<SendResult> {
    try {
      const buttons = message.actions
        .filter((action) => action.type === 'button')
        .map((action) => ({
          id: action.actionId || action.value || Math.random().toString(36),
          title: action.text.substring(0, 20),
        }));

      if (buttons.length > 0) {
        return this.sendButtons(userId, message.content, buttons);
      }

      // 如果没有按钮，降级为普通消息
      return this.sendMessage(userId, message.content);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 处理回调（按钮点击）
   */
  async handleCallback(callback: ChannelCallback): Promise<void> {
    console.log(`[WhatsAppService] Handling callback:`, callback);

    // TODO: 实现真实的回调处理逻辑
    // WhatsApp 使用 webhook 接收按钮点击回调
    if (callback.type === 'action' && callback.actionId) {
      // 处理按钮点击
      console.log(`Action triggered: ${callback.actionId}, value: ${callback.value}`);
    }
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    // TODO: 实现真实的可用性检查
    return true;
  }

  /**
   * 构建媒体内容
   */
  private buildMediaContent(
    mediaType: 'image' | 'audio' | 'video' | 'document',
    mediaUrl: string,
    caption?: string,
    filename?: string
  ): WhatsAppMediaMessage['image' | 'audio' | 'video' | 'document'] {
    switch (mediaType) {
      case 'image':
        return { link: mediaUrl, caption };
      case 'audio':
        return { link: mediaUrl };
      case 'video':
        return { link: mediaUrl, caption };
      case 'document':
        return { link: mediaUrl, caption, filename };
      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(): string {
    return `wamid.${Date.now()}${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown): SendResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WhatsAppService] Error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      channel: 'whatsapp',
    };
  }
}
