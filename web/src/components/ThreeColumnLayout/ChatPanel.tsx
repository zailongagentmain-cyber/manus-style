// ChatPanel.tsx - 右侧对话面板组件
import { useState, useRef, useEffect } from 'react';
import type { Message } from './ThreeColumnLayout';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage?: (message: string) => void;
  modelName?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function ConnectionIndicator({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) {
  const statusConfig = {
    connected: { color: 'bg-green-500', text: '已连接', pulse: false },
    disconnected: { color: 'bg-red-500', text: '未连接', pulse: false },
    connecting: { color: 'bg-yellow-500', text: '连接中...', pulse: true }
  };
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-400">{config.text}</span>
    </div>
  );
}

export function ChatPanel({ 
  messages, 
  onSendMessage, 
  modelName = 'MiniMax-CN 2.5',
  connectionStatus = 'connected'
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage?.(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 - 模型信息 */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-[#1a1a24]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <div>
            <div className="text-sm font-medium text-white">{modelName}</div>
            <ConnectionIndicator status={connectionStatus} />
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="设置">
          ⚙️
        </button>
      </div>

      {/* 消息展示区 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">开始对话</p>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] rounded-2xl px-4 py-2.5
                  ${message.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-md' 
                    : 'bg-[#1a1a24] text-gray-200 rounded-bl-md border border-white/10'
                  }
                `}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <div 
                  className={`
                    text-xs mt-1.5
                    ${message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'}
                  `}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="p-4 border-t border-white/10 bg-[#1a1a24]">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            className="
              w-full bg-[#0a0a0f] border border-white/10 rounded-xl 
              px-4 py-3 pr-12 text-sm text-white placeholder-gray-500
              focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50
              resize-none
            "
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="
              absolute right-2 bottom-2 p-2 rounded-lg
              bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed
              text-white transition-colors
            "
            title="发送"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Powered by OpenClaw</span>
          <span>{input.length} 字符</span>
        </div>
      </div>
    </div>
  );
}
