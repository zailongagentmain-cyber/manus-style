import { test, expect, jest } from '@jest/globals';
import { ChannelService, ChannelType, RichMessage, SendResult } from '../../src/services/channels/ChannelService';

/**
 * Channel Service Mock 实现
 * 用于测试
 */
class MockChannelService implements ChannelService {
  readonly channelType: ChannelType = 'feishu';
  private sentMessages: Array<{ userId: string; message: string }> = [];
  private available = true;

  async sendMessage(userId: string, message: string): Promise<SendResult> {
    this.sentMessages.push({ userId, message });
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
      channel: this.channelType,
    };
  }

  async sendRichMessage(userId: string, message: RichMessage): Promise<SendResult> {
    this.sentMessages.push({ userId, message: message.content });
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
      channel: this.channelType,
    };
  }

  async sendInteractiveMessage(
    userId: string,
    message: { title?: string; content: string; actions: unknown[] }
  ): Promise<SendResult> {
    this.sentMessages.push({ userId, message: message.content });
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
      channel: this.channelType,
    };
  }

  async handleCallback(callback: unknown): Promise<void> {
    console.log('Callback handled:', callback);
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  getSentMessages() {
    return this.sentMessages;
  }

  setAvailable(available: boolean) {
    this.available = available;
  }
}

/**
 * E2E 测试 - Channel 通知
 * 
 * 测试消息推送功能：
 * 1. 发送文本消息
 * 2. 发送富文本消息
 * 3. 渠道可用性检查
 */
describe('Channel Service', () => {
  let channelService: MockChannelService;

  beforeEach(() => {
    channelService = new MockChannelService();
  });

  test('应该能够发送文本消息', async () => {
    const result = await channelService.sendMessage('user123', 'Hello World');
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.channel).toBe('feishu');
    
    const messages = channelService.getSentMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe('Hello World');
  });

  test('应该能够发送富文本消息', async () => {
    const richMessage: RichMessage = {
      title: '任务完成通知',
      content: '您的任务已完成',
      sections: [
        {
          title: '任务详情',
          content: '分析 AAPL 股票走势',
          fields: [
            { label: '状态', value: '已完成' },
            { label: '耗时', value: '30秒' },
          ],
        },
      ],
    };

    const result = await channelService.sendRichMessage('user123', richMessage);
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    
    const messages = channelService.getSentMessages();
    expect(messages[0].message).toBe('您的任务已完成');
  });

  test('渠道可用时 isAvailable 返回 true', async () => {
    const available = await channelService.isAvailable();
    expect(available).toBe(true);
  });

  test('渠道不可用时 isAvailable 返回 false', async () => {
    channelService.setAvailable(false);
    const available = await channelService.isAvailable();
    expect(available).toBe(false);
  });

  test('应该记录所有发送的消息', async () => {
    await channelService.sendMessage('user1', 'Message 1');
    await channelService.sendMessage('user2', 'Message 2');
    await channelService.sendMessage('user1', 'Message 3');
    
    const messages = channelService.getSentMessages();
    expect(messages).toHaveLength(3);
    expect(messages[0].userId).toBe('user1');
    expect(messages[1].userId).toBe('user2');
    expect(messages[2].userId).toBe('user1');
  });
});
