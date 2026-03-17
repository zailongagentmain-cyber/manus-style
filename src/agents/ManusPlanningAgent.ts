/**
 * Manus-Style Planning Agent (简化版)
 * 使用 OpenClaw API 进行任务规划
 */

export interface PlanningInput {
  userInput: string;
  context?: Record<string, any>;
}

export interface SubTask {
  id: string;
  description: string;
  agent: string;
  tool?: string;
  input: string;
  expectedOutput?: string;
}

export interface PlanResult {
  taskId: string;
  think: string;
  subtasks: SubTask[];
  finalGoal: string;
}

export class PlanningAgent {
  async plan(input: PlanningInput): Promise<PlanResult> {
    const taskId = `task_${Date.now()}`;
    
    // 智能任务拆分
    const subtasks = this.smartSplit(input.userInput);
    
    return {
      taskId,
      think: this.generateThink(input.userInput),
      subtasks,
      finalGoal: input.userInput
    };
  }

  private smartSplit(userInput: string): SubTask[] {
    const input = userInput.toLowerCase();
    const tasks: SubTask[] = [];
    
    // 根据关键词智能拆分
    if (input.includes('搜索') || input.includes('找') || input.includes('search')) {
      tasks.push({
        id: 'step_1',
        description: '搜索相关信息',
        agent: 'search',
        input: userInput,
        expectedOutput: '搜索结果'
      });
    }
    
    if (input.includes('分析') || input.includes('分析') || input.includes('analysis')) {
      tasks.push({
        id: 'step_2',
        description: '分析数据',
        agent: 'analysis',
        input: userInput,
        expectedOutput: '分析报告'
      });
    }
    
    if (input.includes('代码') || input.includes('开发') || input.includes('code') || input.includes('写')) {
      tasks.push({
        id: 'step_3',
        description: '生成代码',
        agent: 'code',
        input: userInput,
        expectedOutput: '代码文件'
      });
    }
    
    if (input.includes('网站') || input.includes('网页') || input.includes('web')) {
      tasks.push({
        id: 'step_4',
        description: '创建网页',
        agent: 'browser',
        input: userInput,
        expectedOutput: '网页文件'
      });
    }
    
    // 默认任务
    if (tasks.length === 0) {
      tasks.push({
        id: 'step_1',
        description: '执行任务',
        agent: 'code',
        input: userInput,
        expectedOutput: '完成'
      });
    }
    
    return tasks;
  }

  private generateThink(userInput: string): string {
    return `收到任务: "${userInput}"

我理解您的需求是：
1. 理解任务目标
2. 规划执行步骤
3. 逐步完成任务

让我开始执行...`;
  }
}

export const planningAgent = new PlanningAgent();
