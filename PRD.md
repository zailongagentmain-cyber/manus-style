# Manus-Style Agent 系统 PRD 文档

**项目代号**: Manus-Style  
**版本**: v1.0  
**日期**: 2026-03-16  
**作者**: 龙崽子  
**状态**: 初稿

---

## 目录

1. [项目概述](#1-项目概述)
2. [市场分析与竞品研究](#2-市场分析与竞品研究)
3. [产品定位与价值主张](#3-产品定位与价值主张)
4. [系统架构设计](#4-系统架构设计)
5. [技术栈选型](#5-技术栈选型)
6. [模块详细设计](#6-模块详细设计)
7. [OpenClaw 能力复用方案](#7-openclaw-能力复用方案)
8. [OpenManus 代码复用方案](#8-openmanus-代码复用方案)
9. [Channel 集成设计](#9-channel-集成设计)
10. [前端界面设计](#10-前端界面设计)
11. [数据模型设计](#11-数据模型设计)
12. [API 接口设计](#12-api-接口设计)
13. [开发计划与里程碑](#13-开发计划与里程碑)
14. [风险评估与应对](#14-风险评估与应对)
15. [附录：参考资源](#15-附录参考资源)

---

## 1. 项目概述

### 1.1 项目背景

随着 AI Agent 技术的快速发展，2025 年出现的 Manus AI 引领了通用 AI Agent 的新范式——能够自主执行复杂多步骤任务，无需人工持续干预。OpenManus 作为开源实现，证明了构建此类系统的可行性。

我们的目标是在 OpenClaw 现有架构基础上，构建一个**可控、可扩展、可复用**的 Manus-Type Agent 系统，充分利用现有 Agent 协作能力，实现复杂任务的自动化执行。

### 1.2 项目定义

**Manus-Style** 是一个基于 OpenClaw 架构的通用 AI Agent 任务执行系统，其核心特性包括：

- **自主任务规划**: 能够理解复杂用户需求，拆解为可执行的子任务
- **多 Agent 协作**: 调度码龙（代码执行）、龙雅人（内容创作）、搜索 Agent 等专业 Agent
- **实时进度追踪**: 任务执行的每个步骤都可监控、可干预
- **多 Channel 通知**: 通过 Feishu、WhatsApp、Telegram 等渠道推送关键节点通知
- **结果可视化**: 支持数据分析、图表生成、报告输出

### 1.3 项目目标

| 目标类型 | 具体描述 | 成功指标 |
|----------|----------|----------|
| **功能目标** | 实现复杂任务的自动化拆解与执行 | 80% 常见任务可自动完成 |
| **性能目标** | 任务响应时间 < 5分钟（简单任务） | 平均响应时间达标 |
| **可用性目标** | Web UI 友好操作，无需编码 | 用户满意度 > 4/5 |
| **扩展性目标** | 支持新增 Agent 类型 | 插件化架构 |

### 1.4 核心用户场景

```
场景 1: 股票分析
用户: "分析 AAPL 最近三个月的趋势"
系统: 
  1. 拆解任务（数据采集 → 数据处理 → 图表生成 → 报告撰写）
  2. 调用搜索 Agent 获取数据
  3. 调用码龙执行 Python 分析
  4. 调用龙雅人生成可视化图表
  5. 汇总报告，推送到 Channel

场景 2: 市场调研
用户: "调研 AI Agent 领域的最新发展"
系统:
  1. 拆解任务（搜索最新资讯 → 整理要点 → 生成报告）
  2. 调用搜索 Agent 多源采集
  3. 调用码龙整理数据
  4. 调用龙雅人生成调研报告

场景 3: 内容创作
用户: "写一篇关于 Crypto 钱包安全的博客"
系统:
  1. 拆解任务（搜索资料 → 撰写大纲 → 详细内容 → SEO 优化）
  2. 调用搜索 Agent 获取素材
  3. 调用龙雅人撰写内容
  4. 自动 SEO 优化
```

---

## 2. 市场分析与竞品研究

### 2.1 市场背景

根据 2025-2026 年 AI 领域的发展趋势，AI Agent 市场呈现爆发式增长：

- **Manus AI**: 首个通用 AI Agent，估值超过 5 亿美元
- **OpenAI Operator**: 自动化浏览器操作
- **Anthropic Computer Use**: Claude 的计算机使用能力
- **OpenManus**: 开源实现，社区活跃

### 2.2 竞品对比

| 产品 | 定位 | 优势 | 劣势 | 许可 |
|------|------|------|------|------|
| **Manus AI** | 商业闭源 | 功能完整、品牌效应 | 需邀请码、价格高 | 闭源 |
| **OpenManus** | 开源框架 | 代码透明、可定制 | 无前端、需技术能力 | MIT |
| **OpenHands** | 开源研究 | 学术背景、社区活跃 | 功能有限 | MIT |
| **SWE-agent** | 代码专用 | 代码能力强的 | 场景单一 | MIT |
| **Manus-Style** | 开源+可扩展 | OpenClaw 集成、多 Channel | 需从 0 开发 | MIT |

### 2.3 市场机会

1. **开源领域空白**: 目前缺乏与 OpenClaw 深度集成的开源 Agent 系统
2. **多 Channel 需求**: 现有方案主要聚焦 CLI，无完善的移动端通知
3. **中文本地化**: 竞品多为英文，缺乏优质中文支持
4. **定制化需求**: 企业需要可私有部署的解决方案

---

## 3. 产品定位与价值主张

### 3.1 产品定位

**Manus-Style** = OpenClaw Agent 协作框架 + Manus 任务执行范式 + 多 Channel 通知

定位为**可私有部署的通用 AI Agent 任务执行系统**，面向：
- 个人开发者
- 小型团队
- 需要自动化工作流的企业

### 3.2 核心价值

| 价值维度 | 描述 |
|----------|------|
| **可控性** | 完全自主掌控，无外部依赖 |
| **可扩展性** | 插件化架构，可轻松添加新 Agent |
| **实时性** | 任务进度实时可见 |
| **多 Channel** | 支持多渠道通知和交互 |
| **开源免费** | 零许可费用，可商用 |

### 3.3 差异化优势

相比 OpenManus：
1. **集成 OpenClaw**: 无需重复开发 Agent 调度、Channel 集成
2. **多 Channel 支持**: 原生支持 Feishu/WhatsApp/Telegram
3. **中文优化**: 更好的中文理解与生成
4. **开箱即用**: 提供 Web UI，无需命令行操作

---

## 4. 系统架构设计

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              用户交互层                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│   │   Web UI        │     │   Feishu        │     │   WhatsApp      │        │
│   │   (任务发起)     │     │   (通知)        │     │   (通知)         │        │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘        │
│                                                                                  │
│   ┌─────────────────┐     ┌─────────────────┐                                │
│   │   Telegram     │     │   其他 Channel   │                                │
│   │   (通知)        │     │   (扩展)         │                                │
│   └─────────────────┘     └─────────────────┘                                │
│                                                                                  │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OpenClaw Gateway (消息路由层)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    Channel Bridge (通道桥接)                             │   │
│   │   - 接收用户输入                                                         │   │
│   │   - 路由到对应 Handler                                                   │   │
│   │   - 统一任务格式                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    WebSocket Server (实时通信)                           │   │
│   │   - 任务进度推送                                                         │   │
│   │   - 实时思考过程展示                                                     │   │
│   │   - 双向交互                                                             │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Manus-Style 核心层                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      Task Manager (任务管理器)                            │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                    Planner Agent (规划 Agent)                    │   │   │
│   │   │   - 需求理解                                                       │   │   │
│   │   │   - 任务拆解 (Task Decomposition)                                │   │   │
│   │   │   - Agent 选择                                                     │   │   │
│   │   │   - 执行编排                                                       │   │   │
│   │   │   - 结果汇总                                                       │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                           │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                   Task State Machine (任务状态机)                │   │   │
│   │   │   - pending → running → completed / failed                      │   │   │
│   │   │   - checkpoint (检查点)                                         │   │   │
│   │   │   - 断点恢复                                                       │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      Execution Layer (执行层)                           │   │
│   │                                                                           │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│   │   │  码龙       │  │  龙雅人     │  │  搜索 Agent │  │  其他 Agent │   │   │
│   │   │ (代码执行)   │  │ (内容创作)  │  │  (网络搜索) │  │  (扩展)     │   │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│   │                                                                           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         OpenClaw 工具层                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│   │  Browser   │  │    Exec    │  │   Search   │  │    TTS    │              │
│   │  (浏览器)   │  │  (执行)    │  │  (搜索)    │  │  (语音)    │              │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘              │
│                                                                                  │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│   │   Read     │  │   Write    │  │  Message   │  │    PDF     │              │
│   │  (读取)    │  │   (写入)   │  │  (消息)    │  │   (PDF)    │              │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 核心组件说明

#### 4.2.1 Planner Agent

Planner Agent 是整个系统的"大脑"，负责：
- 接收用户自然语言需求
- 理解任务意图
- 拆解为可执行的子任务列表
- 选择合适的执行 Agent
- 编排执行顺序（串行/并行）
- 汇总结果并输出

#### 4.2.2 Task State Machine

任务状态机管理任务的完整生命周期：

```
状态流转:
PENDING → RUNNING → COMPLETED (成功)
          ↓
         FAILED (失败)
         
RUNNING → PAUSED (等待确认)
PAUSED → RUNNING (确认后继续) / FAILED (拒绝后)
```

### 4.3 数据流设计

```
用户输入 (Web UI)
    ↓
Channel Bridge (标准化)
    ↓
Task Manager (创建任务)
    ↓
Planner Agent (任务拆解)
    ↓
Execution Layer (执行子任务)
    ↓
Task State Machine (状态管理)
    ↓
Notification Service (推送通知)
    ↓
Channel (输出结果)
```

---

## 5. 技术栈选型

### 5.1 技术栈矩阵

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| **前端框架** | React + TypeScript | OpenClaw 现有技术栈 |
| **后端框架** | Node.js (OpenClaw Gateway) | OpenClaw 现有 |
| **Agent 调度** | sessions_spawn | OpenClaw 原生 |
| **任务队列** | In-Memory + Cron | 轻量级实现 |
| **实时通信** | WebSocket | OpenClaw Gateway 内置 |
| **配置管理** | TOML | OpenManus 已验证 |
| **数据存储** | JSON 文件 | 轻量级，无需额外数据库 |
| **AI 模型** | MiniMax-M2.5 | OpenClaw 默认模型 |

### 5.2 依赖关系

```
package.json (Manus-Style Core)
├── openclaw (peer dependency)
├── ws (WebSocket)
├── toml (配置解析)
├── uuid (任务 ID 生成)
└── zustand (前端状态管理)
```

### 5.3 环境要求

- Node.js >= 18
- Python >= 3.10 (用于数据分析 Agent)
- OpenClaw >= 0.5.0

---

## 6. 模块详细设计

### 6.1 模块划分

| 模块 | 职责 | 复杂度 | 优先级 |
|------|------|--------|--------|
| **Task Manager** | 任务创建、状态管理 | ⭐⭐⭐ | P0 |
| **Planner Agent** | 任务拆解、执行编排 | ⭐⭐⭐⭐ | P0 |
| **Notification Service** | 多 Channel 通知 | ⭐⭐⭐ | P0 |
| **Channel Bridge** | 消息路由、格式转换 | ⭐⭐ | P1 |
| **Data Analysis Agent** | 数据分析、可视化 | ⭐⭐⭐⭐ | P1 |
| **WebSocket Handler** | 实时通信 | ⭐⭐ | P1 |
| **Checkpoint Manager** | 断点恢复 | ⭐⭐⭐ | P2 |
| **Confirmation Handler** | 用户确认流程 | ⭐⭐ | P2 |

### 6.2 Task Manager 模块

#### 6.2.1 核心接口

```typescript
interface TaskManager {
  // 创建新任务
  createTask(input: TaskInput): Promise<Task>;
  
  // 获取任务状态
  getTask(taskId: string): Promise<Task>;
  
  // 更新任务状态
  updateTask(taskId: string, updates: Partial<Task>): Promise<void>;
  
  // 列出所有任务
  listTasks(filter?: TaskFilter): Promise<Task[]>;
  
  // 暂停任务
  pauseTask(taskId: string): Promise<void>;
  
  // 恢复任务
  resumeTask(taskId: string): Promise<void>;
  
  // 取消任务
  cancelTask(taskId: string): Promise<void>;
}

interface TaskInput {
  userId: string;
  channel: 'web' | 'feishu' | 'whatsapp' | 'telegram';
  message: string;
  metadata?: Record<string, any>;
}

interface Task {
  id: string;
  userId: string;
  channel: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  subtasks: Subtask[];
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
}
```

### 6.3 Planner Agent 模块

#### 6.3.1 核心逻辑

```typescript
interface PlannerAgent {
  // 主入口：处理用户需求
  process(userRequest: string): Promise<Plan>;
  
  // 任务拆解
  decompose(request: string): Promise<Subtask[]>;
  
  // 选择合适的 Agent
  selectAgent(task: Subtask): AgentType;
  
  // 编排执行顺序
  orchestrate(subtasks: Subtask[]): ExecutionPlan;
  
  // 执行并汇总
  executeAndSummarize(plan: ExecutionPlan): Promise<Result>;
}
```

#### 6.3.2 Prompt 模板 (参考 OpenManus)

```markdown
## System Prompt - Planner Agent

你是一个任务规划专家。你的任务是将用户的需求拆解为可执行的子任务。

## 任务拆解原则

1. **原子性**: 每个子任务应该是独立的、可单独执行的
2. **顺序性**: 考虑子任务之间的依赖关系
3. **可观测性**: 每个子任务都应该有明确的输出

## 输出格式

请按照以下 JSON 格式输出:

```json
{
  "subtasks": [
    {
      "id": "step_1",
      "description": "子任务描述",
      "agent": "合适的 Agent 类型",
      "input": "给 Agent 的具体输入",
      "depends_on": ["前置任务ID"],
      "expected_output": "期望输出"
    }
  ],
  "execution_order": "serial | parallel",
  "summary": "任务总览"
}
```

## Agent 类型参考

- `malong`: 代码执行、数据分析
- `longyaren`: 内容创作、SEO 优化
- `search`: 网络搜索、信息收集
- `browser`: 网页自动化操作
```

### 6.4 Notification Service 模块

#### 6.4.1 通知类型

```typescript
type NotificationType = 
  | 'task_started'      // 任务开始
  | 'subtask_completed' // 子任务完成
  | 'progress'          // 进度通报
  | 'need_confirmation' // 需要确认
  | 'task_completed'    // 任务完成
  | 'task_failed'       // 任务失败
  | 'error_alert';      // 错误警报

interface Notification {
  type: NotificationType;
  taskId: string;
  title: string;
  content: string;
  actions?: NotificationAction[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationAction {
  label: string;
  action: 'approve' | 'reject' | 'modify' | 'view';
  payload?: any;
}
```

#### 6.4.2 消息模板

```markdown
### 任务进度通知

🔔 任务进度: {task_name}
{progress_bar}

✅ 步骤 {completed}/{total}: {step_name} - 完成
⏳ 步骤 {current}/{total}: {step_name} - 进行中

[View Details]
```

---

## 7. OpenClaw 能力复用方案

### 7.1 复用能力清单

OpenClaw 提供的核心能力可直接复用：

| 能力 | 复用方式 | 用途 |
|------|----------|------|
| **sessions_spawn** | 直接调用 | 派发任务给子 Agent |
| **sessions_send** | 直接调用 | Agent 间通信 |
| **Browser 工具** | 直接调用 | 网页自动化 |
| **Exec 工具** | 直接调用 | Shell 命令执行 |
| **Search 工具** | 直接调用 | 网络搜索 |
| **Message 工具** | 直接调用 | 结果推送 |
| **TTS 工具** | 直接调用 | 语音输出 |
| **Cron Jobs** | 直接调用 | 定时任务 |
| **WebSocket** | 集成 | 实时进度推送 |

### 7.2 具体集成代码

```typescript
// 派发任务给子 Agent
import { sessions_spawn } from 'openclaw';

async function executeSubtask(subtask: Subtask): Promise<any> {
  const result = await sessions_spawn({
    agentId: subtask.agent,  // malong, longyaren, search
    task: subtask.input,
    mode: 'run',
    timeoutSeconds: 300,
  });
  
  return result;
}

// 发送通知
import { message } from 'openclaw';

async function sendNotification(
  channel: string,
  notification: Notification
): Promise<void> {
  await message({
    action: 'send',
    channel: channel,
    message: formatNotification(notification),
  });
}
```

---

## 8. OpenManus 代码复用方案

### 8.1 可复用模块

OpenManus 代码可复用程度如下：

| 模块 | 行数 | 复用方式 | 改动量 |
|------|------|----------|--------|
| config.py | ~100 | 直接复制 | 0 |
| schema.py | ~150 | 直接复制 | 小 |
| prompts/planning.md | ~200 | 直接复制 | 小 |
| prompts/reasoning.md | ~150 | 参考改写 | 中 |
| llm.py | ~300 | 参考改写 | 中 |
| flow/base.py | ~200 | 参考改写 | 中 |
| flow/sequential.py | ~100 | 参考改写 | 小 |
| agent/planning.py | ~250 | 参考改写 | 大 |
| tools/python.py | ~150 | 复用思路 | 中 |

**总计**: ~1600 行，**55% 可直接用或参考**

### 8.2 直接复制模块

#### 8.2.1 config.py

```python
# 可直接复制到: manus_style/config.py
# 只需修改部分 API 调用

from dataclasses import dataclass
from typing import Optional
import toml

@dataclass
class LLMConfig:
    model: str
    base_url: str
    api_key: str
    max_tokens: int = 4096
    temperature: float = 0.0

@dataclass  
class Config:
    llm: LLMConfig

def load_config(path: str = "config.toml") -> Config:
    """加载配置文件"""
    with open(path, 'r') as f:
        data = toml.load(f)
    return Config(**data)
```

#### 8.2.2 schema.py

```python
# 可直接复制到: manus_style/schema.py

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

@dataclass
class ToolCall:
    tool_name: str
    arguments: Dict[str, Any]
    result: Optional[Any] = None
    
@dataclass
class Subtask:
    id: str
    description: str
    agent: str
    status: TaskStatus
    tool_calls: List[ToolCall] = field(default_factory=list)
    result: Optional[Any] = None
    
@dataclass
class Task:
    id: str
    user_id: str
    input: str
    status: TaskStatus
    subtasks: List[Subtask] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
```

### 8.3 参考改写模块

#### 8.3.1 Planning Agent (参考 OpenManus)

```python
# 参考: OpenManus/agent/planning.py
# 改写为适配 OpenClaw sessions_spawn 的版本

from typing import List
from .schema import Subtask, TaskStatus
from .llm import LLM

class PlannerAgent:
    def __init__(self, llm: LLM):
        self.llm = llm
        
    async def decompose(self, user_request: str) -> List[Subtask]:
        """将用户需求拆解为子任务"""
        
        prompt = f"""
        请将以下用户需求拆解为可执行的子任务:
        
        需求: {user_request}
        
        请输出 JSON 格式的子任务列表。
        """
        
        response = await self.llm.chat(prompt)
        subtasks = self._parse_response(response)
        
        return subtasks
    
    def _parse_response(self, response: str) -> List[Subtask]:
        """解析 LLM 响应为子任务列表"""
        # 实现解析逻辑
        pass
    
    async def execute(self, subtask: Subtask) -> Any:
        """通过 OpenClaw sessions_spawn 执行子任务"""
        # 调用 OpenClaw sessions_spawn
        pass
```

### 8.4 不建议复用的模块

| 模块 | 原因 |
|------|------|
| tools/browser.py | OpenClaw 已有 Browser 工具 |
| tools/search.py | OpenClaw 已有 Search 工具 |
| tools/file.py | OpenClaw 已有 Read/Write 工具 |
| docker/* | 我们用 OpenClaw 部署 |

---

## 9. Channel 集成设计

### 9.1 Channel 职责划分

| Channel | 角色 | 权限 |
|---------|------|------|
| **Web UI** | 任务发起、实时查看、确认操作 | 全部 |
| **Feishu** | 通知推送、确认回复 | 只读+按钮 |
| **WhatsApp** | 通知推送、确认回复 | 只读+按钮 |
| **Telegram** | 通知推送、确认回复 | 只读+按钮 |

### 9.2 消息流设计

```
Web UI (任务入口)
    │
    ├── 创建任务
    │
    ▼
Task Manager (任务管理)
    │
    ├── 任务执行
    │
    ├── Notification Service
    │     │
    │     ├── if 需要确认 → 推送到所有 Channel
    │     │
    │     ├── if 重要节点 → 推送到所有 Channel
    │     │
    │     └── if 完成 → 推送到所有 Channel + WebSocket
    │
    ▼
Channel 输出
    ├── Web UI → 实时更新
    ├── Feishu → 消息推送
    ├── WhatsApp → 消息推送
    └── Telegram → 消息推送
```

### 9.3 确认流程实现

```typescript
// 用户在 Channel 点击按钮确认

interface ConfirmationRequest {
  taskId: string;
  subtaskId: string;
  message: string;
  options: {
    label: string;
    action: 'approve' | 'reject' | 'modify';
    payload?: any;
  }[];
}

// Channel 处理确认
async function handleConfirmation(
  channel: string,
  userId: string,
  action: string,
  payload: any
): Promise<void> {
  const task = await taskManager.getTask(payload.taskId);
  
  switch (action) {
    case 'approve':
      await taskManager.resumeTask(task.id);
      break;
    case 'reject':
      await taskManager.cancelTask(task.id);
      break;
    case 'modify':
      await taskManager.updateTask(task.id, payload.updates);
      await taskManager.resumeTask(task.id);
      break;
  }
}
```

---

## 10. 前端界面设计

### 10.1 页面结构

```
/manus/
├── /                    # 首页/Dashboard
├── /tasks               # 任务列表
│   ├── /new             # 创建新任务
│   └── /:taskId         # 任务详情
├── /agents              # Agent 管理
├── /settings            # 设置
└── /workspace           # 文件工作区
```

### 10.2 核心页面设计

#### 10.2.1 任务创建页面

- 任务输入框（大文本区域）
- 示例任务快捷按钮
- 开始执行按钮

#### 10.2.2 任务执行页面

- 任务状态和进度条
- 执行步骤列表（Think-Act-Observe 展示）
- 实时思考过程气泡
- 工具调用卡片
- 生成结果预览

### 10.3 组件清单

| 组件 | 功能 |
|------|------|
| TaskInput | 任务输入框 |
| TaskList | 任务列表 |
| TaskDetail | 任务详情 |
| TaskProgress | 执行进度条 |
| ThinkBubble | AI 思考过程展示 |
| ToolCallCard | 工具调用卡片 |
| ResultViewer | 结果查看器 |
| FileManager | 文件管理 |
| ConfirmationModal | 确认弹窗 |

---

## 11. 数据模型设计

### 11.1 核心数据模型

```typescript
// Task 模型
interface Task {
  id: string;                    // 任务 ID (uuid)
  userId: string;               // 用户 ID
  channel: 'web' | 'feishu' | 'whatsapp' | 'telegram';
  input: string;                // 用户原始输入
  status: TaskStatus;           // 任务状态
  currentStep: number;          // 当前步骤
  subtasks: Subtask[];         // 子任务列表
  createdAt: Date;             // 创建时间
  updatedAt: Date;             // 更新时间
  completedAt?: Date;          // 完成时间
  result?: TaskResult;         // 最终结果
  error?: string;              // 错误信息
  metadata: Record<string, any>; // 扩展字段
}

interface Subtask {
  id: string;
  taskId: string;
  description: string;
  agent: AgentType;
  status: TaskStatus;
  input: string;
  output?: any;
  dependsOn: string[];         // 依赖的前置任务
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';
type AgentType = 'malong' | 'longyaren' | 'search' | 'browser';
```

### 11.2 数据存储

```typescript
// JSON 文件存储结构
interface Storage {
  tasks: Record<string, Task>;
  users: Record<string, User>;
  config: Config;
}
```

---

## 12. API 接口设计

### 12.1 REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/tasks | 创建新任务 |
| GET | /api/tasks | 列出任务 |
| GET | /api/tasks/:id | 获取任务详情 |
| PATCH | /api/tasks/:id | 更新任务 |
| DELETE | /api/tasks/:id | 取消任务 |
| POST | /api/tasks/:id/pause | 暂停任务 |
| POST | /api/tasks/:id/resume | 恢复任务 |
| POST | /api/tasks/:id/confirm | 确认操作 |

### 12.2 WebSocket API

| 事件 | 方向 | 说明 |
|------|------|------|
| task:created | Server→Client | 任务创建 |
| task:progress | Server→Client | 进度更新 |
| task:thinking | Server→Client | 思考过程 |
| task:tool_call | Server→Client | 工具调用 |
| task:tool_result | Server→Client | 工具结果 |
| task:completed | Server→Client | 任务完成 |
| task:failed | Server→Client | 任务失败 |
| task:paused | Server→Client | 等待确认 |
| confirmation:request | Server→Client | 确认请求 |

---

## 13. 开发计划与里程碑

### 13.1 开发阶段

| 阶段 | 内容 | 时间 | 优先级 |
|------|------|------|--------|
| **Phase 1** | 核心架构搭建 | 1周 | P0 |
| **Phase 2** | Planner Agent 实现 | 1周 | P0 |
| **Phase 3** | 通知服务 | 0.5周 | P0 |
| **Phase 4** | Channel 集成 | 1周 | P1 |
| **Phase 5** | 前端界面 | 1周 | P1 |
| **Phase 6** | 数据分析 Agent | 1周 | P2 |
| **Phase 7** | 测试与优化 | 1周 | P2 |

**总计**: 约 6.5 周

### 13.2 里程碑

| 里程碑 | 完成标准 |
|--------|----------|
| M1 | 可执行简单任务（搜索→汇总） |
| M2 | 可执行复杂任务（拆解→执行→汇总） |
| M3 | 支持多 Channel 通知 |
| M4 | Web UI 上线 |
| M5 | Beta 发布 |

---

## 14. 风险评估与应对

### 14.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| LLM 理解能力不足 | 任务拆解失败 | 优化 Prompt，增加重试机制 |
| Agent 执行超时 | 任务卡住 | 超时自动跳过或重试 |
| 状态同步问题 | 数据不一致 | 引入状态机，确保原子操作 |

### 14.2 产品风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 用户需求复杂 | 无法处理 | 限制场景，逐步扩展 |
| 性能问题 | 体验差 | 异步处理，缓存优化 |

---

## 15. 附录：参考资源

### 15.1 代码参考

| 项目 | 用途 | URL |
|------|------|-----|
| OpenManus | 核心架构参考 | https://github.com/FoundationAgents/OpenManus |
| OpenManusWeb | 前端参考 | https://github.com/YunQiAI/OpenManusWeb |
| browser-use | 浏览器工具 | https://github.com/browser-use/browser-use |
| MetaGPT | 多 Agent 框架 | https://github.com/geekan/MetaGPT |

### 15.2 技术文档

| 技术 | 文档 |
|------|------|
| OpenClaw | https://docs.openclaw.ai |
| VMind | https://visactor.io/vmind |
| VChart | https://visactor.io/vchart |

### 15.3 相关资料

- Manus AI 产品分析
- OpenManus 架构深度解析
- GAIA 基准测试说明

---

**文档版本**: v1.0  
**最后更新**: 2026-03-16  
**预计页数**: 10+ 页 (不含代码块)

---

## 16. 独立部署与隔离架构

### 16.1 设计目标

实现 Manus-Style 作为**独立产品**部署，完全隔离与主 OpenClaw 的关系，支持多租户和独立销售。

### 16.2 部署模式

#### 16.2.1 单实例模式（个人使用）

```
OpenClaw (主平台)
    |
    ├── Dashboard :18789
    |
    └── Manus-Style 作为 subagent 运行
        ├── 使用主 OpenClaw 资源
        ├── 共享 Agent 池
        └── 独立 Workspace
```

#### 16.2.2 独立部署模式（产品化）

```
OpenClaw (仅提供 Agent 能力)
    |
    └── Manus-Style (独立产品)
        ├── 独立端口 (:3001)
        ├── 独立 Workspace
        ├── 独立 Agent 配置
        └── 独立数据库
```

### 16.3 隔离架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenClaw (Agent 能力提供者)                   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Agent Pool                                             │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│   │  │ 码龙    │ │ 龙雅人   │ │ Manus   │ │ 其他    │  │   │
│   │  │         │ │          │ │ (隔离)  │ │         │  │   │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                    sessions_spawn API
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Manus-Style (独立产品)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 隔离层                                                     │   │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐           │   │
│  │ │ Workspace  │ │  Memory    │ │  Config   │           │   │
│  │ │ 隔离       │ │ 隔离       │ │ 隔离      │           │   │
│  │ └────────────┘ └────────────┘ └────────────┘           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 应用层                                                     │   │
│  │ ├── Task Manager                                         │   │
│  │ ├── Planner Agent                                        │   │
│  │ ├── Notification Service                                 │   │
│  │ └── API Server (:3001)                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 16.4 隔离维度

| 隔离维度 | 实现方式 | 配置项 |
|----------|----------|--------|
| **Agent 隔离** | 专属 Agent + Sandbox | `sandbox.enabled: true` |
| **Workspace 隔离** | 独立目录 | `sandbox.workspace: ~/manus-workspace` |
| **Memory 隔离** | 独立目录 | `sandbox.memory: memory/manus/` |
| **Network 隔离** | 独立端口 | `server.port: 3001` |
| **Config 隔离** | 独立配置 | `config.path: config/manus.toml` |
| **资源限制** | 并发/超时限制 | `sandbox.maxConcurrent: 5` |

### 16.5 Agent Sandbox 配置

```yaml
# config/manus-sandbox.toml
[sandbox]
enabled = true
workspace = "~/manus-workspace"
memory = "memory/manus/"

[sandbox.agent]
# 分配专属 Agent
agentId = "manus-agent"

[sandbox.limits]
# 资源限制
maxConcurrent = 5
timeout = 600  # 10分钟
maxMemory = "512MB"
maxFileSize = "100MB"

[sandbox.network]
# 网络限制
port = 3001
allowedHosts = ["api.openclaw.ai"]
blockedHosts = []
```

### 16.6 多租户模式

```
OpenClaw (主平台)
    │
    ├── Agent Pool (共享)
    │
    ├── Manus-Style Tenant A
    │   ├── Workspace: ~/tenant-a/
    │   ├── Agent: manus-agent-a
    │   └── Config: config/tenant-a.toml
    │
    ├── Manus-Style Tenant B
    │   ├── Workspace: ~/tenant-b/
    │   ├── Agent: manus-agent-b
    │   └── Config: config/tenant-b.toml
    │
    └── Manus-Style Tenant C
        ├── Workspace: ~/tenant-c/
        ├── Agent: manus-agent-c
        └── Config: config/tenant-c.toml
```

### 16.7 独立部署清单

| 组件 | 部署方式 | 备注 |
|------|----------|------|
| **Manus-Style Core** | Docker / Node.js | 独立进程 |
| **Workspace** | 独立目录 | 数据隔离 |
| **Agent** | 专属配置 | 能力隔离 |
| **Database** | 独立实例 | 可选 SQLite |
| **Redis** | 共享/独立 | 缓存 |
| **Nginx** | 反向代理 | 端口 :80 → :3001 |

### 16.8 升级策略

| 场景 | 策略 |
|------|------|
| **补丁更新** | 热更新，不影响运行 |
| **小版本更新** | 平滑重启 |
| **大版本更新** | 蓝绿部署 |
