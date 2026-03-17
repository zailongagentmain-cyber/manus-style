/**
 * 配置类型定义
 * 定义系统各模块的配置接口
 */

export interface LLMConfig {
  model: string;
  base_url: string;
  api_key: string;
  max_tokens: number;
  temperature: number;
}

export interface AgentConfig {
  capabilities: string[];
  timeout: number;
}

export interface StorageConfig {
  type: 'json' | 'sqlite';
  path: string;
}

export interface SandboxConfig {
  enabled: boolean;
  workspace: string;
  memory: string;
  agent: {
    agentId: string;
  };
  limits: {
    maxConcurrent: number;
    timeout: number;
    maxMemory: string;
    maxFileSize: string;
  };
  network: {
    port: number;
    allowedHosts: string[];
    blockedHosts: string[];
  };
}

export interface Config {
  llm: LLMConfig;
  agents: Record<string, AgentConfig>;
  storage: StorageConfig;
  sandbox?: SandboxConfig;
}
