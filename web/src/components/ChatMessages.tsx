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
        <p>Select a task to view the conversation</p>
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {/* User Message */}
      <div className="message user-message">
        <div className="message-avatar">👤</div>
        <div className="message-content">
          <div className="message-header">
            <span className="message-sender">You</span>
            <span className="message-time">
              {new Date(selectedTask.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="message-text">
            {selectedTask.input || selectedTask.description || 'No description'}
          </div>
        </div>
      </div>

      {/* AI Thinking Process */}
      {selectedTask.status === 'running' && (
        <div className="message ai-thinking">
          <div className="message-avatar">🤖</div>
          <div className="message-content thinking-content">
            <div className="thinking-header">
              <span className="thinking-label">AI is thinking</span>
              <span className="thinking-status">Processing...</span>
            </div>
            {selectedTask.think && (
              <div className="thinking-text">
                {selectedTask.think}
              </div>
            )}
            <div className="thinking-steps">
              {selectedTask.subtasks?.map((subtask, index) => (
                <div key={index} className={`step-item ${subtask.status}`}>
                  <span className="step-icon">
                    {subtask.status === 'completed' ? '✅' : 
                     subtask.status === 'running' ? '🔄' : '⏳'}
                  </span>
                  <span className="step-text">{subtask.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Response */}
      {(selectedTask.status === 'completed' || selectedTask.status === 'running') && (
        <div className="message ai-message">
          <div className="message-avatar">🤖</div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">Manus Style</span>
              <span className="message-time">
                {selectedTask.updatedAt ? new Date(selectedTask.updatedAt).toLocaleTimeString() : ''}
              </span>
            </div>
            {selectedTask.think && (
              <div className="message-think">
                <span className="think-label">Thinking:</span>
                {selectedTask.think}
              </div>
            )}
            {selectedTask.result && (
              <div className="message-result">
                {typeof selectedTask.result === 'string' ? selectedTask.result : JSON.stringify(selectedTask.result, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
