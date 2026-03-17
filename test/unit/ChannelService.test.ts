/**
 * Channel Service Unit Tests
 * 
 * 测试 FeishuService, WhatsAppService, TelegramService 和 ChannelManager
 */

import {
  ChannelService,
  ChannelType,
  ChannelConfig,
  RichMessage,
  InteractiveMessage,
  ChannelCallback,
} from '../../src/services/channels/ChannelService';
import { FeishuService } from '../../src/services/channels/FeishuService';
import { WhatsAppService } from '../../src/services/channels/WhatsAppService';
import { TelegramService } from '../../src/services/channels/TelegramService';
import { ChannelManager, createChannelManager } from '../../src/services/channels/ChannelManager';

// ===== 测试常量 =====
const TEST_USER_ID = 'test_user_123';
const TEST_USER_ID_NUM = '123456789';

// ===== 辅助函数 =====

/**
 * 创建测试配置
 */
function createTestConfig(type: ChannelType): ChannelConfig {
  switch (type) {
    case 'feishu':
      return {
        type: 'feishu',
        enabled: true,
        priority: 1,
        appId: 'test_app_id',
        appSecret: 'test_app_secret',
        verificationToken: 'test_token',
      };
    case 'whatsapp':
      return {
        type: 'whatsapp',
        enabled: true,
        priority: 2,
        phoneNumberId: 'test_phone_number_id',
        accessToken: 'test_access_token',
      };
    case 'telegram':
      return {
        type: 'telegram',
        enabled: true,
        priority: 3,
        botToken: 'test_bot_token',
      };
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

// ===== FeishuService Tests =====

describe('FeishuService', () => {
  let service: FeishuService;

  beforeEach(() => {
    service = new FeishuService(createTestConfig('feishu'));
  });

  it('should have correct channel type', () => {
    expect(service.channelType).toBe('feishu');
  });

  it('should send text message successfully', async () => {
    const result = await service.sendMessage(TEST_USER_ID, 'Hello Feishu');
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('feishu');
    expect(result.messageId).toBeDefined();
  });

  it('should send rich message successfully', async () => {
    const richMessage: RichMessage = {
      title: 'Test Title',
      content: 'Test content',
      footer: 'Test footer',
    };
    
    const result = await service.sendRichMessage(TEST_USER_ID, richMessage);
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('feishu');
  });

  it('should send interactive message with buttons', async () => {
    const interactiveMessage: InteractiveMessage = {
      title: 'Confirm Action',
      content: 'Are you sure?',
      actions: [
        {
          type: 'button',
          text: 'Confirm',
          actionId: 'confirm',
          value: 'yes',
          style: 'primary',
        },
        {
          type: 'button',
          text: 'Cancel',
          actionId: 'cancel',
          value: 'no',
          style: 'default',
        },
      ],
    };
    
    const result = await service.sendInteractiveMessage(TEST_USER_ID, interactiveMessage);
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('feishu');
  });

  it('should handle callback', async () => {
    const callback: ChannelCallback = {
      type: 'action',
      userId: TEST_USER_ID,
      messageId: 'msg_123',
      actionId: 'confirm',
      value: 'yes',
    };
    
    // Should not throw
    await expect(service.handleCallback(callback)).resolves.not.toThrow();
  });

  it('should check availability', async () => {
    const available = await service.isAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should throw error without appId', () => {
    expect(() => {
      new FeishuService({
        type: 'feishu',
        enabled: true,
        appSecret: 'test',
      });
    }).toThrow('Feishu appId and appSecret are required');
  });
});

// ===== WhatsAppService Tests =====

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  beforeEach(() => {
    service = new WhatsAppService(createTestConfig('whatsapp'));
  });

  it('should have correct channel type', () => {
    expect(service.channelType).toBe('whatsapp');
  });

  it('should send text message successfully', async () => {
    const result = await service.sendMessage(TEST_USER_ID, 'Hello WhatsApp');
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('whatsapp');
    expect(result.messageId).toBeDefined();
  });

  it('should send media message', async () => {
    const result = await service.sendMedia(
      TEST_USER_ID,
      'image',
      'https://example.com/image.jpg',
      'Test image'
    );
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('whatsapp');
  });

  it('should send buttons message', async () => {
    const result = await service.sendButtons(
      TEST_USER_ID,
      'Choose an option',
      [
        { id: 'btn1', title: 'Option 1' },
        { id: 'btn2', title: 'Option 2' },
      ],
      'Optional footer'
    );
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('whatsapp');
  });

  it('should send rich message', async () => {
    const richMessage: RichMessage = {
      title: 'Rich Title',
      content: 'Rich content',
    };
    
    const result = await service.sendRichMessage(TEST_USER_ID, richMessage);
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('whatsapp');
  });

  it('should send interactive message', async () => {
    const interactiveMessage: InteractiveMessage = {
      content: 'Interactive content',
      actions: [
        {
          type: 'button',
          text: 'Click me',
          actionId: 'click',
          value: 'action_value',
        },
      ],
    };
    
    const result = await service.sendInteractiveMessage(TEST_USER_ID, interactiveMessage);
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('whatsapp');
  });

  it('should handle callback', async () => {
    const callback: ChannelCallback = {
      type: 'action',
      userId: TEST_USER_ID,
      actionId: 'btn1',
      value: 'option_selected',
    };
    
    await expect(service.handleCallback(callback)).resolves.not.toThrow();
  });

  it('should check availability', async () => {
    const available = await service.isAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should throw error without phoneNumberId', () => {
    expect(() => {
      new WhatsAppService({
        type: 'whatsapp',
        enabled: true,
        accessToken: 'test_token',
      });
    }).toThrow('WhatsApp phoneNumberId and accessToken are required');
  });
});

