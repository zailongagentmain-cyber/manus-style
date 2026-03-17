import React, { useState, useRef } from 'react';
import './TaskInput.css';

interface TaskInputProps {
  onSubmit: (description: string, files?: File[]) => void;
  loading?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, loading = false }) => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;
    
    onSubmit(input.trim(), files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="task-input-container" onSubmit={handleSubmit}>
      <div className="task-input-wrapper">
        {/* File Attachment Button */}
        <button 
          type="button" 
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
        >
          📎
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
        />
        
        {/* Input Field */}
        <textarea
          className="task-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want me to do..."
          rows={1}
          disabled={loading}
        />
        
        {/* Send Button */}
        <button 
          type="submit" 
          className="send-btn"
          disabled={loading || (!input.trim() && files.length === 0)}
        >
          {loading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            '➤'
          )}
        </button>
      </div>

      {/* File Preview */}
      {files.length > 0 && (
        <div className="file-preview-list">
          {files.map((file, index) => (
            <div key={index} className="file-preview-item">
              <span className="file-icon">📄</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              <button 
                type="button" 
                className="remove-file-btn"
                onClick={() => removeFile(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
      <p className="input-hint">
        Press Enter to submit, Shift+Enter for new line
      </p>
    </form>
  );
};
