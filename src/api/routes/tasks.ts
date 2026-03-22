import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskInput } from '../../types/task';
import { TaskManager } from '../../core/TaskManager';
import { PlannerAgent } from '../../agents/PlannerAgent';
import { OpenClawClient } from '../../agents/OpenClawClient';

const router = Router();

// Planner Agent 实例
let plannerAgent: PlannerAgent | null = null;

// OpenClaw 客户端实例
let openClawClient: OpenClawClient | null = null;

const getPlannerAgent = (): PlannerAgent => {
  if (!plannerAgent) {
    plannerAgent = new PlannerAgent();
  }
  return plannerAgent;
};

const getOpenClawClient = (): OpenClawClient => {
  if (!openClawClient) {
    openClawClient = new OpenClawClient(120);
  }
  return openClawClient;
};

/**
 * 根据任务内容检测需要使用的 Agent
 */
function detectAgents(input: string): string[] {
  const lowerInput = input.toLowerCase();
  const agents: string[] = [];
  
  // 代码开发相关
  if (lowerInput.includes('code') || lowerInput.includes('写代码') || 
      lowerInput.includes('编程') || lowerInput.includes('python') ||
      lowerInput.includes('javascript') || lowerInput.includes('开发')) {
    agents.push('malong');
  }
  
  // SEO/内容相关
  if (lowerInput.includes('seo') || lowerInput.includes('内容') || 
      lowerInput.includes('文章') || lowerInput.includes('写作')) {
    agents.push('longyaren');
  }
  
  // 搜索相关
  if (lowerInput.includes('搜索') || lowerInput.includes('查找') || 
      lowerInput.includes('research') || lowerInput.includes('调查')) {
    agents.push('search');
  }
  
  // 默认使用 malong
  if (agents.length === 0) {
    agents.push('malong');
  }
  
  return agents;
}

// In-memory task storage (replace with TaskManager in production)
const tasks: Map<string, Task> = new Map();

