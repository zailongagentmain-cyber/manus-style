import { useState, useEffect } from 'react';
import './App.css';

interface Task {
  id: string;
  input: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  createdAt: string;
}

const EXAMPLES = [
  { icon: '📊', text: 'Create slides', query: 'Create a presentation about AI trends' },
  { icon: '🌐', text: 'Build website', query: 'Build a personal portfolio website' },
  { icon: '💻', text: 'Develop apps', query: 'Develop a Python data analysis script' },
  { icon: '🎨', text: 'Design', query: 'Design a logo for my startup' },
  { icon: '📈', text: 'Analyze data', query: 'Analyze the stock market trends' },
  { icon: '🔍', text: 'Research', query: 'Research the latest AI developments' },
];

function App() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 从 API 加载任务
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('https://manus-style.vercel.app/api/v1/tasks?userId=demo');
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(data.data.slice(0, 10));
      }
    } catch (e) {
      console.log('Using local tasks');
    }
  };

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isProcessing) return;
    
    setIsProcessing(true);
    const newTask: Task = {
      id: `task_${Date.now()}`,
      input: query,
      status: 'running',
      createdAt: new Date().toISOString(),
    };
    
    setTasks(prev => [newTask, ...prev]);
    setSelectedTask(newTask);
    setInput('');

    // 模拟任务处理
    setTimeout(() => {
      setTasks(prev => prev.map(t => 
        t.id === newTask.id ? { ...t, status: 'completed', result: { message: 'Task completed!' } } : t
      ));
      setIsProcessing(false);
    }, 3000);
  };

  const handleQuickAction = (query: string) => {
    handleSubmit(query);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🧠</span>
          <span className="logo-text">Manus</span>
          <span className="logo-badge">Style</span>
        </div>
        <nav className="nav">
          <a href="#features">Features</a>
          <a href="#docs">Docs</a>
          <a href="#examples">Examples</a>
        </nav>
        <div className="status">
          <span className="status-dot"></span>
          Ready
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Hero */}
        <section className="hero">
          <h1>What can I do for you?</h1>
          <p>Assign a task or ask anything</p>
          
          <div className="input-box">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
              placeholder="Describe what you want me to do..."
              disabled={isProcessing}
            />
            <button 
              onClick={() => handleSubmit(input)}
              disabled={!input.trim() || isProcessing}
            >
              {isProcessing ? '⏳' : '➤'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => handleQuickAction(ex.query)} disabled={isProcessing}>
                <span>{ex.icon}</span>
                <span>{ex.text}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Tasks Sidebar */}
          <aside className="tasks-sidebar">
            <h2>Recent Tasks</h2>
            <div className="task-list">
              {tasks.length === 0 ? (
                <p className="empty">No tasks yet</p>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''} ${task.status}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <span className="task-status">
                      {task.status === 'completed' ? '✅' : 
                       task.status === 'running' ? '🔄' : '⏳'}
                    </span>
                    <span className="task-input">{task.input}</span>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Task Detail */}
          <section className="task-detail">
            {selectedTask ? (
              <div className="detail-content">
                <div className="detail-header">
                  <h3>{selectedTask.input}</h3>
                  <span className={`status-badge ${selectedTask.status}`}>
                    {selectedTask.status === 'completed' ? '✅ Completed' : 
                     selectedTask.status === 'running' ? '🔄 Running' : '⏳ Pending'}
                  </span>
                </div>
                
                {selectedTask.status === 'running' && (
                  <div className="progress">
                    <div className="progress-bar"></div>
                    <span>AI is thinking...</span>
                  </div>
                )}

                {selectedTask.status === 'completed' && (
                  <div className="result">
                    <h4>Result</h4>
                    <p>{selectedTask.result?.message || 'Task completed successfully!'}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <span className="icon">🤖</span>
                <h3>Ready to help</h3>
                <p>Select a task or create a new one</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Powered by OpenClaw + MiniMax-CN 2.5</p>
      </footer>
    </div>
  );
}

export default App;
