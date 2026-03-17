import { useState } from 'react';
import { TaskInput, TaskList, ChatMessages, ResultViewer } from '../components';
import { useTasks, useTask } from '../hooks/useTasks';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Task } from '../api/client';
import './Home.css';

export const Home = () => {
  const { tasks, loading, createTask, fetchTasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { task: currentTask, fetchTask } = useTask(selectedTask?.id || '');
  const { connected: isConnected } = useWebSocket(selectedTask?.id || '');

  const handleCreateTask = async (description: string) => {
    const task = await createTask(description);
    setSelectedTask(task);
    // 启动轮询获取更新
    pollTaskStatus();
  };

  const pollTaskStatus = () => {
    const interval = setInterval(async () => {
      await fetchTask();
      if (currentTask?.status === 'completed' || currentTask?.status === 'failed') {
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div className="home">
      {/* Header */}
      <header className="home-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🧠</span>
            <span className="logo-text">Manus</span>
            <span className="logo-badge">Style</span>
          </div>
        </div>
        <nav className="header-nav">
          <a href="#features" className="nav-link">Features</a>
          <a href="#docs" className="nav-link">Docs</a>
          <a href="#examples" className="nav-link">Examples</a>
        </nav>
        <div className="header-right">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        {/* Hero Section - Task Input */}
        <section className="hero-section">
          <h1 className="hero-title">What can I do for you?</h1>
          <p className="hero-subtitle">Assign a task or ask anything</p>
          
          <TaskInput onSubmit={handleCreateTask} loading={loading} />
          
          {/* Quick Actions */}
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => handleCreateTask('Create a presentation about AI trends')}>
              <span className="action-icon">📊</span>
              <span>Create slides</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleCreateTask('Build a personal portfolio website')}>
              <span className="action-icon">🌐</span>
              <span>Build website</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleCreateTask('Develop a Python data analysis script')}>
              <span className="action-icon">💻</span>
              <span>Develop apps</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleCreateTask('Design a logo for my startup')}>
              <span className="action-icon">🎨</span>
              <span>Design</span>
            </button>
            <button className="quick-action-btn more" onClick={() => handleCreateTask('')}>
              <span className="action-icon">➕</span>
              <span>More</span>
            </button>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="content-grid">
          {/* Left: Task List */}
          <aside className="task-sidebar">
            <div className="sidebar-header">
              <h2>Tasks</h2>
              <button className="refresh-btn" onClick={fetchTasks}>🔄</button>
            </div>
            <TaskList 
              tasks={tasks} 
              selectedId={selectedTask?.id || null}
              onSelect={(task) => setSelectedTask(task)}
            />
          </aside>

          {/* Right: Task Detail / Result */}
          <section className="task-detail">
            {currentTask ? (
              <>
                <div className="task-header">
                  <h2>Task: {currentTask.input || currentTask.description || 'Untitled'}</h2>
                  <div className={`task-status ${currentTask.status}`}>
                    {currentTask.status === 'pending' && '⏳ Pending'}
                    {currentTask.status === 'running' && '🔄 Running'}
                    {currentTask.status === 'completed' && '✅ Completed'}
                    {currentTask.status === 'failed' && '❌ Failed'}
                    {currentTask.status === 'paused' && '⏸️ Paused'}
                  </div>
                </div>
                
                {/* Progress */}
                {currentTask.status === 'running' && (
                  <div className="task-progress-bar">
                    <div className="progress-animated"></div>
                    <span>AI is thinking...</span>
                  </div>
                )}

                {/* Chat Messages */}
                <ChatMessages 
                  tasks={tasks}
                  selectedTask={currentTask}
                />

                {/* Results */}
                {currentTask.status === 'completed' && currentTask.result && (
                  <ResultViewer result={currentTask.result} />
                )}

                {/* Error */}
                {currentTask.status === 'failed' && currentTask.error && (
                  <div className="error-message">
                    <h3>❌ Error</h3>
                    <p>{currentTask.error}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🤖</div>
                <h3>Ready to help</h3>
                <p>Select a task from the list or create a new one above</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <p>Powered by OpenClaw + MiniMax-CN 2.5</p>
      </footer>
    </div>
  );
};