// Helper to get string param
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// GET /api/v1/tasks - List tasks
router.get('/', async (req: Request, res: Response) => {
  const { userId, status, page = '1', pageSize = '20' } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'userId is required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  let taskList = Array.from(tasks.values()).filter(task => task.userId === userId);

  // Filter by status if provided
  if (status) {
    taskList = taskList.filter(task => task.status === status);
  }

  // Sort by createdAt descending
  taskList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const pageNum = parseInt(page as string, 10);
  const pageSizeNum = parseInt(pageSize as string, 10);
  const total = taskList.length;
  const totalPages = Math.ceil(total / pageSizeNum);
  const start = (pageNum - 1) * pageSizeNum;
  const paginatedTasks = taskList.slice(start, start + pageSizeNum);

  res.json({
    success: true,
    data: paginatedTasks,
    pagination: {
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      totalPages,
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/tasks - Create task
router.post('/', async (req: Request, res: Response) => {
  const { userId, channel, message, metadata } = req.body;

  if (!userId || !channel || !message) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'userId, channel, and message are required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const task: Task = {
    id: uuidv4(),
    userId,
    channel,
    input: message,
    status: TaskStatus.PENDING,
    currentStep: 0,
    subtasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: metadata || {},
  };

  tasks.set(task.id, task);

  // 使用 PlannerAgent 执行任务
  setImmediate(async () => {
    const openClaw = getOpenClawClient();
    
    try {
      task.status = TaskStatus.RUNNING;
      task.updatedAt = new Date();
      tasks.set(task.id, task);
      
      // ========== 第一步：意图分析 + 任务规划 ==========
      task.think = '🤔 正在分析任务需求...\n- 理解用户意图\n- 规划执行步骤\n- 分配 Agent';
      tasks.set(task.id, task);
      
      // 调用 malong 进行任务规划
      const planningPrompt = `你是一个任务规划专家。请分析以下用户需求，并拆分为具体的执行步骤。

用户需求：${task.input}

请按照以下 JSON 格式返回规划结果：
{
  "understanding": "对用户需求的理解",
  "tasks": [
    {"description": "子任务1的具体描述", "agent": "合适的agent(malong/longyaren/search)"},
    {"description": "子任务2的具体描述", "agent": "合适的agent"}
  ],
  "summary": "整体任务摘要"
}

注意：
- tasks 数组描述执行步骤
- agent 必须是 malong(代码开发)、longyaren(内容写作)、search(搜索调研) 之一
- 每个子任务应该是一个可独立执行的步骤
- 直接返回 JSON，不要其他内容`;

      const planningResult = await openClaw.spawn({
        agent: 'malong',
        input: planningPrompt,
        timeout: 60,
      });
      
      if (!planningResult.success) {
        throw new Error(`规划失败: ${planningResult.error}`);
      }
      
      // 解析规划结果
      let planning;
      try {
        const planningText = planningResult.output?.message || '';
        const jsonMatch = planningText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          planning = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法解析规划结果');
        }
      } catch (parseErr) {
        // 解析失败，使用简单规划
        planning = {
          understanding: '用户需求',
          tasks: detectAgents(task.input).map(agent => ({
            description: `执行任务: ${task.input}`,
            agent
          })),
          summary: '任务执行'
        };
      }
      
      task.think = `📋 意图理解: ${planning.understanding}\n\n📝 任务规划 (${planning.tasks.length} 个步骤):\n${planning.tasks.map((t: any, i: number) => `${i+1}. ${t.description} (${t.agent})`).join('\n')}`;
      tasks.set(task.id, task);
      
      // ========== 第二步：创建子任务 ==========
      task.subtasks = planning.tasks.map((t: any) => ({
        id: uuidv4(),
        taskId: task.id,
        description: t.description,
        agent: t.agent || 'malong',
        status: TaskStatus.PENDING,
        input: task.input,
        output: null,
        dependsOn: []
      })) as any;
      task.currentStep = 1;
      tasks.set(task.id, task);
      
      // ========== 第三步：执行每个子任务 ==========
      for (let i = 0; i < task.subtasks.length; i++) {
        const subtask = task.subtasks[i] as any;
        subtask.status = TaskStatus.RUNNING;
        task.think += `\n\n⚡ 执行步骤 ${i+1}/${task.subtasks.length}: ${subtask.description}`;
        tasks.set(task.id, task);
        
        try {
          // 使用 OpenClaw 调用真实 Agent
          const result = await openClaw.spawn({
            agent: subtask.agent,
            input: `请完成以下任务：${subtask.description}\n\n原始用户需求：${task.input}`,
            timeout: 120,
          });
          
          if (result.success) {
            subtask.status = TaskStatus.COMPLETED;
            const output = result.output?.message || result.output?.summary || JSON.stringify(result.output);
            subtask.output = { message: output, meta: result.output?.meta };
            task.think += `\n✓ 步骤完成`;
          } else {
            subtask.status = TaskStatus.FAILED;
            subtask.output = { error: result.error };
            task.think += `\n✗ 步骤失败: ${result.error}`;
          }
        } catch (subError) {
          subtask.status = TaskStatus.FAILED;
          subtask.output = { error: String(subError) };
          task.think += `\n✗ 步骤失败: ${subError}`;
        }
        tasks.set(task.id, task);
      }
      
      task.status = TaskStatus.COMPLETED;
      task.result = {
        summary: '任务执行完成',
        details: task.subtasks.map((s: any) => s.description).join(', ')
      };
      task.updatedAt = new Date();
      tasks.set(task.id, task);
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.error = String(error);
      task.think += `\n\n❌ 任务执行失败: ${error}`;
      task.updatedAt = new Date();
      tasks.set(task.id, task);
    }
  });

  res.status(201).json({
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/tasks/:id - Get task
router.get('/:id', async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const task = tasks.get(id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `Task ${id} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  });
});

// PATCH /api/v1/tasks/:id - Update task
router.patch('/:id', async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const { metadata } = req.body;

  const task = tasks.get(id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `Task ${id} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Update allowed fields
  if (metadata) {
    task.metadata = { ...task.metadata, ...metadata };
  }
  task.updatedAt = new Date();

  tasks.set(id, task);

  res.json({
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/v1/tasks/:id - Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  const id = getParam(req.params.id);

  if (!tasks.has(id)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `Task ${id} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  tasks.delete(id);

  res.json({
    success: true,
    data: { success: true },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/tasks/:id/pause - Pause task
router.post('/:id/pause', async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const task = tasks.get(id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `Task ${id} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (task.status !== TaskStatus.RUNNING && task.status !== TaskStatus.PENDING) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot pause task in status: ${task.status}`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  task.status = TaskStatus.PAUSED;
  task.updatedAt = new Date();
  tasks.set(id, task);

  res.json({
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/tasks/:id/resume - Resume task
router.post('/:id/resume', async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const task = tasks.get(id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `Task ${id} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (task.status !== TaskStatus.PAUSED) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot resume task in status: ${task.status}`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  task.status = TaskStatus.RUNNING;
  task.updatedAt = new Date();
  tasks.set(id, task);

  res.json({
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/tasks/:id/confirm - Confirm action
router.post('/:id/confirm', async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const { action, payload } = req.body;
  const task = tasks.get(id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `Task ${id} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (!['approve', 'reject', 'modify'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'action must be one of: approve, reject, modify',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
