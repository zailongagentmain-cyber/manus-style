/**
 * ConfigLoader 单元测试
 */

import * as fs from 'fs';
import { ConfigLoader } from '../../src/core/ConfigLoader';

// Mock fs
jest.mock('fs');

describe('ConfigLoader', () => {
  const mockConfigPath = '/test/config.toml';
  const mockConfigContent = `
[llm]
model = "test-model"
base_url = "https://api.test.com"
api_key = "test-key"
max_tokens = 1000
temperature = 0.7

[agents.malong]
capabilities = ["code", "debug"]
timeout = 300

[agents.search]
capabilities = ["search"]
timeout = 60

[storage]
type = "json"
path = "./data/tasks.json"

[sandbox]
enabled = false
`;

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockConfigContent);
  });

  describe('构造函数', () => {
    it('应该使用默认路径创建加载器', () => {
      const loader = new ConfigLoader();
      expect(loader).toBeDefined();
    });

    it('应该使用指定路径创建加载器', () => {
      const loader = new ConfigLoader('/custom/path.toml');
      expect(loader).toBeDefined();
    });
  });

  describe('load', () => {
    it('应该加载配置文件', () => {
      const loader = new ConfigLoader(mockConfigPath);
      const config = loader.load();
      
      expect(config.llm.model).toBe('test-model');
      expect(config.llm.base_url).toBe('https://api.test.com');
      expect(config.storage.type).toBe('json');
    });

    it('应该在文件不存在时抛出错误', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const loader = new ConfigLoader(mockConfigPath);
      
      expect(() => loader.load()).toThrow(`Config file not found: ${mockConfigPath}`);
    });
  });

  describe('getConfig', () => {
    it('应该在未加载时自动加载配置', () => {
      const loader = new ConfigLoader(mockConfigPath);
      const config = loader.getConfig();
      
      expect(config.llm.model).toBe('test-model');
    });

    it('应该返回缓存的配置', () => {
      const loader = new ConfigLoader(mockConfigPath);
      loader.load();
      const config = loader.getConfig();
      
      expect(config.llm.model).toBe('test-model');
    });
  });

  describe('reload', () => {
    it('应该重新加载配置', () => {
      const loader = new ConfigLoader(mockConfigPath);
      loader.load();
      const config = loader.reload();
      
      expect(config.llm.model).toBe('test-model');
    });
  });

  describe('setConfigPath', () => {
    it('应该设置新的配置路径并清空缓存', () => {
      const loader = new ConfigLoader(mockConfigPath);
      loader.load();
      loader.setConfigPath('/new/path.toml');
      
      expect((loader as any).configPath).toBe('/new/path.toml');
      expect((loader as any).config).toBeNull();
    });
  });
});
