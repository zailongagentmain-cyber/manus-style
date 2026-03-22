/**
 * 本地开发服务器 - 支持 SSE 流式输出
 * 运行: npx ts-node src/server/local-server.ts
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// SSE Chat Stream endpoint
app.post('/api/chat-stream', (req, res) => {
  const { message, userId = 'default' } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'message is required' }
    });
  }
  
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // 发送连接成功消息
  res.write('data: {"type":"connected","message":"Connected to stream"}\n\n');
  
  // 模拟 AI 流式响应
  const aiResponse = generateAIResponse(message);
  const chunks = splitIntoChunks(aiResponse);
  
  let index = 0;
  
  const sendChunk = () => {
    if (index >= chunks.length) {
      // 发送完成信号
      res.write('data: {"type":"complete"}\n\n');
      res.end();
      return;
    }
    
    const chunk = chunks[index];
    const isLast = index === chunks.length - 1;
    
    const data = JSON.stringify({
      type: isLast ? 'done' : 'chunk',
      content: chunk,
      index,
      total: chunks.length
    });
    
    res.write(`data: ${data}\n\n`);
    index++;
    
    if (!isLast) {
      setTimeout(sendChunk, 50 + Math.random() * 100);
    } else {
      res.write('data: {"type":"complete"}\n\n');
      res.end();
    }
  };
  
  // 开始发送
  setTimeout(sendChunk, 100);
});

// 生成 AI 响应
function generateAIResponse(userMessage: string): string {
  const responses: Record<string, string> = {
    'hello': '你好！我是 Manus AI 助手。有什么我可以帮助你的吗？',
    'help': '我可以帮助你完成各种任务，比如：\n\n1. 📝 撰写文档\n2. 🔍 搜索信息\n3. 📊 数据分析\n4. 💻 编写代码\n\n请告诉我你需要什么帮助！',
    'time': `当前时间是：${new Date().toLocaleString('zh-CN')}`,
  };
  
  const lowerMessage = userMessage.toLowerCase();
  for (const [key, value] of Object.entries(responses)) {
    if (lowerMessage.includes(key)) {
      return value;
    }
  }
  
  return `收到你的消息：「${userMessage}」\n\n我正在学习如何更好地回答你的问题。\n\n作为示例，我可以告诉你：\n- 这是一个 SSE 流式输出演示\n- 消息会逐字（ chunk ）显示出来\n- 模拟了打字机的效果\n\n你可以尝试发送 "hello"、"help" 或 "time" 来看看不同的响应。`;
}

// 分割文本为小块
function splitIntoChunks(text: string, chunkSize: number = 5): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (let i = 0; i < text.length; i++) {
    currentChunk += text[i];
    
    if (
      text[i] === '。' || 
      text[i] === '！' || 
      text[i] === '？' || 
      text[i] === '\n' ||
      (currentChunk.length >= chunkSize && text[i] === ' ')
    ) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 SSE 服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 测试 SSE: curl -X POST http://localhost:${PORT}/api/chat-stream -H "Content-Type: application/json" -d '{"message":"hello"}'`);
});
