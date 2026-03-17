# Manus-Style

基于 OpenClaw 的通用 AI Agent 任务执行系统。

## 目录结构

```
manus-style/
├── src/
│   ├── core/       # 核心模块 (TaskManager, StateMachine, Storage)
│   ├── agents/     # Agent 相关 (PlannerAgent, Scheduler)
│   ├── services/   # 服务层 (Notification, Channel)
│   ├── api/        # API 层 (REST, WebSocket)
│   ├── types/      # 类型定义
│   └── utils/      # 工具函数
├── test/
│   ├── unit/       # 单元测试
│   ├── integration/ # 集成测试
│   └── e2e/        # E2E 测试
├── docs/           # 文档
├── config/         # 配置文件
└── scripts/        # 脚本
```

## 开发

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 运行测试
npm test
```
