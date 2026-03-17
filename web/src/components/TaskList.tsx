import React from 'react';
import type { Task } from '../api/client';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, selectedId, onSelect }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'paused': return '⏸️';
      default: return '📋';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <p>No tasks yet</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`task-item ${selectedId === task.id ? 'selected' : ''} ${task.status}`}
          onClick={() => onSelect(task)}
        >
          <div className="task-item-header">
            <span className="task-status-icon">{getStatusIcon(task.status)}</span>
            <span className="task-time">{formatTime(task.createdAt)}</span>
          </div>
          <div className="task-preview">
            {task.input || task.description || 'Untitled task'}
          </div>
          {task.status === 'running' && (
            <div className="task-running-indicator">
              <span className="pulse-dot"></span>
              Processing
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
