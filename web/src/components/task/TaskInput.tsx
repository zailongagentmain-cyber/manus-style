// @ts-nocheck
import { useState, KeyboardEvent } from 'react';
import './TaskInput.css';

export interface TaskInputProps {
  onSubmit: (message: string) => void;
  isProcessing?: boolean;
}

const EXAMPLES = [
  { icon: '📊', text: 'Create slides', query: 'Create a presentation about AI trends' },
  { icon: '🌐', text: 'Build website', query: 'Build a personal portfolio website' },
  { icon: '💻', text: 'Develop apps', query: 'Develop a Python data analysis script' },
  { icon: '🎨', text: 'Design', query: 'Design a logo for my startup' },
  { icon: '📈', text: 'Analyze data', query: 'Analyze the stock market trends for NVDA' },
  { icon: '🔍', text: 'Research', query: 'Research the latest AI developments in 2026' },
];

export function TaskInput({ onSubmit, isProcessing = false }: TaskInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || isProcessing) return;
    onSubmit(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExampleClick = (query: string) => {
    if (!isProcessing) {
      setInput(query);
      onSubmit(query);
    }
  };

  return (
    <div className="task-input-container">
      <div className="input-box">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want me to do..."
          disabled={isProcessing}
          rows={3}
        />
        <button 
          onClick={handleSubmit} 
          disabled={!input.trim() || isProcessing}
          className="submit-btn"
        >
          {isProcessing ? '⏳' : '➤'}
        </button>
      </div>
      
      <div className="quick-actions">
        {EXAMPLES.map((ex, i) => (
          <button 
            key={i} 
            onClick={() => handleExampleClick(ex.query)}
            disabled={isProcessing}
            className="quick-action-btn"
          >
            <span className="icon">{ex.icon}</span>
            <span className="text">{ex.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
