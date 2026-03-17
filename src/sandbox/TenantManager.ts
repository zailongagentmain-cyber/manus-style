/**
 * Tenant Manager
 * Handles multi-tenant configuration, isolation verification, and resource quotas
 */

import { SandboxConfig } from './SandboxConfig';

export interface TenantQuota {
  maxWorkspaces: number;
  maxAgents: number;
  maxConcurrentTasks: number;
  maxStorage: string; // e.g., "1GB"
  maxExecutionTime: number; // milliseconds
}

export interface TenantConfig {
  tenantId: string;
  name: string;
  quota: TenantQuota;
  allowedAgents: string[];
  networkWhitelist: string[];
  networkBlacklist: string[];
  enabled: boolean;
  createdAt: Date;
}

export interface TenantUsage {
  tenantId: string;
  workspaceCount: number;
  activeAgents: number;
  concurrentTasks: number;
  storageUsed: string;
  createdAt: Date;
}

export class TenantManager {
  private config: SandboxConfig;
  private tenants: Map<string, TenantConfig> = new Map();
  private tenantUsage: Map<string, TenantUsage> = new Map();

  constructor(config: SandboxConfig) {
    this.config = config;
  }

  /**
   * Create a new tenant
   */
  async createTenant(tenantId: string, name: string, quota: Partial<TenantQuota>): Promise<TenantConfig> {
    if (this.tenants.has(tenantId)) {
      throw new Error(`Tenant ${tenantId} already exists`);
    }

    const defaultQuota: TenantQuota = {
      maxWorkspaces: 10,
      maxAgents: 5,
      maxConcurrentTasks: 20,
      maxStorage: '1GB',
      maxExecutionTime: 300000, // 5 minutes
    };

    const tenantConfig: TenantConfig = {
      tenantId,
      name,
      quota: { ...defaultQuota, ...quota },
      allowedAgents: [],
      networkWhitelist: [],
      networkBlacklist: [],
      enabled: true,
      createdAt: new Date(),
    };

    this.tenants.set(tenantId, tenantConfig);
    this.tenantUsage.set(tenantId, {
      tenantId,
      workspaceCount: 0,
      activeAgents: 0,
      concurrentTasks: 0,
      storageUsed: '0B',
      createdAt: new Date(),
    });

    console.log(`[TenantManager] Created tenant: ${tenantId} (${name})`);
    return tenantConfig;
  }

  /**
   * Get tenant configuration
   */
  getTenant(tenantId: string): TenantConfig | undefined {
    return this.tenants.get(tenantId);
  }

  /**
   * Update tenant configuration
   */
  updateTenant(tenantId: string, updates: Partial<TenantConfig>): TenantConfig | null {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return null;
    }

    const updated = {
      ...tenant,
      ...updates,
      quota: {
        ...tenant.quota,
        ...(updates.quota || {}),
      },
    };

    this.tenants.set(tenantId, updated);
    console.log(`[TenantManager] Updated tenant: ${tenantId}`);
    return updated;
  }

  /**
   * Delete a tenant
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    this.tenants.delete(tenantId);
    this.tenantUsage.delete(tenantId);
    console.log(`[TenantManager] Deleted tenant: ${tenantId}`);
    return true;
  }

  /**
   * List all tenants
   */
  listTenants(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Verify tenant isolation
   */
  verifyIsolation(tenantId: string, resource: { workspaceId?: string; agentId?: string }): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      console.warn(`[TenantManager] Tenant ${tenantId} not found`);
      return false;
    }

    if (!tenant.enabled) {
      console.warn(`[TenantManager] Tenant ${tenantId} is disabled`);
      return false;
    }

    // Verify agent is allowed for this tenant
    if (resource.agentId && tenant.allowedAgents.length > 0) {
      if (!tenant.allowedAgents.includes(resource.agentId)) {
        console.warn(`[TenantManager] Agent ${resource.agentId} not allowed for tenant ${tenantId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if tenant can create workspace
   */
  canCreateWorkspace(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    const usage = this.tenantUsage.get(tenantId);

    if (!tenant || !usage) {
      return false;
    }

    return usage.workspaceCount < tenant.quota.maxWorkspaces;
  }

  /**
   * Check if tenant can use agent
   */
  canUseAgent(tenantId: string, agentId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    const usage = this.tenantUsage.get(tenantId);

    if (!tenant || !usage) {
      return false;
    }

    // Check if agent is allowed
    if (tenant.allowedAgents.length > 0 && !tenant.allowedAgents.includes(agentId)) {
      return false;
    }

    // Check agent quota
    return usage.activeAgents < tenant.quota.maxAgents;
  }

  /**
   * Check if tenant can run concurrent task
   */
  canRunTask(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    const usage = this.tenantUsage.get(tenantId);

    if (!tenant || !usage) {
      return false;
    }

    return usage.concurrentTasks < tenant.quota.maxConcurrentTasks;
  }

  /**
   * Check storage quota
   */
  canUseStorage(tenantId: string, additionalSize: string): boolean {
    const tenant = this.tenants.get(tenantId);
    const usage = this.tenantUsage.get(tenantId);

    if (!tenant || !usage) {
      return false;
    }

    const currentUsed = this.parseSize(usage.storageUsed);
    const maxStorage = this.parseSize(tenant.quota.maxStorage);
    const additional = this.parseSize(additionalSize);

    return (currentUsed + additional) <= maxStorage;
  }

  /**
   * Update tenant usage
   */
  updateUsage(tenantId: string, updates: Partial<TenantUsage>): void {
    const usage = this.tenantUsage.get(tenantId);
    if (usage) {
      Object.assign(usage, updates);
    }
  }

  /**
   * Get tenant usage
   */
  getUsage(tenantId: string): TenantUsage | undefined {
    return this.tenantUsage.get(tenantId);
  }

  /**
   * Get all tenant usages
   */
  getAllUsage(): TenantUsage[] {
    return Array.from(this.tenantUsage.values());
  }

  /**
   * Set tenant agent whitelist
   */
  setAllowedAgents(tenantId: string, agentIds: string[]): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.allowedAgents = agentIds;
    console.log(`[TenantManager] Set allowed agents for tenant ${tenantId}: ${agentIds.join(', ')}`);
    return true;
  }

  /**
   * Set network whitelist/blacklist
   */
  setNetworkRules(
    tenantId: string,
    whitelist: string[],
    blacklist: string[]
  ): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.networkWhitelist = whitelist;
    tenant.networkBlacklist = blacklist;
    return true;
  }

  /**
   * Check if network host is allowed for tenant
   */
  isNetworkAllowed(tenantId: string, host: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    // Check blacklist first
    if (tenant.networkBlacklist.includes(host)) {
      return false;
    }

    // If whitelist is empty, allow all (except blacklisted)
    if (tenant.networkWhitelist.length === 0) {
      return true;
    }

    // Check whitelist
    return tenant.networkWhitelist.includes(host);
  }

  /**
   * Enable/disable tenant
   */
  setTenantEnabled(tenantId: string, enabled: boolean): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.enabled = enabled;
    console.log(`[TenantManager] Tenant ${tenantId} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Parse size string (e.g., "10MB" -> 10 * 1024 * 1024)
   */
  private parseSize(size: string): number {
    const match = size.match(/^(\d+)(MB|GB|KB|B)?$/i);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = (match[2] || 'B').toUpperCase();

    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
  }
}