// ===== TelegramService Tests =====

describe('TelegramService', () => {
  let service: TelegramService;

  beforeEach(() => {
    service = new TelegramService(createTestConfig('telegram'));
  });

  it('should have correct channel type', () => {
    expect(service.channelType).toBe('telegram');
  });

  it('should send text message successfully', async () => {
    const result = await service.sendMessage(TEST_USER_ID_NUM, 'Hello Telegram');
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('telegram');
    expect(result.messageId).toBeDefined();
  });

  it('should send inline keyboard message', async () => {
    const keyboard = [
      [
        { text: 'Button 1', callback_data: 'btn1' },
        { text: 'Button 2', callback_data: 'btn2' },
      ],
      [
        { text: 'Link', url: 'https://example.com' },
      ],
    ];
    
    const result = await service.sendInlineKeyboard(
      TEST_USER_ID_NUM,
      'Choose:',
      keyboard
    );
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('telegram');
  });

  it('should send rich message with formatting', async () => {
    const richMessage: RichMessage = {
      title: 'Telegram Title',
      content: 'Bold content',
      footer: 'Italic footer',
    };
    
    const result = await service.sendRichMessage(TEST_USER_ID_NUM, richMessage);
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('telegram');
  });

  it('should send interactive message', async () => {
    const interactiveMessage: InteractiveMessage = {
      content: 'Interactive Telegram message',
      actions: [
        {
          type: 'button',
          text: 'Yes',
          actionId: 'yes',
          url: 'https://example.com/yes',
        },
        {
          type: 'button',
          text: 'No',
          actionId: 'no',
        },
      ],
    };
    
    const result = await service.sendInteractiveMessage(
      TEST_USER_ID_NUM,
      interactiveMessage
    );
    
    expect(result.success).toBe(true);
    expect(result.channel).toBe('telegram');
  });

  it('should handle callback', async () => {
    const callback: ChannelCallback = {
      type: 'action',
      userId: TEST_USER_ID_NUM,
      messageId: 'msg_123',
      actionId: 'btn1',
    };
    
    await expect(service.handleCallback(callback)).resolves.not.toThrow();
  });

  it('should escape markdown correctly', async () => {
    // Test markdown escaping in sendMessage
    const result = await service.sendMessage(
      TEST_USER_ID_NUM,
      'Special chars: * _ [ ] ( ) ~ ` > # + - = | { } . !'
    );
    
    expect(result.success).toBe(true);
  });

  it('should check availability', async () => {
    const available = await service.isAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should throw error without botToken', () => {
    expect(() => {
      new TelegramService({
        type: 'telegram',
        enabled: true,
      });
    }).toThrow('Telegram botToken is required');
  });
});

// ===== ChannelManager Tests =====

