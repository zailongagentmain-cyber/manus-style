# Manus-Style 测试计划详细文档

**版本**: v1.0  
**日期**: 2026-03-16  
**状态**: 正式发布

---

## 目录

1. [概述](#1-概述)
2. [测试策略](#2-测试策略)
3. [单元测试](#3-单元测试)
4. [集成测试](#4-集成测试)
5. [E2E 测试](#5-e2e-测试)
6. [API 测试](#6-api-测试)
7. [测试数据管理](#7-测试数据管理)
8. [测试报告](#8-测试报告)

---

## 1. 概述

### 1.1 文档目的

本文档详细描述 Manus-Style 项目的测试计划，包括测试策略、测试用例、测试用例编写方式、测试数据管理等。

### 1.2 测试目标

| 指标 | 目标 | 优先级 |
|------|------|--------|
| 单元测试覆盖率 | > 80% | P0 |
| 集成测试通过率 | 100% | P0 |
| E2E 测试通过率 | > 95% | P1 |
| API 测试覆盖率 | > 90% | P0 |
| Bug 逃逸率 | < 5% | P1 |

### 1.3 测试环境

| 环境 | 用途 | 配置 |
|------|------|------|
| 开发环境 | 本地开发测试 | localhost |
| 测试环境 | CI/CD 自动测试 | test.manus-style.com |
| 预发布环境 | 上线前验证 | staging.manus-style.com |
| 生产环境 | 正式运营 | api.manus-style.com |

---

## 2. 测试策略

### 2.1 测试金字塔

```
           /\
          /  \
         / E2E \
        /--------\
       / 集成测试 \
      /------------\
     /   单元测试   \
    /________________\
    
比例: 70% 单元 / 20% 集成 / 10% E2E
```

### 2.2 测试类型

| 类型 | 工具 | 范围 |
|------|------|------|
| 单元测试 | Jest | 独立模块/函数 |
| 集成测试 | Jest + Supertest | 模块间交互 |
| API 测试 | Jest + Supertest | REST + WebSocket |
| E2E 测试 | Playwright | 完整用户流程 |

### 2.3 测试流程

```
代码提交 → CI 触发 → 单元测试 → 集成测试 → API 测试 → E2E 测试 → 合并
```

---

## 3. 单元测试

### 3.1 TaskManager 单元测试

#### 3.1.1 测试范围

| 方法 | 测试用例数 | 优先级 |
|------|------------|--------|
| createTask | 8 | P0 |
| getTask | 5 | P0 |
| updateTask | 6 | P0 |
| listTasks | 8 | P1 |
| deleteTask | 4 | P0 |
| pauseTask | 5 | P1 |
| resumeTask | 5 | P1 |
| cancelTask | 4 | P1 |

#### 3.1.2 createTask 测试用例

```typescript
// test/unit/TaskManager.test.ts

describe('TaskManager.createTask', () => {
  // 用例 1: 正常创建任务
  it('should create task successfully', async () => {
    // Arrange
    const input: TaskInput = {
      userId: 'user_123',
      channel: 'web',
      message: '分析 AAPL 股票'
    };
    
    // Act
    const task = await taskManager.createTask(input);
    
    // Assert
    expect(task.id).toBeDefined();
    expect(task.status).toBe(TaskStatus.PENDING);
    expect(task.input).toBe(input.message);
  });
  
  // 用例 2: 无效 userId
  it('should throw error for invalid userId', async () => {
    // Arrange
    const input: TaskInput = {
      userId: '',
      channel: 'web',
      message: 'test'
    };
    
    // Act & Assert
    await expect(taskManager.createTask(input))
      .rejects.toThrow('userId is required');
  });
  
  // 用例 3: 无效 channel
  it('should throw error for invalid channel', async () => {
    // Arrange
    const input: TaskInput = {
      userId: 'user_123',
      channel: 'invalid',
      message: 'test'
    };
    
    // Act & Assert
    await expect(taskManager.createTask(input))
      .rejects.toThrow('Invalid channel');
  });
  
  // 用例 4: 空消息
  it('should throw error for empty message', async () => {
    // Arrange
    const input: TaskInput = {
      userId: 'user_123',
      channel: 'web',
      message: ''
    };
    
    // Act & Assert
    await expect(taskManager.createTask(input))
      .rejects.toThrow('Message cannot be empty');
  });
  
  // 用例 5: 带 metadata
  it('should create task with metadata', async () => {
    // Arrange
    const input: TaskInput = {
      userId: 'user_123',
      channel: 'web',
      message: 'test',
      metadata: { priority: 'high' }
    };
    
    // Act
    const task = await taskManager.createTask(input);
    
    // Assert
    expect(task.metadata.priority).toBe('high');
  });
  
  // 用例 6: 任务 ID 唯一性
  it('should generate unique task ID', async () => {
    // Arrange
    const input: TaskInput = {
      userId: 'user_123',
      channel: 'web',
      message: 'test'
    };
    
    // Act
    const task1 = await taskManager.createTask(input);
    const task2 = await taskManager.createTask(input);
    
    // Assert
    expect(task1.id).not.toBe(task2.id);
  });
  
  // 用例 7: 时间戳正确
  it('should set correct timestamps', async () => {
    // Arrange
    const input: TaskInput = {
      userId: 'user_123',
      channel: 'web',
      message: 'test'
    };
    
    // Act
    const task = await taskManager.createTask(input);
    
    // Assert
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
    expect(task.createdAt.getTime()).toBeCloseTo(Date.now(), -1000);
  });
  
  // 用例 8: 默认 subtasks 为空
  it('should initialize empty subtasks', async () => {
    // Arrange
    const input: TaskInput = {
      userId: 'user_123',
      channel: 'web',
      message: 'test'
    };
    
    // Act
    const task = await taskManager.createTask(input);
    
    // Assert
    expect(task.subtasks).toEqual([]);
  });
});
```

#### 3.1.3 状态机测试用例

```typescript
// test/unit/TaskStateMachine.test.ts

describe('TaskStateMachine', () => {
  let stateMachine: TaskStateMachine;
  
  beforeEach(() => {
    stateMachine = new TaskStateMachine();
  });
  
  // 用例: PENDING → RUNNING 转换
  describe('transition from PENDING', () => {
    it('should allow PENDING → RUNNING', () => {
      expect(stateMachine.canTransition(
        TaskStatus.PENDING, 
        TaskStatus.RUNNING
      )).toBe(true);
    });
    
    it('should allow PENDING → FAILED', () => {
      expect(stateMachine.canTransition(
        TaskStatus.PENDING, 
        TaskStatus.FAILED
      )).toBe(true);
    });
    
    it('should not allow PENDING → COMPLETED directly', () => {
      expect(stateMachine.canTransition(
        TaskStatus.PENDING, 
        TaskStatus.COMPLETED
      )).toBe(false);
    });
  });
  
  // 用例: RUNNING 状态转换
  describe('transition from RUNNING', () => {
    it('should allow RUNNING → COMPLETED', () => {
      expect(stateMachine.canTransition(
        TaskStatus.RUNNING, 
        TaskStatus.COMPLETED
      )).toBe(true);
    });
    
    it('should allow RUNNING → FAILED', () => {
      expect(stateMachine.canTransition(
        TaskStatus.RUNNING, 
        TaskStatus.FAILED
      )).toBe(true);
    });
    
    it('should allow RUNNING → PAUSED', () => {
      expect(stateMachine.canTransition(
        TaskStatus.RUNNING, 
        TaskStatus.PAUSED
      )).toBe(true);
    });
  });
  
  // 用例: PAUSED 状态转换
  describe('transition from PAUSED', () => {
    it('should allow PAUSED → RUNNING', () => {
      expect(stateMachine.canTransition(
        TaskStatus.PAUSED, 
        TaskStatus.RUNNING
      )).toBe(true);
    });
    
    it('should allow PAUSED → FAILED', () => {
      expect(stateMachine.canTransition(
        TaskStatus.PAUSED, 
        TaskStatus.FAILED
      )).toBe(true);
    });
  });
});
```

---

### 3.2 PlannerAgent 单元测试

#### 3.2.1 测试范围

| 方法 | 测试用例数 | 优先级 |
|------|------------|--------|
| decompose | 10 | P0 |
| parseResponse | 8 | P0 |
| convertToSubtasks | 6 | P1 |
| validateSubtasks | 5 | P1 |

#### 3.2.2 decompose 测试用例

```typescript
// test/unit/PlannerAgent.test.ts

describe('PlannerAgent.decompose', () => {
  let planner: PlannerAgent;
  let mockLLM: jest.Mocked<LLMClient>;
  
  beforeEach(() => {
    mockLLM = {
      chat: jest.fn()
    } as any;
    planner = new PlannerAgent(mockLLM);
  });
  
  // 用例 1: 正常分解任务
  it('should decompose simple task', async () => {
    // Arrange
    const userRequest = '分析 AAPL 股票';
    mockLLM.chat.mockResolvedValue(JSON.stringify({
      subtasks: [
        {
          id: 'step_1',
          description: '搜索 AAPL 股票数据',
          agent: 'search',
          input: '搜索 AAPL 股票最近三个月数据',
          depends_on: [],
          expected_output: '股票价格数据'
        },
        {
          id: 'step_2',
          description: '分析数据',
          agent: 'malong',
          input: '分析股票数据，生成趋势报告',
          depends_on: ['step_1'],
          expected_output: '分析结果'
        }
      ],
      execution_order: 'serial',
      summary: '分析 AAPL 股票趋势'
    }));
    
    // Act
    const subtasks = await planner.decompose(userRequest);
    
    // Assert
    expect(subtasks).toHaveLength(2);
    expect(subtasks[0].agent).toBe('search');
    expect(subtasks[1].agent).toBe('malong');
  });
  
  // 用例 2: 空响应处理
  it('should handle empty LLM response', async () => {
    // Arrange
    mockLLM.chat.mockResolvedValue('');
    
    // Act & Assert
    await expect(planner.decompose('test'))
      .rejects.toThrow('Failed to parse LLM response');
  });
  
  // 用例 3: JSON 解析失败
  it('should handle invalid JSON', async () => {
    // Arrange
    mockLLM.chat.mockResolvedValue('not valid json');
    
    // Act & Assert
    await expect(planner.decompose('test'))
      .rejects.toThrow('Invalid JSON format');
  });
  
  // 用例 4: 缺少必要字段
  it('should handle missing required fields', async () => {
    // Arrange
    mockLLM.chat.mockResolvedValue(JSON.stringify({
      subtasks: [
        {
          id: 'step_1'
          // 缺少 description, agent, input
        }
      ]
    }));
    
    // Act & Assert
    await expect(planner.decompose('test'))
      .rejects.toThrow('Missing required field');
  });
  
  // 用例 5: 并行执行
  it('should identify parallelizable tasks', async () => {
    // Arrange
    mockLLM.chat.mockResolvedValue(JSON.stringify({
      subtasks: [
        { id: 's1', description: 'a', agent: 'search', input: 'a', depends_on: [] },
        { id: 's2', description: 'b', agent: 'search', input: 'b', depends_on: [] },
        { id: 's3', description: 'c', agent: 'malong', input: 'c', depends_on: ['s1', 's2'] }
      ],
      execution_order: 'parallel'
    }));
    
    // Act
    const subtasks = await planner.decompose('test');
    
    // Assert
    expect(subtasks[0].dependsOn).toHaveLength(0);
    expect(subtasks[1].dependsOn).toHaveLength(0);
    expect(subtasks[2].dependsOn).toHaveLength(2);
  });
});
```

---

### 3.3 NotificationService 单元测试

```typescript
// test/unit/NotificationService.test.ts

describe('NotificationService', () => {
  let service: NotificationService;
  let mockFormatter: jest.Mocked<MessageFormatter>;
  let mockChannelService: jest.Mocked<ChannelService>;
  
  beforeEach(() => {
    mockFormatter = {
      formatTaskCreated: jest.fn(),
      formatProgress: jest.fn(),
      formatConfirmation: jest.fn(),
      formatCompleted: jest.fn(),
      formatError: jest.fn()
    } as any;
    
    mockChannelService = {
      sendToChannel: jest.fn()
    } as any;
    
    service = new NotificationService(mockFormatter, mockChannelService);
  });
  
  // 用例: 发送任务完成通知
  it('should send task completed notification', async () => {
    // Arrange
    const task = createMockTask({ status: TaskStatus.COMPLETED });
    mockFormatter.formatCompleted.mockReturnValue('任务完成');
    
    // Act
    await service.notifyTaskCompleted(task);
    
    // Assert
    expect(mockFormatter.formatCompleted).toHaveBeenCalledWith(task);
    expect(mockChannelService.sendToChannel).toHaveBeenCalledWith(
      'web',
      expect.objectContaining({ message: '任务完成' })
    );
  });
  
  // 用例: 发送失败通知
  it('should send task failed notification', async () => {
    // Arrange
    const task = createMockTask({ status: TaskStatus.FAILED });
    const error = 'API 调用失败';
    mockFormatter.formatError.mockReturnValue('任务失败: API 调用失败');
    
    // Act
    await service.notifyTaskFailed(task, error);
    
    // Assert
    expect(mockFormatter.formatError).toHaveBeenCalledWith(task, error);
  });
});
```

---

## 4. 集成测试

### 4.1 API 集成测试

```typescript
// test/integration/task.api.test.ts

describe('Task API Integration', () => {
  const request = supertest(app);
  
  // 用例: 创建任务完整流程
  describe('POST /api/v1/tasks', () => {
    it('should create task and return 201', async () => {
      // Act
      const response = await request
        .post('/api/v1/tasks')
        .send({
          userId: 'user_123',
          channel: 'web',
          message: '分析 AAPL 股票'
        });
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.id).toBeDefined();
    });
    
    it('should validate required fields', async () => {
      // Act
      const response = await request
        .post('/api/v1/tasks')
        .send({ userId: 'user_123' });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  // 用例: 获取任务列表
  describe('GET /api/v1/tasks', () => {
    it('should return task list with pagination', async () => {
      // Arrange
      await createMultipleTasks(25);
      
      // Act
      const response = await request
        .get('/api/v1/tasks')
        .query({ userId: 'user_123', page: 1, pageSize: 10 });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.total).toBe(25);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });
});
```

### 4.2 WebSocket 集成测试

```typescript
// test/integration/websocket.test.ts

describe('WebSocket Integration', () => {
  let ws: WebSocket;
  
  beforeAll((done) => {
    ws = new WebSocket('ws://localhost:3000/ws/v1?token=test_token');
    ws.on('open', done);
  });
  
  afterAll(() => {
    ws.close();
  });
  
  // 用例: 订阅任务
  it('should receive task updates after subscribe', (done) => {
    // Arrange
    const taskId = 'task_123';
    
    // Act
    ws.send(JSON.stringify({ type: 'subscribe', taskId }));
    
    // 创建任务触发更新
    request
      .post('/api/v1/tasks')
      .send({ userId: 'user_123', channel: 'web', message: 'test' })
      .end(() => {
        // Assert
        ws.on('message', (data) => {
          const event = JSON.parse(data.toString());
          expect(event.type).toBe('task:created');
          expect(event.data.task.id).toBeDefined();
          done();
        });
      });
  });
  
  // 用例: 心跳检测
  it('should respond to ping with pong', (done) => {
    // Act
    ws.send(JSON.stringify({ type: 'ping' }));
    
    // Assert
    ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      expect(event.type).toBe('pong');
      done();
    });
  });
});
```

---

## 5. E2E 测试

### 5.1 用户任务流程测试

```typescript
// test/e2e/user-task-flow.test.ts

import { test, expect } from '@playwright/test';

test.describe('Complete Task Flow', () => {
  // 用例 1: 完整任务流程
  test('should complete full task flow', async ({ page }) => {
    // 1. 打开 Web UI
    await page.goto('http://localhost:3000');
    
    // 2. 输入任务
    await page.fill('textarea[name="message"]', '分析 AAPL 股票');
    await page.click('button[type="submit"]');
    
    // 3. 验证任务创建
    await expect(page.locator('.task-status')).toContainText('PENDING');
    
    // 4. 等待执行
    await page.waitForSelector('.task-status:has-text("RUNNING")', {
      timeout: 10000
    });
    
    // 5. 验证步骤展示
    await expect(page.locator('.subtask-1')).toContainText('搜索数据');
    
    // 6. 等待完成
    await page.waitForSelector('.task-status:has-text("COMPLETED")', {
      timeout: 60000
    });
    
    // 7. 验证结果
    await expect(page.locator('.result')).toBeVisible();
  });
  
  // 用例 2: 任务取消
  test('should cancel running task', async ({ page }) => {
    // 1. 创建任务
    await page.goto('http://localhost:3000');
    await page.fill('textarea[name="message"]', '分析 AAPL 股票');
    await page.click('button[type="submit"]');
    
    // 2. 等待任务开始
    await page.waitForSelector('.task-status:has-text("RUNNING")');
    
    // 3. 点击取消
    await page.click('button:has-text("取消任务")');
    
    // 4. 验证状态
    await expect(page.locator('.task-status')).toContainText('FAILED');
  });
});
```

### 5.2 Channel 通知测试

```typescript
// test/e2e/channel-notification.test.ts

test.describe('Channel Notification', () => {
  // 用例: Feishu 通知
  test('should receive Feishu notification on task complete', async ({ page }) => {
    // 1. 模拟 Feishu 用户
    const feishuPage = await context.newPage();
    await feishuPage.goto('https://feishu.cn/...');
    
    // 2. Web UI 创建任务
    await page.goto('http://localhost:3000');
    await page.fill('textarea[name="message"]', '分析 AAPL 股票');
    await page.click('button[type="submit"]');
    
    // 3. 等待任务完成
    await page.waitForSelector('.task-status:has-text("COMPLETED")', {
      timeout: 60000
    });
    
    // 4. 验证 Feishu 收到通知
    // 注意: 实际测试需要 Feishu 测试账号
  });
});
```

---

## 6. API 测试

### 6.1 REST API 测试矩阵

| API | 测试用例 | 覆盖场景 |
|-----|----------|----------|
| POST /tasks | 15 | 正常创建、参数验证、错误处理 |
| GET /tasks | 10 | 列表、分页、筛选 |
| GET /tasks/:id | 8 | 详情、不存在 |
| PATCH /tasks/:id | 8 | 更新、状态转换 |
| DELETE /tasks/:id | 5 | 删除、不存在 |
| POST /tasks/:id/pause | 6 | 暂停、重复暂停 |
| POST /tasks/:id/resume | 6 | 恢复、未暂停 |
| POST /tasks/:id/confirm | 8 | 确认、拒绝、修改 |
| GET /config | 5 | 配置获取 |
| PATCH /config | 6 | 配置更新 |
| GET /health | 3 | 健康检查 |

### 6.2 WebSocket 测试矩阵

| 事件 | 测试用例 | 覆盖场景 |
|------|----------|----------|
| subscribe | 5 | 订阅、重复订阅 |
| unsubscribe | 3 | 取消订阅 |
| confirm | 6 | 确认操作 |
| ping/pong | 3 | 心跳 |
| task:created | 4 | 任务创建推送 |
| task:progress | 5 | 进度更新推送 |
| task:thinking | 4 | 思考过程推送 |
| task:completed | 4 | 任务完成推送 |
| task:failed | 4 | 任务失败推送 |

---

## 7. 测试数据管理

### 7.1 测试夹具 (Fixtures)

```typescript
// test/fixtures/task.fixture.ts

export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'task_' + Math.random().toString(36).substr(2, 9),
  userId: 'user_test',
  channel: 'web',
  input: '测试任务',
  status: TaskStatus.PENDING,
  currentStep: 0,
  subtasks: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {},
  ...overrides
});

export const createMockSubtask = (overrides?: Partial<Subtask>): Subtask => ({
  id: 'subtask_' + Math.random().toString(36).substr(2, 9),
  taskId: 'task_test',
  description: '测试子任务',
  agent: 'malong',
  status: TaskStatus.PENDING,
  input: 'test input',
  dependsOn: [],
  ...overrides
});
```

### 7.2 测试数据库

```typescript
// test/utils/test-db.ts

class TestDatabase {
  private tasks: Map<string, Task> = new Map();
  
  async clear(): Promise<void> {
    this.tasks.clear();
  }
  
  async seed(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await this.save(task);
    }
  }
  
  // ... 其他方法
}
```

---

## 8. 测试报告

### 8.1 报告结构

```
测试报告
├── 执行摘要
├── 测试统计
│   ├── 总用例数
│   ├── 通过数
│   ├── 失败数
│   ├── 跳过数
│   └── 覆盖率
├── 失败的测试
├── 性能指标
└── 建议
```

### 8.2 CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload coverage
        run: npm run coverage
```

---

**文档版本**: v1.0  
**预计页数**: 8-10 页  
**最后更新**: 2026-03-16

---

## 9. Sandbox 隔离测试

### 9.1 测试范围

| 模块 | 测试用例数 | 优先级 |
|------|------------|--------|
| Sandbox 配置 | 8 | P0 |
| Workspace 隔离 | 10 | P0 |
| Agent 隔离 | 8 | P0 |
| 多租户 | 12 | P1 |
| 资源限制 | 6 | P1 |

### 9.2 Sandbox 配置测试

```typescript
// test/unit/SandboxConfig.test.ts

describe('SandboxConfig', () => {
  // 用例: 加载有效配置
  it('should load valid config', async () => {
    const config = await SandboxConfig.load('config/sandbox.toml');
    expect(config.enabled).toBe(true);
  });
  
  // 用例: 配置验证
  it('should validate required fields', async () => {
    const config = new SandboxConfig({});
    await expect(config.validate()).rejects.toThrow('workspace is required');
  });
});
```

### 9.3 Workspace 隔离测试

```typescript
// test/unit/WorkspaceIsolation.test.ts

describe('WorkspaceIsolation', () => {
  // 用例: 创建独立 Workspace
  it('should create isolated workspace', async () => {
    const workspace = await Workspace.create('tenant_a');
    expect(workspace.path).toContain('tenant_a');
  });
  
  // 用例: 跨租户访问被阻止
  it('should prevent cross-tenant access', async () => {
    await expect(workspaceA.readFile('../tenant_b/data'))
      .rejects.toThrow('Access denied');
  });
});
```

### 9.4 Agent 隔离测试

```typescript
// test/unit/AgentIsolation.test.ts

describe('AgentIsolation', () => {
  // 用例: 并发限制生效
  it('should enforce concurrency limit', async () => {
    const tasks = Array(10).fill(null).map(() => scheduler.execute(task));
    await expect(Promise.all(tasks)).rejects.toThrow('Concurrency limit exceeded');
  });
  
  // 用例: 超时控制
  it('should enforce timeout', async () => {
    await expect(scheduler.execute(longRunningTask))
      .rejects.toThrow('Task timeout');
  });
});
```

### 9.5 多租户测试

```typescript
// test/integration/tenant.test.ts

describe('Tenant Isolation', () => {
  // 用例: 租户数据隔离
  it('should isolate tenant data', async () => {
    const tenantA = await tenantService.create({ name: 'A' });
    const tenantB = await tenantService.create({ name: 'B' });
    
    await taskManager.createTask({ ...tenantA, message: 'test' });
    await taskManager.createTask({ ...tenantB, message: 'test' });
    
    const tasksA = await taskManager.list({ tenantId: tenantA.id });
    const tasksB = await taskManager.list({ tenantId: tenantB.id });
    
    expect(tasksA.length).toBe(1);
    expect(tasksB.length).toBe(1);
    expect(tasksA[0].id).not.toBe(tasksB[0].id);
  });
});
```

### 9.6 集成测试矩阵

| 测试项 | 场景 | 预期结果 |
|--------|------|----------|
| 配置加载 | 有效配置 | 加载成功 |
| 配置加载 | 无效配置 | 抛出异常 |
| Workspace | 创建目录 | 目录创建成功 |
| Workspace | 跨目录访问 | 拒绝访问 |
| Agent | 5 并发 | 成功执行 |
| Agent | 6 并发 | 拒绝执行 |
| 租户 | 创建租户 | 成功 |
| 租户 | 跨租户访问 | 拒绝 |
