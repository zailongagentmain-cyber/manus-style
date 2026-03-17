import React, { useEffect, useRef } from 'react';
import type { Task } from '../api/client';
import './ChatMessages.css';

interface ChatMessagesProps {
  tasks: Task[];
  selectedTask: Task | null;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ tasks: _tasks, selectedTask }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedTask]);

  if (!selectedTask) {
    return (
      <div className="chat-messages-empty">
        <div className="empty-icon">💬</div>
        <p>选择一个任务查看对话历史</p>
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {/* 用户消息 - 任务输入 */}
      <div className="message user-message">
        <div className="message-avatar">👤</div>
        <div className="message-content">
          <div className="message-header">
            <span className="message-sender">你</span>
            <span className="message-time">
              {new Date(selectedTask.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="message-text">
            {selectedTask.input || selectedTask.description}
          </div>
        </div>
      </div>

      {/* AI 思考过程 */}
      {selectedTask.status === 'running' && (
        <div className="message ai-message thinking">
          <div className="message-avatar">🤖</div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">AI 助手</span>
              <span className="message-status">思考中...</span>
            </div>
            <div className="message-thinking">
              <span className="thinking-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI 消息 - 执行步骤 */}
      {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
        <div className="message ai-message">
          <div className="message-avatar">🤖</div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">AI 助手</span>
              <span className="message-time">
                {new Date(selectedTask.updatedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-steps">
              <p>我来帮你完成这个任务：</p>
              {selectedTask.subtasks.map((sub: any, idx: number) => (
                <div key={sub.id || idx} className={`step-item ${sub.status}`}>
                  <span className="step-status">
                    {sub.status === 'completed' ? '✅' : sub.status === 'running' ? '🔄' : '⏳'}
                  </span>
                  <span className="step-text">{sub.description || sub.agent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI 消息 - 执行结果 */}
      {selectedTask.status === 'completed' && selectedTask.result && (
        <div className="message ai-message result">
          <div className="message-avatar">🤖</div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">AI 助手</span>
              <span className="message-time">
                {new Date(selectedTask.updatedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-result">
              <p>✅ 任务完成！</p>
              <pre>{JSON.stringify(selectedTask.result, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
