import React, { useEffect, useState } from 'react';
import type { Task } from '../api/client';
import { TaskProgress } from './TaskProgress';
import { ThinkBubble } from './ThinkBubble';
import { ResultViewer } from './ResultViewer';
import './TaskDetail.css';

interface TaskDetailProps {
  task: Task | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, loading, onRefresh }) => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh || !task || task.status === 'completed' || task.status === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      onRefresh?.();
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, task?.status, onRefresh]);

  if (loading) {
    return (
      <div className="task-detail-loading">
        <div className="spinner">⏳</div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-empty">
        <p>选择任务查看详情</p>
      </div>
    );
  }

  // 计算进度
  const getProgress = () => {
    if (task.progress !== undefined) return task.progress;
    if (task.status === 'completed') return 100;
    if (task.status === 'running') return 50;
    return 0;
  };

  const progress = getProgress();
  const taskInput = task.input || task.description || '无任务描述';

  return (
    <div className="task-detail">
      <div className="task-detail-header">
        <h2 className="task-detail-title">{taskInput}</h2>
        <div className="task-detail-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            自动刷新
          </label>
          <button className="refresh-btn" onClick={onRefresh}>🔄</button>
        </div>
      </div>

      <TaskProgress progress={progress} status={task.status} />

      {task.think && <ThinkBubble think={task.think} />}

      {/* 显示子任务列表 */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="subtask-list">
          <h3>执行步骤</h3>
          {task.subtasks.map((sub: any, idx: number) => (
            <div key={sub.id || idx} className={`subtask-item ${sub.status}`}>
              <span className="subtask-status">
                {sub.status === 'completed' ? '✅' : sub.status === 'running' ? '🔄' : '⏳'}
              </span>
              <span className="subtask-desc">{sub.description || sub.agent}</span>
              {sub.output && (
                <div className="subtask-output">{JSON.stringify(sub.output)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {task.result && <ResultViewer result={task.result} />}

      {task.status === 'failed' && (
        <div className="task-error">
          <span className="error-icon">❌</span>
          <span>任务执行失败</span>
        </div>
      )}
    </div>
  );
};
