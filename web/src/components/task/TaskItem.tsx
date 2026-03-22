// @ts-nocheck
import { Task } from '../../api/client';
import './TaskItem.css';

export interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onClick?: () => void;
}

const STATUS_CONFIG = {
  pending: { icon: '⏳', label: 'Pending', className: 'pending' },
  running: { icon: '🔄', label: 'Running', className: 'running' },
  completed: { icon: '✅', label: 'Completed', className: 'completed' },
  failed: { icon: '❌', label: 'Failed', className: 'failed' },
  paused: { icon: '⏸️', label: 'Paused', className: 'paused' },
};

export function TaskItem({ task, isSelected = false, onClick }: TaskItemProps) {
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  
  // Truncate input for display
  const displayInput = task.input.length > 50 
    ? task.input.substring(0, 50) + '...' 
    : task.input;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`task-item ${status.className} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span className="task-status-icon">{status.icon}</span>
      <div className="task-content">
        <span className="task-input">{displayInput}</span>
        <span className="task-time">{formatTime(task.createdAt)}</span>
      </div>
      <span className={`status-badge ${status.className}`}>{status.label}</span>
    </div>
  );
}
