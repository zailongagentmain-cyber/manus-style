// ChatPanel.tsx - 右侧对话面板组件 (支持 SSE 流式输出)
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from './ThreeColumnLayout';

// API 配置 - 开发环境使用 localhost:3001，生产环境使用 /api/v1
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3001/api/v1' 
  : '/api/v1';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onAIResponse?: (content: string) => void;
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
  onAIResponse, 
  modelName = 'MiniMax-CN 2.5',
  connectionStatus = 'connected'
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 发送消息并处理 SSE 流式响应
  const sendStreamMessage = useCallback(async (message: string) => {
    console.log('[ChatPanel] 发送消息:', message);
    console.log('[ChatPanel] API_BASE:', API_BASE);

    // 临时显示 AI 消息（加载状态）
    setStreamingContent('正在思考...');
    setIsStreaming(true);

    try {
      const url = `${API_BASE}/chat-stream`;
      console.log('[ChatPanel] 发送请求到:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      console.log('[ChatPanel] 响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // 使用 ReadableStream 读取 SSE 数据
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // 解码数据块
        const chunk = decoder.decode(value, { stream: true });
        
        // 解析 SSE 数据 (格式: "data: {json}\n\n")
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6); // 去掉 "data: " 前缀
            try {
              const data = JSON.parse(dataStr);
              
              if (data.type === 'chunk' || data.type === 'done') {
                // 累加内容
                accumulatedContent += data.content;
                setStreamingContent(accumulatedContent);
              } else if (data.type === 'complete') {
                // 流完成：将 AI 消息添加到消息列表
                if (accumulatedContent) {
                  onAIResponse?.(accumulatedContent);
                }
                setIsStreaming(false);
                setStreamingContent('');
              }
            } catch (e) {
              // 忽略解析错误
              console.warn('Failed to parse SSE data:', dataStr);
            }
          }
        }
      }

      // 流结束
      setIsStreaming(false);
      setStreamingContent('');

    } catch (error) {
      console.error('Stream error:', error);
      setStreamingContent('抱歉，发生了错误，请稍后重试。');
      setIsStreaming(false);
      
      // 3秒后清除错误消息
      setTimeout(() => {
        setStreamingContent('');
      }, 3000);
    }
  }, [onSendMessage]);

  // 处理发送
  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendStreamMessage(input);
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
            <ConnectionIndicator status={isStreaming ? 'connecting' : connectionStatus} />
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="设置">
          ⚙️
        </button>
      </div>

      {/* 消息展示区 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">开始对话</p>
            <p className="text-xs mt-2 text-gray-600">试试发送 "hello"、"help" 或 "time"</p>
          </div>
        ) : (
          <>
            {/* 历史消息 */}
            {messages.map(message => (
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
            ))}
            
            {/* 流式响应消息 */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a24] text-gray-200 rounded-2xl rounded-bl-md border border-white/10 max-w-[85%] px-4 py-2.5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {streamingContent}
                    {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-indigo-500 animate-pulse" />}
                  </p>
                  <div className="text-xs mt-1.5 text-gray-500">
                    {formatTime(new Date())} · 正在输入...
                  </div>
                </div>
              </div>
            )}
          </>
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
            placeholder={isStreaming ? "正在生成回复..." : "输入消息... (Enter 发送, Shift+Enter 换行)"}
            disabled={isStreaming}
            className="
              w-full bg-[#0a0a0f] border border-white/10 rounded-xl 
              px-4 py-3 pr-12 text-sm text-white placeholder-gray-500
              focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50
              resize-none
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="
              absolute right-2 bottom-2 p-2 rounded-lg
              bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed
              text-white transition-colors
            "
            title="发送"
          >
            {isStreaming ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
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
