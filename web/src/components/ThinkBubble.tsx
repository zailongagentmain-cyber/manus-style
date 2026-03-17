import React, { useEffect, useRef } from 'react';
import './ThinkBubble.css';

interface ThinkBubbleProps {
  think: string;
}

export const ThinkBubble: React.FC<ThinkBubbleProps> = ({ think }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bubbleRef.current) {
      bubbleRef.current.scrollTop = bubbleRef.current.scrollHeight;
    }
  }, [think]);

  if (!think) return null;

  return (
    <div className="think-bubble">
      <div className="think-header">
        <span className="think-icon">💭</span>
        <span className="think-title">AI 思考过程</span>
      </div>
      <div className="think-content" ref={bubbleRef}>
        <pre>{think}</pre>
      </div>
    </div>
  );
};
