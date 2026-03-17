/**
 * Agent Isolation
 * Handles agent allocation, concurrency limits, and timeout controls
 */

import { SandboxConfig } from './SandboxConfig';

export interface AgentSession {
  id: string;
  agentId: string;
  tenantId?: string;
  workspaceId: string;
  status: 'active' | 'idle' | 'timeout' | 'terminated';
  createdAt: Date;
  lastActiveAt: Date;
  taskCount: number;
}

export interface AgentStats {
  agentId: string;
  totalTasks: number;
  activeSessions: number;
  completedTasks: number;
  failedTasks: number;
  avgExecutionTime: number;
}

export class AgentIsolation {
  private config: SandboxConfig;
  private sessions: Map<string, AgentSession> = new Map();
  private agentTaskCount: Map<string, number> = new Map();
  private agentTaskTimes: Map<string, number[]> = new Map();
  private activeAgents: Set<string> = new Set();
  private taskTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: SandboxConfig) {
    this.config = config;
  }

  /**
   * Assign a new agent session
   */
  async createSession(
    sessionId: string,
    agentId: string,
    workspaceId: string,
    tenantId?: string
  ): Promise<AgentSession> {
    // Check concurrency limit
    const activeCount = this.getActiveSessionCount(agentId);
    if (activeCount >= this.config.limits.maxConcurrent) {
      throw new Error(`Agent ${agentId} has reached maximum concurrent sessions (${this.config.limits.maxConcurrent})`);
    }

    const session: AgentSession = {
      id: sessionId,
      agentId,
      tenantId,
      workspaceId,
      status: 'active',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      taskCount: 0,
    };

    this.sessions.set(sessionId, session);
    this.activeAgents.add(agentId);
    
    // Initialize agent stats if needed
    if (!this.agentTaskCount.has(agentId)) {
      this.agentTaskCount.set(agentId, 0);
      this.agentTaskTimes.set(agentId, []);
    }

    // Set up timeout
    this.setupSessionTimeout(sessionId);

    console.log(`[AgentIsolation] Created session ${sessionId} for agent ${agentId}`);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions for an agent
   */
  getAgentSessions(agentId: string): AgentSession[] {
    return Array.from(this.sessions.values()).filter(s => s.agentId === agentId);
  }

  /**
   * Get active session count for an agent
   */
  getActiveSessionCount(agentId: string): number {
    return Array.from(this.sessions.values()).filter(
      s => s.agentId === agentId && s.status === 'active'
    ).length;
  }

  /**
   * Record task start for a session
   */
  startTask(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[AgentIsolation] Session ${sessionId} not found`);
      return false;
    }

    if (session.status !== 'active') {
      console.warn(`[AgentIsolation] Session ${sessionId} is not active`);
      return false;
    }

    session.taskCount++;
    session.lastActiveAt = new Date();
    this.updateAgentTaskCount(session.agentId);

    // Reset timeout on task activity
    this.setupSessionTimeout(sessionId);

    return true;
  }

  /**
   * Record task completion
   */
  completeTask(sessionId: string, executionTime: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Update agent stats
    const times = this.agentTaskTimes.get(session.agentId) || [];
    times.push(executionTime);
    
    // Keep only last 100 task times for average calculation
    if (times.length > 100) {
      times.shift();
    }
    this.agentTaskTimes.set(session.agentId, times);

    session.lastActiveAt = new Date();
    this.clearSessionTimeout(sessionId);

    console.log(`[AgentIsolation] Task completed in session ${sessionId} (${executionTime}ms)`);
    return true;
  }

  /**
   * Terminate a session
   */
  async terminateSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'terminated';
    this.clearSessionTimeout(sessionId);

    // Check if agent has any more active sessions
    const remainingActive = this.getActiveSessionCount(session.agentId);
    if (remainingActive === 0) {
      this.activeAgents.delete(session.agentId);
    }

    console.log(`[AgentIsolation] Terminated session ${sessionId}`);
    return true;
  }

  /**
   * Mark session as timed out
   */
  private handleTimeout(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'active') {
      session.status = 'timeout';
      console.warn(`[AgentIsolation] Session ${sessionId} timed out`);
    }
  }

  /**
   * Set up session timeout
   */
  private setupSessionTimeout(sessionId: string): void {
    // Clear existing timeout
    this.clearSessionTimeout(sessionId);

    const timeout = setTimeout(() => {
      this.handleTimeout(sessionId);
    }, this.config.limits.timeout);

    this.taskTimeouts.set(sessionId, timeout);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.taskTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.taskTimeouts.delete(sessionId);
    }
  }

  /**
   * Update agent task count
   */
  private updateAgentTaskCount(agentId: string): void {
    const count = this.agentTaskCount.get(agentId) || 0;
    this.agentTaskCount.set(agentId, count + 1);
  }

  /**
   * Get agent statistics
   */
  getAgentStats(agentId: string): AgentStats {
    const sessions = this.getAgentSessions(agentId);
    const times = this.agentTaskTimes.get(agentId) || [];
    
    const avgExecutionTime = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;

    return {
      agentId,
      totalTasks: this.agentTaskCount.get(agentId) || 0,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedTasks: sessions.filter(s => s.status === 'active').reduce((acc, s) => acc + s.taskCount, 0),
      failedTasks: sessions.filter(s => s.status === 'timeout' || s.status === 'terminated').length,
      avgExecutionTime,
    };
  }

  /**
   * Get all agent stats
   */
  getAllAgentStats(): AgentStats[] {
    const agentIds = new Set(Array.from(this.sessions.values()).map(s => s.agentId));
    return Array.from(agentIds).map(id => this.getAgentStats(id));
  }

  /**
   * Check if agent is available for new session
   */
  isAgentAvailable(agentId: string): boolean {
    return this.getActiveSessionCount(agentId) < this.config.limits.maxConcurrent;
  }

  /**
   * Clean up terminated/idle sessions
   */
  cleanupSessions(maxIdleTimeMs: number = 30 * 60 * 1000): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, session] of Array.from(this.sessions.entries())) {
      if (session.status !== 'active') continue;

      const idleTime = now - session.lastActiveAt.getTime();
      if (idleTime > maxIdleTimeMs) {
        this.terminateSession(id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}
