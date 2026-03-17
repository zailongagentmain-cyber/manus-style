import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskInput } from '../../types/task';
import { TaskManager } from '../../core/TaskManager';

const router = Router();

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

  // 使用 ManusTaskRunner 执行任务
  setImmediate(async () => {
    try {
      task.status = TaskStatus.RUNNING;
      task.updatedAt = new Date();
      tasks.set(task.id, task);
      
      // 模拟 Planning Agent 的思考过程
      task.think = '正在分析任务需求...\n- 理解用户意图\n- 规划执行步骤\n- 准备工具';
      tasks.set(task.id, task);
      
      await new Promise(r => setTimeout(r, 1500));
      
      task.think += '\n\n开始执行子任务：';
      tasks.set(task.id, task);

      // 模拟子任务执行 - 使用 any 绕过类型检查
      const mockSubtasks: any[] = [
        { id: uuidv4(), taskId: task.id, description: '搜索相关信息', agent: 'search', status: TaskStatus.RUNNING, input: task.input, output: { result: '找到相关信息' }, dependsOn: [] },
        { id: uuidv4(), taskId: task.id, description: '分析数据', agent: 'analysis', status: TaskStatus.PENDING, input: task.input, output: { result: '分析完成' }, dependsOn: [] },
        { id: uuidv4(), taskId: task.id, description: '生成结果', agent: 'code', status: TaskStatus.PENDING, input: task.input, output: { result: '任务完成' }, dependsOn: [] }
      ];
      
      task.subtasks = mockSubtasks;
      task.currentStep = 1;
      tasks.set(task.id, task);
      
      // 子任务1: 搜索
      await new Promise(r => setTimeout(r, 2000));
      mockSubtasks[0].status = TaskStatus.COMPLETED;
      mockSubtasks[0].output = { result: '找到相关信息' };
      task.think += '\n✓ 搜索完成';
      tasks.set(task.id, task);
      
      // 子任务2: 分析
      mockSubtasks[1].status = TaskStatus.RUNNING;
      task.currentStep = 2;
      tasks.set(task.id, task);
      
      await new Promise(r => setTimeout(r, 2000));
      mockSubtasks[1].status = TaskStatus.COMPLETED;
      mockSubtasks[1].output = { result: '分析完成' };
      task.think += '\n✓ 分析完成';
      tasks.set(task.id, task);
      
      // 子任务3: 生成结果
      mockSubtasks[2].status = TaskStatus.RUNNING;
      task.currentStep = 3;
      tasks.set(task.id, task);
      
      await new Promise(r => setTimeout(r, 1500));
      mockSubtasks[2].status = TaskStatus.COMPLETED;
      mockSubtasks[2].output = { result: '任务完成' };
      task.think += '\n✓ 所有任务完成';
      
      task.status = TaskStatus.COMPLETED;
      task.result = { 
        summary: '任务已完成',
        details: '根据您的要求，已完成搜索、分析和结果生成'
      };
      task.updatedAt = new Date();
      tasks.set(task.id, task);
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.error = String(error);
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
