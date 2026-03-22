// FileTree.tsx - 文件树组件
import { useState } from 'react';
import type { FileNode } from './ThreeColumnLayout';

interface FileTreeProps {
  files: FileNode[];
  selectedFile?: FileNode | null;
  onFileSelect?: (file: FileNode) => void;
  level?: number;
}

function getFileIcon(filename: string, type: 'file' | 'folder'): string {
  if (type === 'folder') return '📁';
  
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    'ts': '📘',
    'tsx': '⚛️',
    'js': '📒',
    'jsx': '⚛️',
    'json': '📋',
    'md': '📝',
    'txt': '📄',
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'png': '🖼️',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'gif': '🖼️',
    'svg': '🖼️',
    'pdf': '📕',
    'py': '🐍',
    'go': '🐹',
    'rs': '🦀',
    'java': '☕',
    'yml': '⚙️',
    'yaml': '⚙️',
    'sh': '🖥️',
    'env': '🔐',
  };
  return iconMap[ext || ''] || '📄';
}

function FileTreeItem({ 
  file, 
  selectedFile, 
  onFileSelect,
  level = 0 
}: { 
  file: FileNode; 
  selectedFile?: FileNode | null; 
  onFileSelect?: (file: FileNode) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const isSelected = selectedFile?.id === file.id;
  const hasChildren = file.children && file.children.length > 0;

  const handleClick = () => {
    if (file.type === 'folder' && hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onFileSelect?.(file);
  };

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150
          ${isSelected 
            ? 'bg-indigo-500/20 text-indigo-300' 
            : 'hover:bg-white/5 text-gray-300 hover:text-white'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {file.type === 'folder' ? (
          <span className="text-xs transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
        ) : (
          <span className="w-3"></span>
        )}
        <span className="text-sm">{file.icon || getFileIcon(file.name, file.type)}</span>
        <span className="text-sm truncate flex-1">{file.name}</span>
      </div>
      
      {file.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {file.children!.map(child => (
            <FileTreeItem 
              key={child.id} 
              file={child} 
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, selectedFile, onFileSelect }: FileTreeProps) {
  return (
    <div className="file-tree">
      {files.map(file => (
        <FileTreeItem 
          key={file.id} 
          file={file} 
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
}
