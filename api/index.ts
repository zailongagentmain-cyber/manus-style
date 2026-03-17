/**
 * Vercel API Handler
 * 
 * This file handles requests to /api/* routes on Vercel
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// In-memory task storage (for serverless)
const tasks: Map<string, any> = new Map();

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
  
  // Health check
  if (path === '/api/health') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
  
  const taskId = uuidv4();
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
