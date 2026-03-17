/**
 * Channel Service Interface
 * 
 * 定义消息推送服务的统一接口，支持多种渠道（Feishu、WhatsApp、Telegram）
 */

// 富消息类型
export interface RichMessage {
  title?: string;
  content: string;
  sections?: RichMessageSection[];
  images?: RichImage[];
  footer?: string;
}

// 富消息区块
export interface RichMessageSection {
  title?: string;
  content: string;
  fields?: { label: string; value: string }[];
}

// 图片
export interface RichImage {
  url: string;
  alt?: string;
}

// 交互消息（包含按钮等）
export interface InteractiveMessage {
  title?: string;
  content: string;
  actions: InteractiveAction[];
  fallback?: string;
}

// 交互动作
export interface InteractiveAction {
  type: 'button' | 'link';
  text: string;
  url?: string;
  actionId?: string;
  value?: string;
  style?: 'primary' | 'default' | 'danger';
}

// 回调数据
export interface ChannelCallback {
  type: 'action' | 'query' | 'select';
  userId: string;
  messageId?: string;
  actionId?: string;
  value?: string;
  data?: Record<string, unknown>;
}

// 渠道类型
export type ChannelType = 'feishu' | 'whatsapp' | 'telegram';

// 发送结果
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  channel: ChannelType;
}

/**
 * Channel Service 接口
 * 所有渠道服务必须实现此接口
 */
export interface ChannelService {
  /** 渠道类型 */
  readonly channelType: ChannelType;

  /**
   * 发送纯文本消息
   * @param userId 用户ID（渠道相关格式）
   * @param message 消息内容
   */
  sendMessage(userId: string, message: string): Promise<SendResult>;

  /**
   * 发送富文本消息
   * @param userId 用户ID
   * @param message 富消息对象
   */
  sendRichMessage(userId: string, message: RichMessage): Promise<SendResult>;

  /**
   * 发送交互式消息（包含按钮等）
   * @param userId 用户ID
   * @param message 交互消息对象
   */
  sendInteractiveMessage(
    userId: string,
    message: InteractiveMessage
  ): Promise<SendResult>;

  /**
   * 处理回调（按钮点击、选择等）
   * @param callback 回调数据
   */
  handleCallback(callback: ChannelCallback): Promise<void>;

  /**
   * 检查渠道是否可用
   */
  isAvailable(): Promise<boolean>;
}

/**
 * 渠道服务工厂函数类型
 */
export type ChannelServiceFactory = (
  config: ChannelConfig
) => ChannelService;

// 渠道配置
export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  priority?: number;
  // Feishu 配置
  appId?: string;
  appSecret?: string;
  verificationToken?: string;
  // WhatsApp 配置
  phoneNumberId?: string;
  accessToken?: string;
  // Telegram 配置
  botToken?: string;
  // 通用重试配置
  retryOptions?: RetryOptions;
}

// 重试选项
export interface RetryOptions {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

// 消息选项
export interface MessageOptions {
  channel?: ChannelType;
  priority?: number;
  retryOnFailure?: boolean;
  metadata?: Record<string, unknown>;
}
