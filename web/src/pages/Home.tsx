import { useState } from 'react';
import { TaskInput, TaskList, ChatMessages } from '../components';
import { useTasks, useTask } from '../hooks/useTasks';
import type { Task } from '../api/client';
import './Home.css';

export const Home = () => {
  const { tasks, loading, error, createTask, fetchTasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { task: currentTask, loading: _detailLoading, fetchTask } = useTask(selectedTask?.id || '');

  const handleCreateTask = async (description: string) => {
    const task = await createTask(description);
    setSelectedTask(task);
    // 启动轮询获取更新
    const pollInterval = setInterval(async () => {
      await fetchTask();
      if (currentTask?.status === 'completed' || currentTask?.status === 'failed') {
        clearInterval(pollInterval);
      }
    }, 2000);
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleRefresh = () => {
    fetchTasks();
    if (selectedTask?.id) {
      fetchTask();
    }
  };

  return (
    <div className="home">
      <header className="home-header">
        <h1 className="app-title">🤖 Manus Style</h1>
        <p className="app-subtitle">AI 任务执行系统</p>
      </header>

      <main className="home-main">
        <section className="task-input-section">
          <TaskInput onSubmit={handleCreateTask} disabled={loading} />
        </section>

        {error && <div className="error-banner">{error}</div>}

        <div className="content-grid three-columns">
          {/* 左侧：任务列表 */}
          <aside className="task-list-panel">
            <h3 className="panel-title">任务列表</h3>
            <TaskList
              tasks={tasks}
              onSelect={handleSelectTask}
              selectedId={selectedTask?.id}
            />
          </aside>

          {/* 中间：聊天区域 */}
          <section className="chat-panel">
            <ChatMessages 
              tasks={tasks} 
              selectedTask={currentTask || selectedTask} 
            />
          </section>

          {/* 右侧：详细信息 */}
          <section className="task-detail-panel">
            <div className="detail-header">
              <h3>执行详情</h3>
              <button className="refresh-btn" onClick={handleRefresh}>🔄</button>
            </div>
            {currentTask && (
              <div className="detail-content">
                <div className="detail-status">
                  <span className={`status-badge ${currentTask.status}`}>
                    {currentTask.status === 'pending' && '⏳ 等待中'}
                    {currentTask.status === 'running' && '🔄 执行中'}
                    {currentTask.status === 'completed' && '✅ 完成'}
                    {currentTask.status === 'failed' && '❌ 失败'}
                  </span>
                </div>
                <div className="detail-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${currentTask.status}`}
                      style={{ 
                        width: currentTask.status === 'completed' ? '100%' : 
                               currentTask.status === 'running' ? '50%' : '0%' 
                      }}
                    />
                  </div>
                </div>
                {currentTask.result && (
                  <div className="detail-result">
                    <h4>结果</h4>
                    <pre>{JSON.stringify(currentTask.result, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
