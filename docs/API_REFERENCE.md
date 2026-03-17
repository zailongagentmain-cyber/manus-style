# Manus-Style API 参考文档

**版本**: v1.0  
**日期**: 2026-03-16  
**状态**: 正式发布

---

## 目录

1. [概述](#1-概述)
2. [REST API](#2-rest-api)
3. [WebSocket API](#3-websocket-api)
4. [内部服务 API](#4-内部服务-api)
5. [Agent 调度 API](#5-agent-调度-api)
6. [通知服务 API](#6-通知服务-api)
7. [Channel 集成 API](#7-channel-集成-api)
8. [数据类型定义](#8-数据类型定义)

---

## 1. 概述

### 1.1 API 设计原则

- **RESTful**: 符合 REST 设计规范
- **版本化**: API 带版本号 `/api/v1/`
- **统一响应**: 统一的响应格式
- **错误处理**: 统一的错误码定义

### 1.2 基础 URL

```
开发环境: http://localhost:3000/api/v1
生产环境: https://api.manus-style.com/v1
```

### 1.3 统一响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// 分页响应
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 2. REST API

### 2.1 任务管理

#### 2.1.1 创建任务

```
POST /api/v1/tasks
```

**请求体:**

```typescript
interface CreateTaskRequest {
  userId: string;
  channel: 'web' | 'feishu' | 'whatsapp' | 'telegram';
  message: string;
  metadata?: Record<string, any>;
}
```

**响应:**

```typescript
interface CreateTaskResponse {
  task: Task;
}
```

**示例:**

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "channel": "web",
    "message": "分析 AAPL 股票趋势"
  }'
```

---

#### 2.1.2 获取任务列表

```
GET /api/v1/tasks
```

**查询参数:**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| userId | string | 是 | 用户 ID |
| status | string | 否 | 任务状态 |
| page | number | 否 | 页码 (默认 1) |
| pageSize | number | 否 | 每页数量 (默认 20) |

**响应:**

```typescript
interface ListTasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

---

#### 2.1.3 获取任务详情

```
GET /api/v1/tasks/:taskId
```

**路径参数:**

| 参数 | 类型 | 描述 |
|------|------|------|
| taskId | string | 任务 ID |

**响应:**

```typescript
interface GetTaskResponse {
  task: Task;
}
```

---

#### 2.1.4 更新任务

```
PATCH /api/v1/tasks/:taskId
```

**请求体:**

```typescript
interface UpdateTaskRequest {
  metadata?: Record<string, any>;
}
```

**响应:**

```typescript
interface UpdateTaskResponse {
  task: Task;
}
```

---

#### 2.1.5 删除/取消任务

```
DELETE /api/v1/tasks/:taskId
```

**响应:**

```typescript
interface DeleteTaskResponse {
  success: boolean;
}
```

---

#### 2.1.6 暂停任务

```
POST /api/v1/tasks/:taskId/pause
```

**响应:**

```typescript
interface PauseTaskResponse {
  task: Task;
}
```

---

#### 2.1.7 恢复任务

```
POST /api/v1/tasks/:taskId/resume
```

**响应:**

```typescript
interface ResumeTaskResponse {
  task: Task;
}
```

---

#### 2.1.8 确认操作

```
POST /api/v1/tasks/:taskId/confirm
```

**请求体:**

```typescript
interface ConfirmTaskRequest {
  action: 'approve' | 'reject' | 'modify';
  payload?: {
    modifications?: Record<string, any>;
  };
}
```

**响应:**

```typescript
interface ConfirmTaskResponse {
  task: Task;
}
```

---

### 2.2 子任务管理

#### 2.2.1 获取子任务列表

```
GET /api/v1/tasks/:taskId/subtasks
```

**响应:**

```typescript
interface ListSubtasksResponse {
  subtasks: Subtask[];
}
```

---

#### 2.2.2 获取子任务详情

```
GET /api/v1/tasks/:taskId/subtasks/:subtaskId
```

**响应:**

```typescript
interface GetSubtaskResponse {
  subtask: Subtask;
}
```

---

#### 2.2.3 重试子任务

```
POST /api/v1/tasks/:taskId/subtasks/:subtaskId/retry
```

**响应:**

```typescript
interface RetrySubtaskResponse {
  subtask: Subtask;
}
```

---

### 2.3 配置管理

#### 2.3.1 获取配置

```
GET /api/v1/config
```

**响应:**

```typescript
interface GetConfigResponse {
  config: {
    llm: LLMConfig;
    agents: AgentConfig[];
    storage: StorageConfig;
  };
}
```

---

#### 2.3.2 更新配置

```
PATCH /api/v1/config
```

**请求体:**

```typescript
interface UpdateConfigRequest {
  llm?: Partial<LLMConfig>;
  agents?: Partial<AgentConfig>;
  storage?: Partial<StorageConfig>;
}
```

---

### 2.4 健康检查

#### 2.4.1 健康状态

```
GET /api/v1/health
```

**响应:**

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    llm: boolean;
    websocket: boolean;
  };
}
```

---

## 3. WebSocket API

### 3.1 连接

```
ws://localhost:3000/ws/v1
```

**认证:**

```typescript
// 连接时传递 token
const ws = new WebSocket('ws://localhost:3000/ws/v1?token=xxx');
```

### 3.2 客户端 → 服务器

#### 3.2.1 订阅任务

```typescript
interface SubscribeMessage {
  type: 'subscribe';
  taskId: string;
}
```

#### 3.2.2 取消订阅

```typescript
interface UnsubscribeMessage {
  type: 'unsubscribe';
  taskId: string;
}
```

#### 3.2.3 发送确认

```typescript
interface ConfirmMessage {
  type: 'confirm';
  taskId: string;
  action: 'approve' | 'reject' | 'modify';
  payload?: any;
}
```

#### 3.2.4 心跳

```typescript
interface PingMessage {
  type: 'ping';
}
```

---

### 3.3 服务器 → 客户端

#### 3.3.1 任务创建

```typescript
interface TaskCreatedEvent {
  type: 'task:created';
  task: Task;
}
```

#### 3.3.2 任务进度

```typescript
interface TaskProgressEvent {
  type: 'task:progress';
  taskId: string;
  currentStep: number;
  totalSteps: number;
  subtask?: Subtask;
}
```

#### 3.3.3 AI 思考

```typescript
interface ThinkingEvent {
  type: 'task:thinking';
  taskId: string;
  subtaskId: string;
  thought: string;
  step: 'analyzing' | 'planning' | 'deciding';
}
```

#### 3.3.4 工具调用

```typescript
interface ToolCallEvent {
  type: 'task:tool_call';
  taskId: string;
  subtaskId: string;
  tool: string;
  input: any;
}
```

#### 3.3.5 工具结果

```typescript
interface ToolResultEvent {
  type: 'task:tool_result';
  taskId: string;
  subtaskId: string;
  tool: string;
  output: any;
  duration: number;
}
```

#### 3.3.6 子任务完成

```typescript
interface SubtaskCompletedEvent {
  type: 'task:subtask_completed';
  taskId: string;
  subtask: Subtask;
}
```

#### 3.3.7 任务暂停（需确认）

```typescript
interface TaskPausedEvent {
  type: 'task:paused';
  taskId: string;
  reason: string;
  options: {
    label: string;
    action: string;
  }[];
}
```

#### 3.3.8 任务完成

```typescript
interface TaskCompletedEvent {
  type: 'task:completed';
  taskId: string;
  result: any;
  duration: number;
}
```

#### 3.3.9 任务失败

```typescript
interface TaskFailedEvent {
  type: 'task:failed';
  taskId: string;
  error: string;
  retryable: boolean;
}
```

#### 3.3.10 心跳响应

```typescript
interface PongMessage {
  type: 'pong';
  timestamp: number;
}
```

---

## 4. 内部服务 API

### 4.1 TaskManager

```typescript
// src/core/TaskManager.ts

class TaskManager {
  /**
   * 创建新任务
   */
  async createTask(input: TaskInput): Promise<Task>;
  
  /**
   * 获取任务
   */
  async getTask(taskId: string): Promise<Task | null>;
  
  /**
   * 更新任务
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void>;
  
  /**
   * 列出任务
   */
  async listTasks(filter: TaskFilter): Promise<Task[]>;
  
  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<void>;
  
  /**
   * 暂停任务
   */
  async pauseTask(taskId: string): Promise<void>;
  
  /**
   * 恢复任务
   */
  async resumeTask(taskId: string): Promise<void>;
  
  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void>;
  
  /**
   * 确认操作
   */
  async confirmTask(taskId: string, action: ConfirmAction): Promise<void>;
}
```

### 4.2 TaskStateMachine

```typescript
// src/core/TaskStateMachine.ts

class TaskStateMachine {
  /**
   * 验证状态转换是否合法
   */
  canTransition(from: TaskStatus, to: TaskStatus): boolean;
  
  /**
   * 执行状态转换
   */
  async transition(task: Task, to: TaskStatus): Promise<Task>;
  
  /**
   * 获取可用转换
   */
  getAvailableTransitions(status: TaskStatus): TaskStatus[];
  
  /**
   * 开始任务
   */
  async start(task: Task): Promise<Task>;
  
  /**
   * 完成任务
   */
  async complete(task: Task, result: any): Promise<Task>;
  
  /**
   * 失败任务
   */
  async fail(task: Task, error: string): Promise<Task>;
  
  /**
   * 暂停任务
   */
  async pause(task: Task, reason: string): Promise<Task>;
  
  /**
   * 恢复任务
   */
  async resume(task: Task): Promise<Task>;
}
```

### 4.3 TaskStorage

```typescript
// src/core/TaskStorage.ts

interface TaskStorage {
  /**
   * 保存任务
   */
  async save(task: Task): Promise<void>;
  
  /**
   * 加载任务
   */
  async load(taskId: string): Promise<Task | null>;
  
  /**
   * 删除任务
   */
  async delete(taskId: string): Promise<void>;
  
  /**
   * 查询任务
   */
  async query(filter: TaskFilter): Promise<Task[]>;
  
  /**
   * 批量保存
   */
  async batchSave(tasks: Task[]): Promise<void>;
}
```

---

## 5. Agent 调度 API

### 5.1 AgentScheduler

```typescript
// src/agents/AgentScheduler.ts

class AgentScheduler {
  /**
   * 调度任务执行
   */
  async schedule(task: Task): Promise<TaskResult>;
  
  /**
   * 执行单个子任务
   */
  async executeSubtask(subtask: Subtask): Promise<any>;
  
  /**
   * 选择合适的 Agent
   */
  selectAgent(agentType: AgentType): AgentClient;
  
  /**
   * 构建执行计划 (DAG)
   */
  buildExecutionPlan(subtasks: Subtask[]): ExecutionPlan;
  
  /**
   * 串行执行
   */
  async executeSerially(subtasks: Subtask[]): Promise<any[]>;
  
  /**
   * 并行执行
   */
  async executeInParallel(subtasks: Subtask[]): Promise<any[]>;
  
  /**
   * 汇总结果
   */
  summarize(task: Task): TaskResult;
}
```

### 5.2 PlannerAgent

```typescript
// src/agents/PlannerAgent.ts

class PlannerAgent {
  /**
   * 分解用户需求为子任务
   */
  async decompose(userRequest: string): Promise<Subtask[]>;
  
  /**
   * 解析 LLM 响应
   */
  parseResponse(response: string): PlanningResponse;
  
  /**
   * 转换为 Subtask 列表
   */
  convertToSubtasks(plan: PlanningResponse, taskId: string): Subtask[];
  
  /**
   * 验证子任务
   */
  validateSubtasks(subtasks: Subtask[]): ValidationResult;
}
```

### 5.3 Agent Clients

```typescript
// src/agents/clients/AgentClient.ts

interface AgentClient {
  /**
   * 执行任务
   */
  execute(input: string): Promise<any>;
  
  /**
   * 获取 Agent 类型
   */
  getType(): AgentType;
  
  /**
   * 获取能力列表
   */
  getCapabilities(): string[];
}

// 具体实现
class MalongClient implements AgentClient { ... }
class LongyarenClient implements AgentClient { ... }
class SearchClient implements AgentClient { ... }
class BrowserClient implements AgentClient { ... }
```

---

## 6. 通知服务 API

### 6.1 NotificationService

```typescript
// src/services/NotificationService.ts

class NotificationService {
  /**
   * 发送通知
   */
  async send(notification: Notification): Promise<void>;
  
  /**
   * 发送任务开始通知
   */
  async notifyTaskStarted(task: Task): Promise<void>;
  
  /**
   * 发送任务进度通知
   */
  async notifyTaskProgress(task: Task): Promise<void>;
  
  /**
   * 发送子任务完成通知
   */
  async notifySubtaskCompleted(task: Task, subtask: Subtask): Promise<void>;
  
  /**
   * 发送需要确认通知
   */
  async notifyNeedsConfirmation(task: Task, options: ConfirmOptions): Promise<void>;
  
  /**
   * 发送任务完成通知
   */
  async notifyTaskCompleted(task: Task): Promise<void>;
  
  /**
   * 发送任务失败通知
   */
  async notifyTaskFailed(task: Task, error: string): Promise<void>;
}
```

### 6.2 MessageFormatter

```typescript
// src/services/MessageFormatter.ts

class MessageFormatter {
  /**
   * 格式化任务创建消息
   */
  formatTaskCreated(task: Task): string;
  
  /**
   * 格式化进度消息
   */
  formatProgress(task: Task): string;
  
  /**
   * 格式化确认请求
   */
  formatConfirmation(task: Task, options: ConfirmOptions): string;
  
  /**
   * 格式化完成消息
   */
  formatCompleted(task: Task): string;
  
  /**
   * 格式化错误消息
   */
  formatError(task: Task, error: string): string;
  
  /**
   * 格式化进度条
   */
  formatProgressBar(current: number, total: number): string;
}
```

### 6.3 WebSocketService

```typescript
// src/services/WebSocketService.ts

class WebSocketService {
  /**
   * 广播消息
   */
  broadcast(event: WSEvent): void;
  
  /**
   * 发送给指定用户
   */
  sendToUser(userId: string, event: WSEvent): void;
  
  /**
   * 发送给指定任务订阅者
   */
  sendToTaskSubscribers(taskId: string, event: WSEvent): void;
  
  /**
   * 订阅任务
   */
  subscribeTask(userId: string, taskId: string): void;
  
  /**
   * 取消订阅
   */
  unsubscribeTask(userId: string, taskId: string): void;
  
  /**
   * 获取在线用户
   */
  getOnlineUsers(): string[];
}
```

---

## 7. Channel 集成 API

### 7.1 ChannelService

```typescript
// src/services/ChannelService.ts

class ChannelService {
  /**
   * 发送消息到 Channel
   */
  async sendToChannel(channel: Channel, message: ChannelMessage): Promise<void>;
  
  /**
   * 发送富文本消息
   */
  async sendRichMessage(channel: Channel, message: RichMessage): Promise<void>;
  
  /**
   * 发送带按钮的消息
   */
  async sendInteractiveMessage(channel: Channel, message: InteractiveMessage): Promise<void>;
  
  /**
   * 处理回调
   */
  async handleCallback(callback: ChannelCallback): Promise<void>;
  
  /**
   * 获取 Channel 配置
   */
  getChannelConfig(channel: Channel): ChannelConfig;
}
```

### 7.2 FeishuService

```typescript
// src/services/channels/FeishuService.ts

class FeishuService implements ChannelService {
  /**
   * 发送消息
   */
  async sendMessage(openId: string, message: string): Promise<void>;
  
  /**
   * 发送卡片消息
   */
  async sendCard(openId: string, card: FeishuCard): Promise<void>;
  
  /**
   * 发送带按钮的消息
   */
  async sendInteractive(openId: string, message: InteractiveMessage): Promise<void>;
  
  /**
   * 处理按钮回调
   */
  async handleActionCallback(actionId: string, value: any): Promise<void>;
}
```

### 7.3 WhatsAppService

```typescript
// src/services/channels/WhatsAppService.ts

class WhatsAppService implements ChannelService {
  /**
   * 发送文本消息
   */
  async sendText(phone: string, text: string): Promise<void>;
  
  /**
   * 发送媒体消息
   */
  async sendMedia(phone: string, media: MediaMessage): Promise<void>;
  
  /**
   * 发送按钮消息
   */
  async sendButtons(phone: string, buttons: Button[]): Promise<void>;
  
  /**
   * 处理回调
   */
  async handleCallback(payload: any): Promise<void>;
}
```

### 7.4 TelegramService

```typescript
// src/services/channels/TelegramService.ts

class TelegramService implements ChannelService {
  /**
   * 发送消息
   */
  async sendMessage(chatId: number, text: string): Promise<void>;
  
  /**
   * 发送带按钮的消息
   */
  async sendInlineKeyboard(chatId: number, keyboard: InlineKeyboard): Promise<void>;
  
  /**
   * 处理回调
   */
  async handleCallbackQuery(callbackQuery: any): Promise<void>;
}
```

---

## 8. 数据类型定义

### 8.1 任务相关

```typescript
// src/types/task.ts

enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

type AgentType = 'malong' | 'longyaren' | 'search' | 'browser';
type Channel = 'web' | 'feishu' | 'whatsapp' | 'telegram';

interface Task {
  id: string;
  userId: string;
  channel: Channel;
  input: string;
  status: TaskStatus;
  currentStep: number;
  subtasks: Subtask[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  metadata: Record<string, any>;
}

interface Subtask {
  id: string;
  taskId: string;
  description: string;
  agent: AgentType;
  status: TaskStatus;
  input: string;
  output?: any;
  dependsOn: string[];
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}
```

### 8.2 通知相关

```typescript
// src/types/notification.ts

type NotificationType = 
  | 'task_started'
  | 'subtask_completed'
  | 'progress'
  | 'need_confirmation'
  | 'task_completed'
  | 'task_failed'
  | 'error_alert';

interface Notification {
  type: NotificationType;
  taskId: string;
  userId: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

interface NotificationAction {
  label: string;
  action: string;
  payload?: any;
}
```

### 8.3 WebSocket 相关

```typescript
// src/types/websocket.ts

type WSEventType = 
  | 'task:created'
  | 'task:progress'
  | 'task:thinking'
  | 'task:tool_call'
  | 'task:tool_result'
  | 'task:subtask_completed'
  | 'task:paused'
  | 'task:completed'
  | 'task:failed'
  | 'pong';

interface WSEvent {
  type: WSEventType;
  taskId?: string;
  data: any;
  timestamp: number;
}
```

---

## 附录：错误码定义

| 错误码 | 描述 | HTTP 状态码 |
|--------|------|-------------|
| TASK_NOT_FOUND | 任务不存在 | 404 |
| TASK_ALREADY_RUNNING | 任务已在执行 | 400 |
| TASK_ALREADY_COMPLETED | 任务已完成 | 400 |
| INVALID_STATUS_TRANSITION | 无效状态转换 | 400 |
| SUBTASK_NOT_FOUND | 子任务不存在 | 404 |
| AGENT_EXECUTION_FAILED | Agent 执行失败 | 500 |
| LLM_DECODE_FAILED | LLM 响应解析失败 | 500 |
| CONFIG_NOT_FOUND | 配置不存在 | 404 |
| CHANNEL_SEND_FAILED | Channel 发送失败 | 500 |
| WEBSOCKET_CONNECT_FAILED | WebSocket 连接失败 | 500 |

---

**文档版本**: v1.0  
**预计页数**: 10-12 页  
**最后更新**: 2026-03-16

---

## 9. Sandbox API

### 9.1 Sandbox 配置

#### 9.1.1 获取 Sandbox 配置

```
GET /api/v1/sandbox/config
```

**响应:**

```typescript
interface GetSandboxConfigResponse {
  sandbox: {
    enabled: boolean;
    workspace: string;
    memory: string;
    agent: {
      agentId: string;
    };
    limits: {
      maxConcurrent: number;
      timeout: number;
      maxMemory: string;
      maxFileSize: string;
    };
    network: {
      port: number;
      allowedHosts: string[];
      blockedHosts: string[];
    };
  };
}
```

#### 9.1.2 更新 Sandbox 配置

```
PATCH /api/v1/sandbox/config
```

**请求体:**

```typescript
interface UpdateSandboxConfigRequest {
  sandbox?: Partial<SandboxConfig>;
}
```

---

### 9.2 租户管理 (多租户模式)

#### 9.2.1 创建租户

```
POST /api/v1/tenants
```

**请求体:**

```typescript
interface CreateTenantRequest {
  name: string;
  config: TenantConfig;
}
```

#### 9.2.2 获取租户列表

```
GET /api/v1/tenants
```

#### 9.2.3 获取租户详情

```
GET /api/v1/tenants/:tenantId
```

#### 9.2.4 删除租户

```
DELETE /api/v1/tenants/:tenantId
```

---

### 9.3 资源监控

#### 9.3.1 获取资源使用

```
GET /api/v1/sandbox/resources
```

**响应:**

```typescript
interface ResourcesResponse {
  cpu: {
    usage: number;
    limit: number;
  };
  memory: {
    usage: number;
    limit: number;
  };
  disk: {
    usage: number;
    limit: number;
  };
  tasks: {
    active: number;
    queued: number;
    completed: number;
    failed: number;
  };
}
```
