/**
 * 配置加载器
 * 负责加载 TOML 配置文件、环境变量替换和配置验证
 */

import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import { Config, LLMConfig, AgentConfig, StorageConfig, SandboxConfig } from '../types/config';

/**
 * 从环境变量替换字符串中的占位符
 * 格式: ${VAR_NAME}
 */
function replaceEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    const envValue = process.env[varName];
    if (envValue === undefined) {
      throw new Error(`Environment variable ${varName} is not set`);
    }
    return envValue;
  });
}

/**
 * 递归处理对象中的环境变量
 */
function processEnvVars(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return replaceEnvVars(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(processEnvVars);
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = processEnvVars(value);
    }
    return result;
  }
  return obj;
}

/**
 * 验证 LLM 配置
 */
function validateLLMConfig(config: LLMConfig): void {
  if (!config.model) throw new Error('LLM config: model is required');
  if (!config.base_url) throw new Error('LLM config: base_url is required');
  if (!config.api_key) throw new Error('LLM config: api_key is required');
  if (config.max_tokens && config.max_tokens <= 0) {
    throw new Error('LLM config: max_tokens must be positive');
  }
  if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
    throw new Error('LLM config: temperature must be between 0 and 2');
  }
}

/**
 * 验证 Agent 配置
 */
function validateAgentConfig(name: string, config: AgentConfig): void {
  if (!config.capabilities || !Array.isArray(config.capabilities)) {
    throw new Error(`Agent ${name}: capabilities must be an array`);
  }
  if (config.timeout !== undefined && config.timeout <= 0) {
    throw new Error(`Agent ${name}: timeout must be positive`);
  }
}

/**
 * 验证存储配置
 */
function validateStorageConfig(config: StorageConfig): void {
  if (!config.type) throw new Error('Storage config: type is required');
  if (!['json', 'sqlite'].includes(config.type)) {
    throw new Error('Storage config: type must be "json" or "sqlite"');
  }
  if (!config.path) throw new Error('Storage config: path is required');
}

/**
 * 验证沙箱配置
 */
function validateSandboxConfig(config: SandboxConfig): void {
  if (config.enabled) {
    if (!config.workspace) throw new Error('Sandbox config: workspace is required');
    if (!config.agent?.agentId) throw new Error('Sandbox config: agent.agentId is required');
  }
}

/**
 * 验证完整配置
 */
function validateConfig(config: Config): void {
  validateLLMConfig(config.llm);
  
  for (const [name, agentConfig] of Object.entries(config.agents)) {
    validateAgentConfig(name, agentConfig);
  }
  
  validateStorageConfig(config.storage);
  
  if (config.sandbox) {
    validateSandboxConfig(config.sandbox);
  }
}

/**
 * 配置加载器类
 */
export class ConfigLoader {
  private config: Config | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    // 默认配置路径
    this.configPath = configPath || path.join(process.cwd(), 'config', 'default.toml');
  }

  /**
   * 加载配置文件
   */
  load(): Config {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Config file not found: ${this.configPath}`);
    }

    const fileContent = fs.readFileSync(this.configPath, 'utf-8');
    const rawConfig = toml.parse(fileContent);
    
    // 处理环境变量替换
    const configWithEnv = processEnvVars(rawConfig) as Config;
    
    // 验证配置
    validateConfig(configWithEnv);
    
    this.config = configWithEnv;
    return this.config;
  }

  /**
   * 获取当前配置
   */
  getConfig(): Config {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  /**
   * 重新加载配置
   */
  reload(): Config {
    this.config = null;
    return this.load();
  }

  /**
   * 设置配置路径
   */
  setConfigPath(configPath: string): void {
    this.configPath = configPath;
    this.config = null;
  }
}

export default ConfigLoader;
