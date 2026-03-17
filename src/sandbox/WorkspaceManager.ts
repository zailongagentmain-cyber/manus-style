/**
 * Workspace Manager
 * Handles workspace isolation, directory creation, file access control, and cleanup
 */

import * as fs from 'fs';
import * as path from 'path';
import { SandboxConfig } from './SandboxConfig';

export interface WorkspaceInfo {
  id: string;
  path: string;
  tenantId?: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface FileAccessRule {
  allowed: boolean;
  pattern?: RegExp;
}

export class WorkspaceManager {
  private workspaces: Map<string, WorkspaceInfo> = new Map();
  private config: SandboxConfig;
  private accessRules: Map<string, FileAccessRule> = new Map();

  constructor(config: SandboxConfig) {
    this.config = config;
    this.initializeWorkspaceRoot();
  }

  /**
   * Initialize the root workspace directory
   */
  private initializeWorkspaceRoot(): void {
    const workspaceRoot = this.config.workspace;
    if (!fs.existsSync(workspaceRoot)) {
      fs.mkdirSync(workspaceRoot, { recursive: true });
      console.log(`[WorkspaceManager] Created workspace root: ${workspaceRoot}`);
    }
  }

  /**
   * Create a new isolated workspace
   */
  async createWorkspace(workspaceId: string, tenantId?: string): Promise<WorkspaceInfo> {
    const workspacePath = path.join(this.config.workspace, workspaceId);
    
    if (fs.existsSync(workspacePath)) {
      throw new Error(`Workspace ${workspaceId} already exists`);
    }

    // Create workspace directory structure
    const subDirs = ['input', 'output', 'temp', 'cache'];
    fs.mkdirSync(workspacePath, { recursive: true });
    
    for (const dir of subDirs) {
      fs.mkdirSync(path.join(workspacePath, dir), { recursive: true });
    }

    const workspaceInfo: WorkspaceInfo = {
      id: workspaceId,
      path: workspacePath,
      tenantId,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.workspaces.set(workspaceId, workspaceInfo);
    console.log(`[WorkspaceManager] Created workspace: ${workspaceId} at ${workspacePath}`);

    return workspaceInfo;
  }

  /**
   * Get workspace information
   */
  getWorkspace(workspaceId: string): WorkspaceInfo | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      workspace.lastAccessedAt = new Date();
    }
    return workspace;
  }

  /**
   * List all workspaces
   */
  listWorkspaces(): WorkspaceInfo[] {
    return Array.from(this.workspaces.values());
  }

  /**
   * Check if file access is allowed within a workspace
   */
  checkFileAccess(workspaceId: string, filePath: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      console.warn(`[WorkspaceManager] Workspace ${workspaceId} not found`);
      return false;
    }

    // Resolve the absolute path
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(workspace.path, filePath);
    
    // Check if the path is within the workspace
    const isWithinWorkspace = absolutePath.startsWith(workspace.path);
    
    // Check file size limit
    if (fs.existsSync(absolutePath)) {
      const stats = fs.statSync(absolutePath);
      const maxFileSize = this.parseSize(this.config.limits.maxFileSize);
      if (stats.size > maxFileSize) {
        console.warn(`[WorkspaceManager] File exceeds size limit: ${filePath}`);
        return false;
      }
    }

    return isWithinWorkspace;
  }

  /**
   * Read file from workspace with access control
   */
  async readFile(workspaceId: string, filePath: string): Promise<Buffer | null> {
    if (!this.checkFileAccess(workspaceId, filePath)) {
      throw new Error(`Access denied: ${filePath}`);
    }

    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(workspace.path, filePath);
    
    try {
      const data = await fs.promises.readFile(absolutePath);
      this.updateAccessTime(workspaceId);
      return data;
    } catch (error) {
      console.error(`[WorkspaceManager] Error reading file: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Write file to workspace with access control
   */
  async writeFile(workspaceId: string, filePath: string, data: Buffer | string): Promise<boolean> {
    if (!this.checkFileAccess(workspaceId, filePath)) {
      throw new Error(`Access denied: ${filePath}`);
    }

    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(workspace.path, filePath);
    
    try {
      // Ensure parent directory exists
      await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.promises.writeFile(absolutePath, data);
      this.updateAccessTime(workspaceId);
      console.log(`[WorkspaceManager] Wrote file: ${absolutePath}`);
      return true;
    } catch (error) {
      console.error(`[WorkspaceManager] Error writing file: ${filePath}`, error);
      return false;
    }
  }

  /**
   * Delete workspace and all its contents
   */
  async deleteWorkspace(workspaceId: string): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      console.warn(`[WorkspaceManager] Workspace ${workspaceId} not found for deletion`);
      return false;
    }

    try {
      await fs.promises.rm(workspace.path, { recursive: true, force: true });
      this.workspaces.delete(workspaceId);
      console.log(`[WorkspaceManager] Deleted workspace: ${workspaceId}`);
      return true;
    } catch (error) {
      console.error(`[WorkspaceManager] Error deleting workspace: ${workspaceId}`, error);
      return false;
    }
  }

  /**
   * Clean up old workspaces based on last access time
   */
  async cleanupOldWorkspaces(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, workspace] of Array.from(this.workspaces.entries())) {
      const age = now - workspace.lastAccessedAt.getTime();
      if (age > maxAgeMs) {
        await this.deleteWorkspace(id);
        cleanedCount++;
      }
    }

    console.log(`[WorkspaceManager] Cleaned up ${cleanedCount} old workspaces`);
    return cleanedCount;
  }

  /**
   * Get workspace disk usage
   */
  async getWorkspaceUsage(workspaceId: string): Promise<{ total: number; files: number }> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return { total: 0, files: 0 };
    }

    let total = 0;
    let files = 0;

    const calculateSize = async (dir: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await calculateSize(fullPath);
        } else {
          const stats = await fs.promises.stat(fullPath);
          total += stats.size;
          files++;
        }
      }
    };

    await calculateSize(workspace.path);
    return { total, files };
  }

  /**
   * Update last accessed time
   */
  private updateAccessTime(workspaceId: string): void {
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      workspace.lastAccessedAt = new Date();
    }
  }

  /**
   * Parse size string (e.g., "10MB" -> 10 * 1024 * 1024)
   */
  private parseSize(size: string): number {
    const match = size.match(/^(\d+)(MB|GB|KB)?$/i);
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
