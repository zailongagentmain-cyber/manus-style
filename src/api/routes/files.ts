/**
 * File Routes
 * 
 * GET /api/files - 获取文件列表
 * GET /api/files/* - 获取文件内容
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// 工作目录
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/tmp/manus-workspace';

// 确保工作目录存在
function ensureWorkspaceDir() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    // 创建示例文件
    fs.writeFileSync(path.join(WORKSPACE_DIR, 'README.md'), '# Manus Workspace\n\nWelcome to Manus!');
    fs.writeFileSync(path.join(WORKSPACE_DIR, 'example.js'), 'console.log("Hello, Manus!");\n\nfunction add(a, b) {\n  return a + b;\n}');
    fs.writeFileSync(path.join(WORKSPACE_DIR, 'data.json'), JSON.stringify({ name: 'Manus', version: '1.0' }, null, 2));
  }
}

ensureWorkspaceDir();

// 递归获取文件列表
function getFilesRecursive(dir: string, baseDir: string): any[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const files: any[] = [];
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (item.isDirectory()) {
      files.push({
        id: relativePath,
        name: item.name,
        type: 'folder',
        path: relativePath,
        children: getFilesRecursive(fullPath, baseDir)
      });
    } else {
      const ext = path.extname(item.name).toLowerCase();
      let icon = '📄';
      if (['.ts', '.tsx'].includes(ext)) icon = '⚛️';
      else if (['.js', '.jsx'].includes(ext)) icon = '📜';
      else if (['.py'].includes(ext)) icon = '🐍';
      else if (['.json'].includes(ext)) icon = '📦';
      else if (['.md'].includes(ext)) icon = '📝';
      else if (['.html'].includes(ext)) icon = '🌐';
      else if (['.css'].includes(ext)) icon = '🎨';
      
      files.push({
        id: relativePath,
        name: item.name,
        type: 'file',
        path: relativePath,
        icon
      });
    }
  }
  
  return files;
}

// GET /api/files - 获取文件列表
router.get('/files', (req: Request, res: Response) => {
  try {
    const files = getFilesRecursive(WORKSPACE_DIR, WORKSPACE_DIR);
    res.json({
      success: true,
      data: files,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FILE_ERROR', message: String(error) }
    });
  }
});

// GET /api/files/:path - 获取文件内容
router.get('/file/:path', (req: Request, res: Response) => {
  try {
    // 从 params 获取路径（可能是数组）
    const filePath = Array.isArray(req.params.path) ? req.params.path[0] : req.params.path;
    const sanitizedPath = String(filePath).replace(/\.\./g, '');
    const fullPath = path.join(WORKSPACE_DIR, sanitizedPath);
    
    // 安全检查
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found' }
      });
    }
    
    const stat = fs.statSync(fullPath);
    
    // 如果是目录
    if (stat.isDirectory()) {
      const files = getFilesRecursive(fullPath, WORKSPACE_DIR);
      return res.json({
        success: true,
        data: { type: 'folder', files },
        timestamp: new Date().toISOString()
      });
    }
    
    // 如果是文件
    const ext = path.extname(fullPath).toLowerCase();
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    let contentType = 'text/plain';
    if (['.html', '.htm'].includes(ext)) contentType = 'text/html';
    else if (['.css'].includes(ext)) contentType = 'text/css';
    else if (['.js'].includes(ext)) contentType = 'application/javascript';
    else if (['.json'].includes(ext)) contentType = 'application/json';
    
    res.json({
      success: true,
      data: {
        type: 'file',
        name: path.basename(fullPath),
        path: sanitizedPath,
        content,
        contentType,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FILE_ERROR', message: String(error) }
    });
  }
});

export default router;