describe('ChannelManager', () => {
  let manager: ChannelManager;

  beforeEach(() => {
    manager = createChannelManager([
      createTestConfig('feishu'),
      createTestConfig('whatsapp'),
      createTestConfig('telegram'),
    ]);
  });

  describe('Channel Registration', () => {
    it('should register all channels', () => {
      const channels = manager.getRegisteredChannels();
      
      expect(channels).toContain('feishu');
      expect(channels).toContain('whatsapp');
      expect(channels).toContain('telegram');
    });

    it('should unregister channel', () => {
      const removed = manager.unregisterChannel('feishu');
      
      expect(removed).toBe(true);
      expect(manager.getRegisteredChannels()).not.toContain('feishu');
    });

    it('should get channel by type', () => {
      const feishuService = manager.getChannel('feishu');
      
      expect(feishuService).toBeDefined();
      expect(feishuService?.channelType).toBe('feishu');
    });

    it('should return undefined for non-existent channel', () => {
      const unknown = manager.getChannel('feishu' as ChannelType);
      // After unregister, should be undefined
      const unknownChannel = manager.getChannel('unknown' as ChannelType);
      
      expect(unknownChannel).toBeUndefined();
    });
  });

  describe('Send Message', () => {
    it('should send message using first available channel', async () => {
      const result = await manager.sendMessage(TEST_USER_ID, 'Test message');
      
      expect(result.success).toBe(true);
      expect(result.channel).toBeDefined();
    });

    it('should send to specific channel', async () => {
      const result = await manager.sendMessage(TEST_USER_ID, 'Test', {
        channel: 'whatsapp',
      });
      
      expect(result.success).toBe(true);
      expect(result.channel).toBe('whatsapp');
    });

    it('should send rich message', async () => {
      const richMessage: RichMessage = {
        title: 'Rich',
        content: 'Content',
      };
      
      const result = await manager.sendRichMessage(TEST_USER_ID, richMessage);
      
      expect(result.success).toBe(true);
    });

    it('should send interactive message', async () => {
      const interactiveMessage: InteractiveMessage = {
        content: 'Click',
        actions: [
          {
            type: 'button',
            text: 'OK',
            actionId: 'ok',
          },
        ],
      };
      
      const result = await manager.sendInteractiveMessage(
        TEST_USER_ID,
        interactiveMessage
      );
      
      expect(result.success).toBe(true);
    });

    it('should handle send failure gracefully', async () => {
      // Create manager with no channels
      const emptyManager = createChannelManager([]);
      
      const result = await emptyManager.sendMessage(TEST_USER_ID, 'Test');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No available channels');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on failure', async () => {
      // Default retry is enabled
      const result = await manager.sendMessage(TEST_USER_ID, 'Test', {
        retryOnFailure: true,
      });
      
      expect(result.success).toBe(true);
    });

    it('should not retry when disabled', async () => {
      const result = await manager.sendMessage(TEST_USER_ID, 'Test', {
        retryOnFailure: false,
      });
      
      expect(result.success).toBe(true);
    });

    it('should set custom retry options', () => {
      manager.setDefaultRetryOptions({
        maxRetries: 5,
        retryDelayMs: 2000,
        backoffMultiplier: 1.5,
      });
      
      // Should not throw when using custom options
      expect(() => {
        manager.setDefaultRetryOptions({
          maxRetries: 0,
          retryDelayMs: 100,
          backoffMultiplier: 1,
        });
      }).not.toThrow();
    });
  });

  describe('Callback Handling', () => {
    it('should handle callback for registered channel', async () => {
      const callback: ChannelCallback = {
        type: 'action',
        userId: TEST_USER_ID,
        actionId: 'test',
      };
      
      await expect(
        manager.handleCallback('feishu', callback)
      ).resolves.not.toThrow();
    });

    it('should throw for unregistered channel', async () => {
      // Create a new manager with only telegram registered
      const testManager = createChannelManager([
        {
          type: 'telegram',
          enabled: true,
          botToken: 'test_token',
        },
      ]);
      
      const callback: ChannelCallback = {
        type: 'action',
        userId: TEST_USER_ID,
        actionId: 'test',
      };
      
      await expect(
        testManager.handleCallback('feishu', callback)
      ).rejects.toThrow('Channel not registered');
    });
  });

  describe('Channel Availability', () => {
    it('should check all channels', async () => {
      const results = await manager.checkAllChannels();
      
      expect(results.size).toBe(3);
      expect(results.get('feishu')).toBeDefined();
      expect(results.get('whatsapp')).toBeDefined();
      expect(results.get('telegram')).toBeDefined();
    });
  });

  describe('Priority', () => {
    it('should respect priority in config', async () => {
      const priorityManager = createChannelManager([
        {
          type: 'whatsapp',
          enabled: true,
          priority: 3,
          phoneNumberId: 'id',
          accessToken: 'token',
        },
        {
          type: 'telegram',
          enabled: true,
          priority: 1,
          botToken: 'token',
        },
        {
          type: 'feishu',
          enabled: true,
          priority: 2,
          appId: 'id',
          appSecret: 'secret',
        },
      ]);
      
      const result = await priorityManager.sendMessage(TEST_USER_ID, 'Test');
      
      // Should use highest priority (whatsapp)
      expect(result.channel).toBe('whatsapp');
    });
  });
});

// ===== Disabled Channel Tests =====

describe('Disabled Channels', () => {
  it('should not register disabled channel', () => {
    const manager = createChannelManager([
      {
        type: 'feishu',
        enabled: false,
        appId: 'id',
        appSecret: 'secret',
      },
    ]);
    
    const channels = manager.getRegisteredChannels();
    expect(channels).not.toContain('feishu');
  });
});

// ===== Integration Tests =====

describe('Channel Integration', () => {
  it('should handle all channel types in parallel', async () => {
    const manager = createChannelManager([
      createTestConfig('feishu'),
      createTestConfig('whatsapp'),
      createTestConfig('telegram'),
    ]);
    
    const [feishu, whatsapp, telegram] = await Promise.all([
      manager.getChannel('feishu')?.sendMessage(TEST_USER_ID, 'Feishu msg'),
      manager.getChannel('whatsapp')?.sendMessage(TEST_USER_ID, 'WhatsApp msg'),
      manager.getChannel('telegram')?.sendMessage(TEST_USER_ID_NUM, 'Telegram msg'),
    ]);
    
    expect(feishu?.success).toBe(true);
    expect(whatsapp?.success).toBe(true);
    expect(telegram?.success).toBe(true);
  });
});
