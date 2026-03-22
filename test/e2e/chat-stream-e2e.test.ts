/**
 * SSE Chat Stream E2E 测试
 * 
 * 测试前后端集成的完整流程
 */

import request from 'supertest';

// 测试配置
const API_BASE = process.env.API_BASE || 'http://localhost:3001/api/v1';
const IS_VERCEL = process.env.VERCEL === 'true';

describe('SSE Chat Stream E2E 测试', () => {
  
  // 跳过 Vercel 环境的某些测试（Vercel 有超时限制）
  const skipOnVercel = IS_VERCEL ? test.skip : test;

  describe('后端 API 接口测试', () => {
    
    skipOnVercel('POST /api/v1/chat-stream 应该返回 200', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'hello' })
        .expect(200);
      
      expect(response.status).toBe(200);
    });

    skipOnVercel('POST /api/v1/chat-stream 应该返回 SSE 流', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'hello' })
        .expect(200);
      
      // 验证 SSE 响应头
      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    skipOnVercel('发送 hello 应该返回匹配的响应', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'hello' })
        .expect(200);
      
      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => response.on('end', resolve));
      
      // 验证包含 "你好"
      expect(body).toContain('你好');
      // 验证包含 SSE 格式
      expect(body).toContain('data:');
    });

    skipOnVercel('发送 help 应该返回帮助信息', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'help' })
        .expect(200);
      
      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => response.on('end', resolve));
      
      expect(body).toContain('我可以帮助你');
    });

    skipOnVercel('发送 time 应该返回当前时间', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'time' })
        .expect(200);
      
      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => response.on('end', resolve));
      
      expect(body).toContain('当前时间');
    });

    skipOnVercel('发送未知消息应该返回默认响应', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: '这是一条未知的测试消息' })
        .expect(200);
      
      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => response.on('end', resolve));
      
      // 默认响应包含原文
      expect(body).toContain('这是一条未知的测试消息');
    });

    test('缺少 message 参数应该返回 400', async () => {
      // 这个测试在任何环境都可以运行
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({})
        .expect(400);
    });

  });

  describe('SSE 数据格式测试', () => {
    
    skipOnVercel('应该返回 connected 消息', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'test' });
      
      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => response.on('end', resolve));
      
      expect(body).toContain('"type":"connected"');
    });

    skipOnVercel('应该返回 chunk 数据块', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'hello' });
      
      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => response.on('end', resolve));
      
      expect(body).toContain('"type":"chunk"');
    });

    skipOnVercel('应该返回 complete 结束信号', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'hello' });
      
      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => response.on('end', resolve));
      
      expect(body).toContain('"type":"complete"');
    });

    skipOnVercel('SSE 数据应该是有效的 JSON', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'test' });
      
      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => response.on('end', resolve));
      
      // 提取所有 data: 后的 JSON
      const dataLines = body.split('\n').filter(line => line.startsWith('data: '));
      
      for (const line of dataLines) {
        const jsonStr = line.slice(6); // 去掉 "data: "
        if (jsonStr.trim()) {
          expect(() => JSON.parse(jsonStr)).not.toThrow();
        }
      }
    });

  });

  describe('CORS 配置测试', () => {
    
    skipOnVercel('应该包含 CORS 头', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'test' });
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    skipOnVercel('应该包含 Content-Type: text/event-stream', async () => {
      const response = await request(API_BASE)
        .post('/chat-stream')
        .send({ message: 'test' });
      
      expect(response.headers['content-type']).toContain('text/event-stream');
    });

  });

});
