import React from 'react';
import './TaskProgress.css';

interface TaskProgressProps {
  progress?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ progress = 0, status }) => {
  // 计算实际进度
  let displayProgress = progress;
  if (status === 'completed') displayProgress = 100;
  else if (status === 'failed') displayProgress = 0;
  else if (status === 'pending') displayProgress = 0;
  // running 状态保持传入的值

  return (
    <div className="task-progress">
      <div className="progress-header">
        <span className="progress-label">执行进度</span>
        <span className="progress-percent">{Math.round(displayProgress)}%</span>
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill ${status}`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      <div className="progress-status">
        {status === 'pending' && '等待执行'}
        {status === 'running' && '正在执行...'}
        {status === 'completed' && '✅ 已完成'}
        {status === 'failed' && '❌ 执行失败'}
      </div>
    </div>
  );
};
