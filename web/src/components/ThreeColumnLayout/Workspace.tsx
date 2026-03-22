// Workspace.tsx - 中间工作区组件
import { useState, useEffect } from 'react';
import type { FileNode } from './ThreeColumnLayout';

interface WorkspaceProps {
  selectedFile?: FileNode | null;
}

function getFileType(path: string): 'code' | 'pdf' | 'image' | 'html' | 'unknown' {
  const ext = path.split('.').pop()?.toLowerCase();
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'json', 'md', 'txt', 'css', 'scss'].includes(ext || '')) return 'code';
  if (['pdf'].includes(ext || '')) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
  if (['html', 'htm'].includes(ext || '')) return 'html';
  return 'unknown';
}

const codeSample = `// Welcome to Manus Style Workspace
// 
// This is your file preview area. You can view:
// - Code files (TypeScript, JavaScript, Python, etc.)
// - Markdown documents
// - JSON configuration files
// - Images and PDFs
// - HTML pages

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

export function Workspace({ selectedFile }: WorkspaceProps) {
  const [previewContent, setPreviewContent] = useState<string>(codeSample);
  const [previewType, setPreviewType] = useState<'code' | 'pdf' | 'image' | 'html'>('code');

  useEffect(() => {
    if (selectedFile?.path) {
      const type = getFileType(selectedFile.path);
      setPreviewType(type as 'code' | 'pdf' | 'image' | 'html');
      // 模拟加载文件内容
      setPreviewContent(`// Loading: ${selectedFile.path}\n\n${codeSample}`);
    } else {
      setPreviewContent(codeSample);
      setPreviewType('code');
    }
  }, [selectedFile]);

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="h-10 px-4 flex items-center justify-between bg-[#12121a] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">
            {selectedFile ? selectedFile.path || selectedFile.name : '工作区'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
            刷新
          </button>
          <button className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
            全屏
          </button>
        </div>
      </div>

      {/* 预览区 */}
      <div className="flex-1 overflow-auto p-4">
        {previewType === 'code' && (
          <div className="h-full rounded-lg overflow-hidden bg-[#1a1a24] border border-white/10">
            {/* 行号 */}
            <div className="flex h-full">
              <div className="w-12 flex-shrink-0 bg-[#15151f] border-r border-white/5 p-2 text-right">
                {previewContent.split('\n').map((_, i) => (
                  <div key={i} className="text-xs text-gray-600 leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>
              {/* 代码内容 */}
              <pre className="flex-1 p-2 overflow-auto text-sm leading-6">
                <code className="text-gray-300 font-mono">
                  {previewContent}
                </code>
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
              srcDoc={`<html><body style="font-family: system-ui; padding: 20px;"><h1>${selectedFile?.name || 'HTML Preview'}</h1><p>This is an HTML preview.</p></body></html>`}
              className="w-full h-full border-0"
              title="HTML Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
