/**
 * Sandbox Configuration Interface
 * Defines the configuration structure for sandbox isolation
 */

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

/**
 * Default sandbox configuration
 */
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  enabled: true,
  workspace: './sandbox/workspace',
  memory: './sandbox/memory',
  agent: {
    agentId: 'default-agent',
  },
  limits: {
    maxConcurrent: 10,
    timeout: 300000, // 5 minutes
    maxMemory: '512MB',
    maxFileSize: '10MB',
  },
  network: {
    port: 3000,
    allowedHosts: ['localhost', '127.0.0.1'],
    blockedHosts: [],
  },
};

/**
 * Merge custom config with defaults
 */
export function mergeConfig(custom: Partial<SandboxConfig>): SandboxConfig {
  return {
    ...DEFAULT_SANDBOX_CONFIG,
    ...custom,
    agent: {
      ...DEFAULT_SANDBOX_CONFIG.agent,
      ...custom.agent,
    },
    limits: {
      ...DEFAULT_SANDBOX_CONFIG.limits,
      ...custom.limits,
    },
    network: {
      ...DEFAULT_SANDBOX_CONFIG.network,
      ...custom.network,
    },
  };
}
