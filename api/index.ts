/**
 * Vercel API Handler
 * 
 * This file handles requests to /api/* routes on Vercel
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory task storage (for serverless)
const tasks: Map<string, any> = new Map();

// Simple UUID generator
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Task statuses
const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse URL to get path
  const path = url?.split('?')[0] || '/';
  
  // Routes
  if (path === '/api/v1/tasks' && method === 'GET') {
    return getTasks(req, res);
  }
  
  if (path === '/api/v1/tasks' && method === 'POST') {
    return createTask(req, res);
  }
  
  if (path.match(/^\/api\/v1\/tasks\/[\w-]+$/) && method === 'GET') {
    const taskId = path.split('/').pop();
    return getTask(taskId!, res);
  }
  
  // SSE Chat Stream endpoint (支持 /api/chat-stream 和 /api/v1/chat-stream)
  if ((path === '/api/chat-stream' || path === '/api/v1/chat-stream') && method === 'POST') {
    return chatStream(req, res);
  }
  
  // Health check
  if (path === '/api/health') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  
  // 文件相关 API
  // GET /api/files - 获取文件列表
  if (path === '/api/files' && method === 'GET') {
    return getFileList(req, res);
  }
  
  // GET /api/file/* - 获取单个文件内容
  if (path.startsWith('/api/file/') && method === 'GET') {
    const filePath = path.replace('/api/file/', '');
    return getFileContent(req, res, filePath);
  }
  
  return res.status(404).json({ error: 'Not found' });
}

// GET /api/v1/tasks
async function getTasks(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;
  
  let taskList = Array.from(tasks.values());
  
  if (userId) {
    taskList = taskList.filter(task => task.userId === userId);
  }
  
  taskList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return res.status(200).json({
    success: true,
    data: taskList,
    timestamp: new Date().toISOString()
  });
}

// POST /api/v1/tasks
async function createTask(req: VercelRequest, res: VercelResponse) {
  const { userId, channel, message, metadata } = req.body;
  
  if (!userId || !channel || !message) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'userId, channel, and message are required' }
    });
  }
  
  const taskId = generateId();
  const now = new Date();
  
  const task = {
    id: taskId,
    userId,
    channel,
    input: message,
    status: TaskStatus.PENDING,
    currentStep: 0,
    subtasks: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    metadata: metadata || {},
    think: 'Analyzing your request...'
  };
  
  tasks.set(taskId, task);
  
  // Simulate task processing in background
  simulateTask(taskId, message);
  
  return res.status(201).json({
    success: true,
    data: task,
    timestamp: now.toISOString()
  });
}

// GET /api/v1/tasks/:id
async function getTask(taskId: string, res: VercelResponse) {
  const task = tasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found' }
    });
  }
  
  return res.status(200).json({
    success: true,
    data: task,
    timestamp: new Date().toISOString()
  });
}

// SSE Chat Stream - 流式输出聊天响应
async function chatStream(req: VercelRequest, res: VercelResponse) {
  const { message, userId = 'default' } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'message is required' }
    });
  }
  
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // 发送连接成功消息
  res.write('data: {"type":"connected","message":"Connected to stream"}\n\n');
  
  // 模拟 AI 流式响应 - 分块发送
  const aiResponse = await generateAIResponse(message);
  const chunks = splitIntoChunks(aiResponse);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLast = i === chunks.length - 1;
    
    // 发送数据块
    const data = JSON.stringify({
      type: isLast ? 'done' : 'chunk',
      content: chunk,
      index: i,
      total: chunks.length
    });
    
    res.write(`data: ${data}\n\n`);
    
    // 模拟打字机效果延迟
    if (!isLast) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
  }
  
  // 发送完成信号
  res.write('data: {"type":"complete"}\n\n');
  
  // 结束响应
  res.end();
}

// 模拟 AI 生成响应
async function generateAIResponse(userMessage: string): Promise<string> {
  // 实际项目中这里会调用 OpenClaw 或其他 AI API
  const responses: Record<string, string> = {
    'hello': '你好！我是 Manus AI 助手。有什么我可以帮助你的吗？',
    'help': '我可以帮助你完成各种任务，比如：\n\n1. 📝 撰写文档\n2. 🔍 搜索信息\n3. 📊 数据分析\n4. 💻 编写代码\n\n请告诉我你需要什么帮助！',
    'time': `当前时间是：${new Date().toLocaleString('zh-CN')}`,
  };
  
  // 检查是否有匹配的预设回复
  const lowerMessage = userMessage.toLowerCase();
  for (const [key, value] of Object.entries(responses)) {
    if (lowerMessage.includes(key)) {
      return value;
    }
  }
  
  // 默认回复
  return `收到你的消息：「${userMessage}」\n\n我正在学习如何更好地回答你的问题。\n\n作为示例，我可以告诉你：\n- 这是一个 SSE 流式输出演示\n- 消息会逐字（ chunk ）显示出来\n- 模拟了打字机的效果\n\n你可以尝试发送 "hello"、"help" 或 "time" 来看看不同的响应。`;
}

// 将文本分割成多个块，模拟流式输出
function splitIntoChunks(text: string, chunkSize: number = 5): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // 按字符逐个处理，模拟更自然的流式效果
  for (let i = 0; i < text.length; i++) {
    currentChunk += text[i];
    
    // 在标点符号或每 N 个字符处分割
    if (
      text[i] === '。' || 
      text[i] === '！' || 
      text[i] === '？' || 
      text[i] === '\n' ||
      (currentChunk.length >= chunkSize && text[i] === ' ')
    ) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
  }
  
  // 添加剩余内容
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Simulate task processing
function simulateTask(taskId: string, message: string) {
  const steps = [
    { think: `Analyzing: ${message}\n\nI'll help you with this task.`, subtasks: [
      { id: '1', description: 'Searching information', status: 'running' },
      { id: '2', description: 'Analyzing data', status: 'pending' },
      { id: '3', description: 'Generating results', status: 'pending' }
    ]},
    { subtasks: [
      { id: '1', description: 'Searching information', status: 'completed' },
      { id: '2', description: 'Analyzing data', status: 'running' },
      { id: '3', description: 'Generating results', status: 'pending' }
    ]},
    { subtasks: [
      { id: '1', description: 'Searching information', status: 'completed' },
      { id: '2', description: 'Analyzing data', status: 'completed' },
      { id: '3', description: 'Generating results', status: 'completed' }
    ]},
    { status: TaskStatus.COMPLETED, result: { message: 'Task completed!', summary: message } }
  ];
  
  let step = 0;
  const interval = setInterval(() => {
    step++;
    if (step >= steps.length) {
      clearInterval(interval);
      return;
    }
    
    const task = tasks.get(taskId);
    if (task) {
      Object.assign(task, steps[step]);
      task.updatedAt = new Date().toISOString();
      tasks.set(taskId, task);
    }
  }, 3000);
}

// ==================== 文件相关函数 ====================

// 工作目录（可以根据环境配置）
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/tmp/manus-workspace';

// 确保工作目录存在
import * as fs from 'fs';
import * as path from 'path';

function ensureWorkspaceDir() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    // 创建示例文件
    fs.writeFileSync(path.join(WORKSPACE_DIR, 'README.md'), '# Manus Workspace\n\nWelcome to Manus!');
    fs.writeFileSync(path.join(WORKSPACE_DIR, 'example.js'), 'console.log("Hello, Manus!");\n\nfunction add(a, b) {\n  return a + b;\n}');
    fs.writeFileSync(path.join(WORKSPACE_DIR, 'data.json'), JSON.stringify({ name: 'Manus', version: '1.0' }, null, 2));
  }
}

// 初始化工作目录
ensureWorkspaceDir();

// 获取文件列表
async function getFileList(req: VercelRequest, res: VercelResponse) {
  try {
    const files = getFilesRecursive(WORKSPACE_DIR, WORKSPACE_DIR);
    return res.status(200).json({
      success: true,
      data: files,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FILE_ERROR', message: String(error) }
    });
  }
}

// 递归获取文件列表
function getFilesRecursive(dir: string, baseDir: string): any[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const files: any[] = [];
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (item.isDirectory()) {
      files.push({
        id: relativePath,
        name: item.name,
        type: 'folder',
        path: relativePath,
        children: getFilesRecursive(fullPath, baseDir)
      });
    } else {
      const ext = path.extname(item.name).toLowerCase();
      let icon = '📄';
      if (['.ts', '.tsx'].includes(ext)) icon = '⚛️';
      else if (['.js', '.jsx'].includes(ext)) icon = '📜';
      else if (['.py'].includes(ext)) icon = '🐍';
      else if (['.json'].includes(ext)) icon = '📦';
      else if (['.md'].includes(ext)) icon = '📝';
      else if (['.html'].includes(ext)) icon = '🌐';
      else if (['.css'].includes(ext)) icon = '🎨';
      
      files.push({
        id: relativePath,
        name: item.name,
        type: 'file',
        path: relativePath,
        icon
      });
    }
  }
  
  return files;
}

// 获取文件内容
async function getFileContent(req: VercelRequest, res: VercelResponse, filePath: string) {
  try {
    // 安全检查：防止路径遍历攻击
    const sanitizedPath = filePath.replace(/\.\./g, '');
    const fullPath = path.join(WORKSPACE_DIR, sanitizedPath);
    
    // 确保文件在工作目录内
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found' }
      });
    }
    
    const stat = fs.statSync(fullPath);
    
    // 如果是目录，返回文件列表
    if (stat.isDirectory()) {
      const files = getFilesRecursive(fullPath, WORKSPACE_DIR);
      return res.status(200).json({
        success: true,
        data: { type: 'folder', files },
        timestamp: new Date().toISOString()
      });
    }
    
    // 如果是文件，返回内容
    const ext = path.extname(fullPath).toLowerCase();
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // 根据文件类型设置 Content-Type
    let contentType = 'text/plain';
    if (['.html', '.htm'].includes(ext)) contentType = 'text/html';
    else if (['.css'].includes(ext)) contentType = 'text/css';
    else if (['.js'].includes(ext)) contentType = 'application/javascript';
    else if (['.json'].includes(ext)) contentType = 'application/json';
    else if (['.png'].includes(ext)) contentType = 'image/png';
    else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (['.gif'].includes(ext)) contentType = 'image/gif';
    else if (['.pdf'].includes(ext)) contentType = 'application/pdf';
    
    return res.status(200).json({
      success: true,
      data: {
        type: 'file',
        name: path.basename(fullPath),
        path: sanitizedPath,
        content,
        contentType,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FILE_ERROR', message: String(error) }
    });
  }
}
