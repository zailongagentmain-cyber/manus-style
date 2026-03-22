// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  taskId: string | null;
  onClose: () => void;
  apiBase?: string;
}

export function ChatInterface({ taskId, onClose, apiBase = 'http://localhost:3001/api/v1' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskStatus, setTaskStatus] = useState<string>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载任务状态和已有消息
  useEffect(() => {
    if (taskId) {
      loadTaskStatus();
      // 轮询任务状态
      const interval = setInterval(loadTaskStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [taskId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTaskStatus = async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`${apiBase}/tasks/${taskId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTaskStatus(data.data.status);
        
        // 如果有新的 think 更新，添加到消息
        if (data.data.think) {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === 'assistant') {
            // 更新最后一条消息
            setMessages(prev => prev.map((m, i) => 
              i === prev.length - 1 ? { ...m, content: data.data.think } : m
            ));
          } else if (data.data.think) {
            // 添加新消息
            addMessage('assistant', data.data.think);
          }
        }
        
        // 如果任务完成，添加结果
        if (data.data.status === 'completed' && data.data.result) {
          addMessage('assistant', `✅ 任务完成！\n\n${JSON.stringify(data.data.result, null, 2)}`);
        }
      }
    } catch (e) {
      console.error('Failed to load task:', e);
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => {
      // 避免重复添加相同内容
      if (prev.length > 0 && prev[prev.length - 1].content === content) {
        return prev;
      }
      return [...prev, {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        timestamp: new Date()
      }];
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userInput = input.trim();
    setInput('');
    addMessage('user', userInput);
    setIsProcessing(true);

    try {
      // 如果没有任务 ID，创建新任务
      if (!taskId) {
        const res = await fetch(`${apiBase}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: 'demo', 
            channel: 'web', 
            message: userInput 
          })
        });
        const data = await res.json();
        if (data.success && data.data) {
          // 保存新创建的任务ID到 localStorage
          localStorage.setItem('manus_task_id', data.data.id);
          addMessage('assistant', '🤔 正在分析您的任务...\n\n任务已创建，正在执行中...');
        }
      } else {
        // 已有任务，发送继续执行的请求
        // TODO: 实现任务继续接口
        addMessage('assistant', '任务正在执行中，请稍候...');
      }
    } catch (e) {
      addMessage('assistant', `❌ 发生错误: ${e}`);
    }
    
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <span className="chat-title">💬 对话式任务</span>
        <div className="chat-status">
          <span className={`status-dot ${taskStatus}`}></span>
          <span>{taskStatus === 'running' ? '执行中' : taskStatus === 'completed' ? '已完成' : '等待中'}</span>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <span className="welcome-icon">🤖</span>
            <p>你好！我是 Manus-Style AI 助手</p>
            <p className="welcome-hint">请描述你想要完成的任务</p>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <pre>{msg.content}</pre>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你想要完成的任务..."
          disabled={isProcessing}
          rows={2}
        />
        <button 
          onClick={handleSend} 
          disabled={!input.trim() || isProcessing}
          className="send-btn"
        >
          {isProcessing ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}
