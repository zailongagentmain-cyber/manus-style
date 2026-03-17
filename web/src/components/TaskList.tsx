import React from 'react';
import type { Task } from '../api/client';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  selectedId?: string;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onSelect, selectedId }) => {
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <p>暂无任务</p>
        <p className="hint">在上方输入框创建新任务</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <div
          key={task.id}
          className={`task-item ${selectedId === task.id ? 'selected' : ''}`}
          onClick={() => onSelect(task)}
        >
          <div className="task-icon">{getStatusIcon(task.status)}</div>
          <div className="task-info">
            <div className="task-description">{task.description}</div>
            <div className="task-meta">
              <span className={`task-status ${task.status}`}>{task.status}</span>
              <span className="task-time">{formatTime(task.createdAt)}</span>
            </div>
          </div>
          <div className="task-progress-mini">
            <div 
              className="progress-bar-mini" 
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
