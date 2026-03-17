import React from 'react';
import './ResultViewer.css';

interface ResultViewerProps {
  result?: any;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ result }) => {
  if (!result) return null;

  const formatResult = (data: any): string => {
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="result-viewer">
      <div className="result-header">
        <span className="result-icon">📋</span>
        <span className="result-title">执行结果</span>
      </div>
      <div className="result-content">
        <pre>{formatResult(result)}</pre>
      </div>
    </div>
  );
};
