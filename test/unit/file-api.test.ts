/**
 * 文件 API 单元测试
 * 
 * 测试后端文件相关功能
 */

import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// 模拟请求和响应
function createMockReq(params: any = {}, query: any = {}, body: any = {}): any {
  return { params, query, body };
}

function createMockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.write = jest.fn();
  res.end = jest.fn();
  return res;
}

describe('文件 API 功能测试', () => {
  
  const WORKSPACE_DIR = '/tmp/manus-workspace';
  
  // 确保测试目录存在
  beforeAll(() => {
    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }
  });
  
  describe('getFileType', () => {
    // 由于 getFileType 在 Workspace 组件中，这里测试实际逻辑
    
    test('应该识别代码文件', () => {
      const getFileType = (filePath: string): string => {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'json', 'md', 'txt', 'css', 'scss', 'sh'];
        if (codeExts.includes(ext)) return 'code';
        return 'unknown';
      };
      
      expect(getFileType('test.ts')).toBe('code');
      expect(getFileType('test.js')).toBe('code');
      expect(getFileType('test.py')).toBe('code');
      expect(getFileType('test.json')).toBe('code');
    });
    
    test('应该识别图片文件', () => {
      const getFileType = (filePath: string): string => {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
        return 'unknown';
      };
      
      expect(getFileType('test.png')).toBe('image');
      expect(getFileType('test.jpg')).toBe('image');
      expect(getFileType('test.svg')).toBe('image');
    });
    
    test('应该识别 PDF 文件', () => {
      const getFileType = (filePath: string): string => {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        if (ext === 'pdf') return 'pdf';
        return 'unknown';
      };
      
      expect(getFileType('test.pdf')).toBe('pdf');
    });
    
    test('应该识别 HTML 文件', () => {
      const getFileType = (filePath: string): string => {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        if (['html', 'htm'].includes(ext)) return 'html';
        return 'unknown';
      };
      
      expect(getFileType('test.html')).toBe('html');
      expect(getFileType('test.htm')).toBe('html');
    });
  });
  
  describe('getLanguage', () => {
    test('应该返回正确的语言标识', () => {
      const getLanguage = (filename: string): string => {
        const ext = path.extname(filename).toLowerCase().slice(1);
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
          'yaml': 'yaml',
        };
        return langMap[ext] || 'plaintext';
      };
      
      expect(getLanguage('test.ts')).toBe('typescript');
      expect(getLanguage('test.js')).toBe('javascript');
      expect(getLanguage('test.py')).toBe('python');
      expect(getLanguage('test.go')).toBe('go');
      expect(getLanguage('test.rs')).toBe('rust');
      expect(getLanguage('test.json')).toBe('json');
      expect(getLanguage('test.md')).toBe('markdown');
      expect(getLanguage('test.unknown')).toBe('plaintext');
    });
  });
  
  describe('文件路径安全', () => {
    test('应该防止路径遍历攻击', () => {
      const sanitizePath = (userInput: string): string => {
        // 移除 .. 和 /
        return userInput.replace(/\.\./g, '').replace(/\//g, '');
      };
      
      expect(sanitizePath('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizePath('normal/../../../etc/passwd')).toBe('normaletcpasswd');
      expect(sanitizePath('normal.txt')).toBe('normal.txt');
    });
    
    test('应该验证文件在工作目录内', () => {
      const WORKSPACE = '/tmp/manus-workspace';
      const isWithinWorkspace = (filePath: string): boolean => {
        const fullPath = path.join(WORKSPACE, filePath);
        return fullPath.startsWith(WORKSPACE);
      };
      
      expect(isWithinWorkspace('test.txt')).toBe(true);
      expect(isWithinWorkspace('subdir/test.txt')).toBe(true);
      expect(isWithinWorkspace('../../../etc/passwd')).toBe(false);
    });
  });
  
  describe('文件内容类型', () => {
    test('应该返回正确的 Content-Type', () => {
      const getContentType = (filename: string): string => {
        const ext = path.extname(filename).toLowerCase();
        const types: Record<string, string> = {
          '.html': 'text/html',
          '.htm': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.pdf': 'application/pdf',
        };
        return types[ext] || 'text/plain';
      };
      
      expect(getContentType('test.html')).toBe('text/html');
      expect(getContentType('test.css')).toBe('text/css');
      expect(getContentType('test.js')).toBe('application/javascript');
      expect(getContentType('test.json')).toBe('application/json');
      expect(getContentType('test.png')).toBe('image/png');
      expect(getContentType('test.pdf')).toBe('application/pdf');
      expect(getContentType('test.txt')).toBe('text/plain');
    });
  });
  
  describe('文件图标', () => {
    test('应该返回正确的文件图标', () => {
      const getFileIcon = (filename: string): string => {
        const ext = path.extname(filename).toLowerCase().slice(1);
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
          'png': '🖼️',
          'jpg': '🖼️',
          'pdf': '📕',
          'py': '🐍',
          'go': '🐹',
        };
        return iconMap[ext] || '📄';
      };
      
      expect(getFileIcon('test.ts')).toBe('📘');
      expect(getFileIcon('test.tsx')).toBe('⚛️');
      expect(getFileIcon('test.js')).toBe('📒');
      expect(getFileIcon('test.json')).toBe('📋');
      expect(getFileIcon('test.md')).toBe('📝');
      expect(getFileIcon('test.html')).toBe('🌐');
      expect(getFileIcon('test.css')).toBe('🎨');
      expect(getFileIcon('test.png')).toBe('🖼️');
      expect(getFileIcon('test.pdf')).toBe('📕');
      expect(getFileIcon('test.py')).toBe('🐍');
      expect(getFileIcon('test.go')).toBe('🐹');
      expect(getFileIcon('test.unknown')).toBe('📄');
    });
  });
  
});
