import axios from 'axios';

// Use relative path for API (works both locally and on Vercel)
const API_BASE = '/api/v1';

export interface Task {
  id: string;
  userId: string;
  channel: string;
  input: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress?: number;
  currentStep: number;
  subtasks: any[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
  think?: string;
  metadata?: Record<string, any>;
}

export const api = {
  // 获取任务列表
  getTasks: async (userId: string = 'default'): Promise<Task[]> => {
    const res = await axios.get(`${API_BASE}/tasks?userId=${userId}`);
    return res.data.data || [];
  },

  // 获取单个任务
  getTask: async (id: string): Promise<Task> => {
    const res = await axios.get(`${API_BASE}/tasks/${id}`);
    return res.data.data;
  },

  // 创建任务
  createTask: async (message: string, userId: string = 'default'): Promise<Task> => {
    const res = await axios.post(`${API_BASE}/tasks`, {
      userId,
      channel: 'web',
      message
    });
    return res.data.data;
  },

  // 取消任务
  cancelTask: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/tasks/${id}`);
  },

  // 暂停任务
  pauseTask: async (id: string): Promise<void> => {
    await axios.post(`${API_BASE}/tasks/${id}/pause`);
  },

  // 恢复任务
  resumeTask: async (id: string): Promise<void> => {
    await axios.post(`${API_BASE}/tasks/${id}/resume`);
  },
};
