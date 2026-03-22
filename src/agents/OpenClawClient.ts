/**
 * OpenClaw 集成层
 * 封装 openclaw agent CLI 调用，处理响应和错误
 */

import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SpawnOptions {
  agent: string;
  input: string;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface SpawnResult {
  success: boolean;
  output?: any;
  error?: string;
  sessionId?: string;
  duration?: number;
}

/**
 * OpenClaw 客户端
 * 通过 openclaw agent CLI 与 OpenClaw 交互
 */
export class OpenClawClient {
  private timeout: number;

  constructor(timeout: number = 120) {
    this.timeout = timeout;
  }

  /**
   * 生成唯一任务 ID
   */
  generateTaskId(): string {
    return randomUUID();
  }

  /**
   * 调用 openclaw agent CLI 执行 Agent 任务
   */
  async spawn(options: SpawnOptions): Promise<SpawnResult> {
    const startTime = Date.now();
    const sessionId = this.generateTaskId();
    const timeout = options.timeout || this.timeout;

    try {
      // 构建 openclaw agent 命令
      const agent = options.agent;
      const message = options.input;
      const command = `openclaw agent --agent ${agent} --message "${message.replace(/"/g, '\\"')}" --timeout ${timeout} --json`;

      // 执行命令
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeout * 1000,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      // 解析 JSON 响应 - 过滤掉插件加载信息
      let result;
      try {
        // 使用正则表达式提取最后一个完整的 JSON 对象
        // 匹配从最后一个 { 到最后一个 } 的完整 JSON
        const jsonMatch = stdout.match(/\{[\s\S]*\}\s*\}\s*$/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // 尝试直接解析
          result = JSON.parse(stdout);
        }
      } catch (parseErr) {
        // 尝试提取 stderr 中的 JSON（如果 stdout 为空）
        try {
          const lastBrace = stderr.lastIndexOf('{');
          if (lastBrace >= 0) {
            const jsonStr = stderr.substring(lastBrace);
            result = JSON.parse(jsonStr);
          } else {
            // 解析失败，返回错误
            return {
              success: false,
              error: 'Failed to parse response: ' + String(parseErr),
              sessionId,
              duration: Date.now() - startTime,
            };
          }
        } catch {
          return {
            success: false,
            error: 'Failed to parse response',
            sessionId,
            duration: Date.now() - startTime,
          };
        }
      }

      // 检查执行状态 - 忽略插件日志前缀
      if (result.status === 'ok' || (result.result && result.result.payloads)) {
        return {
          success: true,
          output: {
            message: result.result?.payloads?.[0]?.text || 'No output',
            summary: result.summary,
            meta: {
              durationMs: result.result?.meta?.durationMs,
              model: result.result?.meta?.agentMeta?.model,
              usage: result.result?.meta?.agentMeta?.usage,
            },
          },
          sessionId: result.runId || sessionId,
          duration: Date.now() - startTime,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error',
          sessionId,
          duration: Date.now() - startTime,
        };
      }
    } catch (error: any) {
      // 处理执行错误
      let errorMessage = error.message || 'Unknown error';
      
      // 超时错误
      if (error.killed || error.code === 'ETIMEDOUT') {
        errorMessage = `Agent execution timeout (${timeout}s)`;
      }
      
      return {
        success: false,
        error: errorMessage,
        sessionId,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 检查 OpenClaw Gateway 状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('openclaw status --json', {
        timeout: 5000,
      });
      const result = JSON.parse(stdout);
      return result?.Gateway?.status === 'running';
    } catch {
      return false;
    }
  }

  /**
   * 获取可用的 Agent 列表
   */
  async listAgents(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('openclaw agents list --json', {
        timeout: 5000,
      });
      const result = JSON.parse(stdout);
      return result?.agents?.map((a: any) => a.id) || [];
    } catch {
      return [];
    }
  }
}

/**
 * 创建默认的 OpenClaw 客户端实例
 */
export const openClawClient = new OpenClawClient();

export default OpenClawClient;
