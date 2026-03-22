// @ts-nocheck
import { Task } from '../../api/client';
import { TaskItem, TaskItemProps } from './TaskItem';
import './TaskList.css';

export interface TaskListProps {
  tasks: Task[];
  selectedTaskId?: string;
  onTaskSelect?: (task: Task) => void;
  filterStatus?: Task['status'] | 'all';
  onFilterChange?: (status: Task['status'] | 'all') => void;
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
] as const;

export function TaskList({ 
  tasks, 
  selectedTaskId, 
  onTaskSelect,
  filterStatus = 'all',
  onFilterChange
}: TaskListProps) {
  // Filter tasks by status
  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h2>Recent Tasks</h2>
        {onFilterChange && (
          <div className="filter-tabs">
            {FILTERS.map(filter => (
              <button
                key={filter.value}
                className={`filter-tab ${filterStatus === filter.value ? 'active' : ''}`}
                onClick={() => onFilterChange(filter.value as Task['status'] | 'all')}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <span className="icon">📋</span>
            <p>No tasks yet</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onClick={() => onTaskSelect?.(task)}
            />
          ))
        )}
      </div>
      
      {filteredTasks.length > 0 && (
        <div className="task-list-footer">
          <span>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
