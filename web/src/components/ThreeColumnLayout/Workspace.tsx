// Workspace.tsx - 中间工作区组件
import { useState, useEffect } from 'react';
import type { FileNode } from './ThreeColumnLayout';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface WorkspaceProps {
  selectedFile?: FileNode | null;
  apiBase?: string;
}

function getFileType(path: string): 'code' | 'pdf' | 'image' | 'html' | 'unknown' {
  const ext = path.split('.').pop()?.toLowerCase();
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'json', 'md', 'txt', 'css', 'scss', 'sh'].includes(ext || '')) return 'code';
  if (['pdf'].includes(ext || '')) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
  if (['html', 'htm'].includes(ext || '')) return 'html';
  return 'unknown';
}

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'json': 'json',
    'md': 'markdown',
    'css': 'css',
    'scss': 'scss',
    'sh': 'bash',
    'bash': 'bash',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
  };
  return langMap[ext || ''] || 'plaintext';
}

const codeSample = `// Welcome to Manus Style Workspace
// 
// This is your file preview area.

import { useState } from 'react';

interface Props {
  title: string;
  onComplete: () => void;
}

export function TaskCard({ title, onComplete }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async () => {
    setIsLoading(true);
    await onComplete();
    setIsLoading(false);
  };
  
  return (
    <div className="card">
      <h3>{title}</h3>
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Complete'}
      </button>
    </div>
  );
}`;

export function Workspace({ selectedFile, apiBase = '/api/v1' }: WorkspaceProps) {
  const [previewContent, setPreviewContent] = useState<string>(codeSample);
  const [previewType, setPreviewType] = useState<'code' | 'pdf' | 'image' | 'html'>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载文件列表
  useEffect(() => {
    async function loadFileList() {
      try {
        const response = await fetch(`${apiBase}/files`);
        const data = await response.json();
        if (data.success) {
        }
      } catch (err) {
        console.error('Failed to load file list:', err);
      }
    }
    loadFileList();
  }, [apiBase]);

  // 加载文件内容
  useEffect(() => {
    async function loadFileContent() {
      if (!selectedFile?.path) {
        setPreviewContent(codeSample);
        setPreviewType('code');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiBase}/file/${selectedFile.path}`);
        const data = await response.json();

        if (data.success) {
          const file = data.data;
          const type = getFileType(file.name);
          setPreviewType(type as 'code' | 'pdf' | 'image' | 'html');
          
          if (type === 'code' || type === 'html') {
            // 如果是代码或 HTML，直接显示内容
            setPreviewContent(file.content || '');
          } else if (type === 'image') {
            // 图片使用 base64（如果有的话）
            setPreviewContent('');
          } else {
            setPreviewContent(file.content || '无法预览此文件类型');
          }
        } else {
          setError(data.error?.message || '加载失败');
          setPreviewContent(codeSample);
        }
      } catch (err) {
        setError('网络错误');
        setPreviewContent(codeSample);
      } finally {
        setLoading(false);
      }
    }

    loadFileContent();
  }, [selectedFile, apiBase]);

  // 代码高亮
  const highlightCode = (code: string, filename: string) => {
    try {
      const lang = getLanguage(filename);
      const result = hljs.highlight(code, { language: lang });
      return result.value;
    } catch {
      return code;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="h-10 px-4 flex items-center justify-between bg-[#12121a] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">
            {loading ? '加载中...' : (selectedFile ? selectedFile.path || selectedFile.name : '工作区')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* 预览区 */}
      <div className="flex-1 overflow-auto p-4">
        {previewType === 'code' && (
          <div className="h-full rounded-lg overflow-hidden bg-[#1a1a24] border border-white/10">
            <div className="flex h-full">
              {/* 行号 */}
              <div className="w-12 flex-shrink-0 bg-[#15151f] border-r border-white/5 p-2 text-right overflow-hidden">
                {previewContent.split('\n').map((_, i) => (
                  <div key={i} className="text-xs text-gray-600 leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>
              {/* 代码内容 */}
              <pre className="flex-1 p-2 overflow-auto text-sm leading-6">
                <code 
                  className="font-mono"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightCode(previewContent, selectedFile?.name || 'code.js') 
                  }} 
                />
              </pre>
            </div>
          </div>
        )}

        {previewType === 'image' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🖼️</div>
              <p>图片预览</p>
              <p className="text-sm mt-2">{selectedFile?.name}</p>
            </div>
          </div>
        )}

        {previewType === 'pdf' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">📄</div>
              <p>PDF 预览</p>
              <p className="text-sm mt-2">{selectedFile?.name}</p>
              <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm transition-colors">
                下载 PDF
              </button>
            </div>
          </div>
        )}

        {previewType === 'html' && (
          <div className="h-full rounded-lg overflow-hidden bg-white">
            <iframe 
              srcDoc={previewContent}
              className="w-full h-full border-0"
              title="HTML Preview"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
