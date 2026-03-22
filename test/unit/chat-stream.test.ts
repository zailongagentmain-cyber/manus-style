/**
 * SSE Chat Stream 单元测试
 * 
 * 测试后端的 SSE 流式输出功能
 */

import { generateAIResponse, splitIntoChunks } from '../../src/lib/chat';

describe('Chat Stream 后端功能测试', () => {
  
  describe('generateAIResponse', () => {
    
    test('应该返回 hello 响应', async () => {
      const response = await generateAIResponse('hello');
      expect(response).toContain('你好！');
    });
    
    test('应该返回 help 响应', async () => {
      const response = await generateAIResponse('help');
      expect(response).toContain('我可以帮助你完成各种任务');
    });
    
    test('应该返回 time 响应', async () => {
      const response = await generateAIResponse('time');
      expect(response).toContain('当前时间是：');
    });
    
    test('应该返回默认响应', async () => {
      const response = await generateAIResponse('今天天气真好');
      expect(response).toContain('今天天气真好');
      expect(response).toContain('SSE 流式输出演示');
    });
    
    test('应该不区分大小写', async () => {
      const response1 = await generateAIResponse('HELLO');
      const response2 = await generateAIResponse('hello');
      expect(response1).toBe(response2);
    });
    
  });
  
  describe('splitIntoChunks', () => {
    
    test('应该将文本分割成多个块', () => {
      const text = '你好。我是 Manus。';
      const chunks = splitIntoChunks(text);
      expect(chunks.length).toBeGreaterThan(1);
    });
    
    test('应该在标点符号处分割', () => {
      const text = '你好！再见？是的。';
      const chunks = splitIntoChunks(text);
      expect(chunks).toContain('你好！');
      expect(chunks).toContain('再见？');
      expect(chunks).toContain('是的。');
    });
    
    test('应该处理空字符串', () => {
      const chunks = splitIntoChunks('');
      expect(chunks).toEqual([]);
    });
    
    test('应该处理单字符', () => {
      const chunks = splitIntoChunks('a');
      expect(chunks.length).toBe(1);
    });
    
    test('应该保留换行符', () => {
      const text = '第一行\n第二行';
      const chunks = splitIntoChunks(text);
      expect(chunks).toContain('第一行\n');
    });
    
    test('每块应该包含原始文本的所有字符', () => {
      const text = '这是一个很长的句子，包含很多字符，用于测试分块功能。';
      const chunks = splitIntoChunks(text);
      const combined = chunks.join('');
      expect(combined).toBe(text);
    });
    
  });
  
});
