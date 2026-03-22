/**
 * AI Chat 工具函数
 * 
 * 可测试的业务逻辑
 */

// 模拟 AI 生成响应
export async function generateAIResponse(userMessage: string): Promise<string> {
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

// 将文本分割成多个块，模拟流式输出
export function splitIntoChunks(text: string, chunkSize: number = 5): string[] {
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
