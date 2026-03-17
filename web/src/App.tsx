// @ts-nocheck
import { useState, useEffect } from 'react';
import './App.css';

interface Task {
  id: string;
  input: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  think?: string;
  result?: any;
  subtasks?: any[];
  createdAt: string;
}

const EXAMPLES = [
  { icon: '📊', text: 'Create slides', query: 'Create a presentation about AI trends' },
  { icon: '🌐', text: 'Build website', query: 'Build a personal portfolio website' },
  { icon: '💻', text: 'Develop apps', query: 'Develop a Python data analysis script' },
  { icon: '🎨', text: 'Design', query: 'Design a logo for my startup' },
  { icon: '📈', text: 'Analyze data', query: 'Analyze the stock market trends for NVDA' },
  { icon: '🔍', text: 'Research', query: 'Research the latest AI developments in 2026' },
];

const API_BASE = 'https://manus-style.vercel.app/api/v1';

function App() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { loadTasks(); }, []);
  
  useEffect(() => {
    if (selectedTask?.status === 'running') {
      const interval = setInterval(() => refreshTask(selectedTask.id), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedTask?.status]);

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks?userId=demo`);
      const data = await res.json();
      if (data.success && data.data) setTasks(data.data.slice(0, 10));
    } catch (e) { console.log('Local mode'); }
  };

  const refreshTask = async (taskId: string) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(prev => prev.map(t => t.id === taskId ? data.data : t));
        setSelectedTask(prev => prev?.id === taskId ? data.data : prev);
      }
    } catch (e) { console.error('Refresh failed'); }
  };

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isProcessing) return;
    setIsProcessing(true);
    
    const newTask: Task = {
      id: `task_${Date.now()}`,
      input: query,
      status: 'running',
      createdAt: new Date().toISOString(),
      think: 'Analyzing your request...',
      subtasks: [
        { id: '1', description: 'Planning the task', status: 'running' },
        { id: '2', description: 'Executing subtasks', status: 'pending' },
        { id: '3', description: 'Generating results', status: 'pending' },
      ]
    };
    
    setTasks(prev => [newTask, ...prev]);
    setSelectedTask(newTask);
    setInput('');

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo', channel: 'web', message: query })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, id: data.data.id } : t));
        setSelectedTask(prev => prev?.id === newTask.id ? { ...prev, id: data.data.id } : prev);
        pollTaskStatus(data.data.id);
      } else { throw new Error('Failed'); }
    } catch (e) { simulateTask(newTask.id, query); }
    setIsProcessing(false);
  };

  const pollTaskStatus = (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/tasks/${taskId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setTasks(prev => prev.map(t => t.id === taskId ? data.data : t));
          setSelectedTask(prev => prev?.id === taskId ? data.data : prev);
          if (data.data.status === 'completed' || data.data.status === 'failed') clearInterval(interval);
        }
      } catch (e) {}
    }, 2000);
  };

  const simulateTask = (taskId: string, query: string) => {
    const steps = [
      { think: `Analyzing: ${query}\n\nI'll help you with this task.` },
      { subtasks: [
        { id: '1', description: 'Searching information', status: 'completed' },
        { id: '2', description: 'Analyzing data', status: 'running' },
        { id: '3', description: 'Generating results', status: 'pending' },
      ]},
      { subtasks: [
        { id: '1', description: 'Searching information', status: 'completed' },
        { id: '2', description: 'Analyzing data', status: 'completed' },
        { id: '3', description: 'Generating results', status: 'completed' },
      ]},
      { status: 'completed', result: { message: 'Task completed!', summary: query } }
    ];
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= steps.length) { clearInterval(interval); return; }
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...steps[step] } : t));
      setSelectedTask(prev => prev?.id === taskId ? { ...prev, ...steps[step] } : prev);
    }, 2500);
  };

  return (
    <div className="app">
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
        <div className="status"><span className="status-dot"></span>Ready</div>
      </header>

      <main className="main">
        <section className="hero">
          <h1>What can I do for you?</h1>
          <p>Assign a task or ask anything</p>
          <div className="input-box">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit(input)} placeholder="Describe what you want me to do..." disabled={isProcessing} />
            <button onClick={() => handleSubmit(input)} disabled={!input.trim() || isProcessing}>{isProcessing ? '⏳' : '➤'}</button>
          </div>
          <div className="quick-actions">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => handleSubmit(ex.query)} disabled={isProcessing}><span>{ex.icon}</span><span>{ex.text}</span></button>
            ))}
          </div>
        </section>

        <div className="content-grid">
          <aside className="tasks-sidebar">
            <h2>Recent Tasks</h2>
            <div className="task-list">
              {tasks.length === 0 ? <p className="empty">No tasks yet</p> : tasks.map(task => (
                <div key={task.id} className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''} ${task.status}`} onClick={() => setSelectedTask(task)}>
                  <span className="task-status">{task.status === 'completed' ? '✅' : task.status === 'failed' ? '❌' : task.status === 'running' ? '🔄' : '⏳'}</span>
                  <span className="task-input">{task.input}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="task-detail">
            {selectedTask ? (
              <div className="detail-content">
                <div className="detail-header">
                  <h3>{selectedTask.input}</h3>
                  <span className={`status-badge ${selectedTask.status}`}>{selectedTask.status === 'completed' ? '✅ Completed' : selectedTask.status === 'failed' ? '❌ Failed' : selectedTask.status === 'running' ? '🔄 Running' : '⏳ Pending'}</span>
                </div>
                {selectedTask.think && (
                  <div className="think-section"><h4>🤔 Thinking</h4><pre>{selectedTask.think}</pre></div>
                )}
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <div className="subtasks-section">
                    <h4>📋 Steps</h4>
                    {selectedTask.subtasks.map(st => (
                      <div key={st.id} className={`subtask-item ${st.status}`}>
                        <span>{st.status === 'completed' ? '✅' : st.status === 'running' ? '🔄' : '⏳'}</span>
                        <span>{st.description}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedTask.status === 'running' && <div className="progress"><div className="progress-bar"></div><span>AI is processing...</span></div>}
                {selectedTask.status === 'completed' && selectedTask.result && <div className="result"><h4>✅ Result</h4><pre>{JSON.stringify(selectedTask.result, null, 2)}</pre></div>}
                {selectedTask.status === 'failed' && <div className="error-result"><h4>❌ Error</h4><pre>{selectedTask.result?.error || 'Task failed'}</pre></div>}
              </div>
            ) : (
              <div className="empty-state"><span className="icon">🤖</span><h3>Ready to help</h3><p>Select a task or create a new one</p></div>
            )}
          </section>
        </div>
      </main>
      <footer className="footer"><p>Powered by OpenClaw + MiniMax-CN 2.5</p></footer>
    </div>
  );
}

export default App;
