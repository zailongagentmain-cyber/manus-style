import React, { useState } from 'react';
import './TaskInput.css';

interface TaskInputProps {
  onSubmit: (description: string) => Promise<void>;
  disabled?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, disabled }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(description.trim());
      setDescription('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="task-input" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入任务描述..."
          disabled={disabled || loading}
          className="task-input-field"
        />
        <button
          type="submit"
          disabled={disabled || loading || !description.trim()}
          className="submit-button"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </form>
  );
};
