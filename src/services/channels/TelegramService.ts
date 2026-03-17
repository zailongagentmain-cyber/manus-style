/**
 * Telegram Service
 * 
 * 实现 Telegram 消息推送服务
 */

import {
  ChannelService,
  RichMessage,
  InteractiveMessage,
  ChannelCallback,
  SendResult,
  ChannelConfig,
} from './ChannelService';

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown';
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  login_url?: {
    url: string;
    forward_text?: string;
    bot_username?: string;
    request_write_access?: boolean;
  };
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  callback_game?: object;
  pay?: boolean;
}

interface TelegramCallbackQuery {
  callback_query_id: string;
  chat_instance: string;
  chat?: {
    id: number;
    title: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
  };
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
  from: {
    id: number;
    is_bot: boolean;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  data?: string;
}

/**
 * Telegram Service 实现
 */
export class TelegramService implements ChannelService {
  readonly channelType = 'telegram' as const;

  private botToken: string;
  private retryOptions: ChannelConfig['retryOptions'];
  private apiBaseUrl: string;

  constructor(config: ChannelConfig) {
    if (!config.botToken) {
      throw new Error('Telegram botToken is required');
    }
    this.botToken = config.botToken;
    this.retryOptions = config.retryOptions || {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2,
    };
    this.apiBaseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * 发送纯文本消息
   */
  async sendMessage(
    userId: string,
    message: string,
    parseMode: 'MarkdownV2' | 'HTML' | 'Markdown' = 'MarkdownV2'
  ): Promise<SendResult> {
    try {
      const telegramMessage: TelegramMessage = {
        chat_id: userId,
        text: message,
        parse_mode: parseMode,
      };

      // TODO: 真实 API 调用
      // const response = await this.callTelegramAPI('sendMessage', telegramMessage);

      console.log(`[TelegramService] Sending text to ${userId}: ${message.substring(0, 50)}...`);

      return {
        success: true,
        messageId: this.generateMessageId(),
        channel: 'telegram',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 发送带内联键盘的消息
   */
  async sendInlineKeyboard(
    userId: string,
    message: string,
    keyboard: InlineKeyboardButton[][]
  ): Promise<SendResult> {
    try {
      const telegramMessage: TelegramMessage = {
        chat_id: userId,
        text: message,
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      };

      // TODO: 真实 API 调用
      console.log(`[TelegramService] Sending inline keyboard to ${userId}`);

      return {
        success: true,
        messageId: this.generateMessageId(),
        channel: 'telegram',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 处理回调查询（按钮点击）
   */
  async handleCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<void> {
    console.log(`[TelegramService] Handling callback query:`, callbackQuery);

    // TODO: 实现真实的回调处理逻辑
    // 1. 解析 callback_data
    // 2. 执行相应操作
    // 3. 可选：编辑消息或发送新消息确认操作

    if (callbackQuery.data) {
      console.log(`Callback data: ${callbackQuery.data}`);
      console.log(`User: ${callbackQuery.from.id}, Message: ${callbackQuery.message?.message_id}`);
    }
  }

  /**
   * 处理回调（实现接口）
   */
  async handleCallback(callback: ChannelCallback): Promise<void> {
    // 将通用回调转换为 Telegram 格式
    const telegramCallback: TelegramCallbackQuery = {
      callback_query_id: callback.messageId || '',
      chat_instance: '',
      from: {
        id: parseInt(callback.userId),
        is_bot: false,
      },
      data: callback.actionId,
    };

    return this.handleCallbackQuery(telegramCallback);
  }

  /**
   * 发送富文本消息
   */
  async sendRichMessage(userId: string, message: RichMessage): Promise<SendResult> {
    try {
      // 构建格式化文本
      let text = '';

      if (message.title) {
        text += `*${this.escapeMarkdown(message.title)}*\n\n`;
      }

      text += this.escapeMarkdown(message.content);

      if (message.sections) {
        for (const section of message.sections) {
          text += '\n\n';
          if (section.title) {
            text += `*${this.escapeMarkdown(section.title)}*\n`;
          }
          text += this.escapeMarkdown(section.content);

          if (section.fields) {
            for (const field of section.fields) {
              text += `\n• *${this.escapeMarkdown(field.label)}*: ${this.escapeMarkdown(field.value)}`;
            }
          }
        }
      }

      if (message.footer) {
        text += `\n\n_${this.escapeMarkdown(message.footer)}_`;
      }

      return this.sendMessage(userId, text);
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
      // 将动作转换为内联键盘按钮
      const keyboard: InlineKeyboardButton[][] = message.actions
        .filter((action) => action.type === 'button')
        .map((action) => {
          const button: InlineKeyboardButton = {
            text: action.text,
          };

          if (action.url) {
            button.url = action.url;
          } else if (action.actionId) {
            button.callback_data = action.actionId;
          }

          return button;
        })
        .reduce((rows: InlineKeyboardButton[][], button, index) => {
          const rowIndex = Math.floor(index / 2); // 每行2个按钮
          if (!rows[rowIndex]) {
            rows[rowIndex] = [];
          }
          rows[rowIndex].push(button);
          return rows;
        }, []);

      if (keyboard.length > 0) {
        return this.sendInlineKeyboard(userId, message.content, keyboard);
      }

      // 如果没有按钮，降级为普通消息
      return this.sendMessage(userId, message.content);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      // TODO: 调用 Telegram getMe API 验证
      // const me = await this.callTelegramAPI('getMe', {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 发送 Markdown 消息（快捷方法）
   */
  async sendMarkdownMessage(userId: string, markdown: string): Promise<SendResult> {
    return this.sendMessage(userId, markdown, 'MarkdownV2');
  }

  /**
   * 发送 HTML 消息（快捷方法）
   */
  async sendHtmlMessage(userId: string, html: string): Promise<SendResult> {
    return this.sendMessage(userId, html, 'HTML');
  }

  /**
   * 转义 Markdown 特殊字符
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(): string {
    return `tg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown): SendResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[TelegramService] Error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      channel: 'telegram',
    };
  }
}
