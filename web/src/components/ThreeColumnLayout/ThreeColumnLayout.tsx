// ThreeColumnLayout.tsx - 三栏布局主组件
import { useState } from 'react';
import { FileTree } from './FileTree';
import { Workspace } from './Workspace';
import { ChatPanel } from './ChatPanel';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon?: string;
  children?: FileNode[];
  path?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ThreeColumnLayoutProps {
  files?: FileNode[];
  messages?: Message[];
  onFileSelect?: (file: FileNode) => void;
  onSendMessage?: (message: string) => void;
  modelName?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}

const defaultFiles: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    icon: '📁',
    children: [
      { id: '2', name: 'components', type: 'folder', icon: '📁', children: [
        { id: '3', name: 'App.tsx', type: 'file', icon: '📄', path: '/src/components/App.tsx' },
        { id: '4', name: 'index.ts', type: 'file', icon: '📄', path: '/src/components/index.ts' },
      ]},
      { id: '5', name: 'utils', type: 'folder', icon: '📁', children: [
        { id: '6', name: 'helpers.ts', type: 'file', icon: '📄', path: '/src/utils/helpers.ts' },
      ]},
      { id: '7', name: 'styles.css', type: 'file', icon: '🎨', path: '/src/styles.css' },
      { id: '8', name: 'index.html', type: 'file', icon: '🌐', path: '/index.html' },
    ]
  },
  {
    id: '9',
    name: 'docs',
    type: 'folder',
    icon: '📁',
    children: [
      { id: '10', name: 'README.md', type: 'file', icon: '📝', path: '/docs/README.md' },
      { id: '11', name: 'API.md', type: 'file', icon: '📝', path: '/docs/API.md' },
    ]
  },
  {
    id: '12',
    name: 'package.json',
    type: 'file',
    icon: '📦',
    path: '/package.json'
  },
  {
    id: '13',
    name: 'tsconfig.json',
    type: 'file',
    icon: '⚙️',
    path: '/tsconfig.json'
  },
];

const defaultMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: '你好，请帮我分析一下这个项目的结构',
    timestamp: new Date(Date.now() - 60000)
  },
  {
    id: '2',
    role: 'assistant',
    content: '好的，让我先查看一下项目结构。这是一个标准的 React + Vite 项目，包含 src、docs 等目录。',
    timestamp: new Date()
  }
];

export function ThreeColumnLayout({
  files = defaultFiles,
  messages = defaultMessages,
  onFileSelect,
  onSendMessage,
  modelName = 'MiniMax-CN 2.5',
  connectionStatus = 'connected'
}: ThreeColumnLayoutProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>(messages);

  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    setCurrentMessages(prev => [...prev, newMessage]);
    onSendMessage?.(content);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* 左侧边栏 - 文件树 (250px) */}
      <aside className="w-[250px] flex-shrink-0 bg-[#12121a] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            文件浏览器
          </h2>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <FileTree 
            files={files} 
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
          />
        </div>
      </aside>

      {/* 中间工作区 (自适应) */}
      <main className="flex-1 bg-[#0a0a0f] flex flex-col min-w-0">
        <Workspace selectedFile={selectedFile} />
      </main>

      {/* 右侧对话面板 (400px) */}
      <aside className="w-[400px] flex-shrink-0 bg-[#12121a] border-l border-white/10 flex flex-col">
        <ChatPanel 
          messages={currentMessages}
          onSendMessage={handleSendMessage}
          modelName={modelName}
          connectionStatus={connectionStatus}
        />
      </aside>
    </div>
  );
}
