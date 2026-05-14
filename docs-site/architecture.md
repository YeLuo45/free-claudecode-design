# Free Claude Code 架构分析

## 1. 项目概述

Free Claude Code 是一个 Anthropic 兼容代理，将 Claude Code 的 API 流量路由到 NVIDIA NIM、Kimi、Wafer、OpenRouter、DeepSeek、LM Studio、llama.cpp 或 Ollama。

**技术栈**：
| 层级 | 技术 |
|------|------|
| 语言 | Python 3.14 |
| Web 框架 | FastAPI |
| 类型检查 | Ty |
| 代码格式 | Ruff |
| 日志 | Loguru |
| 测试 | Pytest |
| 包管理 | UV |

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code CLI                          │
│              (发送 Anthropic API 请求)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     api/ (HTTP 代理)                         │
│  routes.py — 路由定义                                        │
│  app.py — FastAPI 应用                                      │
│  runtime.py — 应用组合                                       │
│  dependencies.py — 依赖注入                                   │
│  model_router.py — 模型路由器                                │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │providers │        │  core/   │        │messaging │
    │          │        │anthropic │        │          │
    └──────────┘        └──────────┘        └──────────┘
          │                                       │
          ▼                                       ▼
    ┌──────────┐                           ┌──────────┐
    │NVIDIA NIM│                           │Discord/  │
    │  Kimi    │                           │Telegram  │
    │OpenRouter│                           │  Bot     │
    │DeepSeek  │                           └──────────┘
    │  ...     │
    └──────────┘
```

## 3. 依赖方向

```
config --> api --> cli
  |       |       |
  v       v       v
providers core messaging
  ^
  |
api --> providers
```

**关键规则**：
- `core/anthropic/` 保持独立，不导入 `api`、`messaging`、`cli`、`providers`
- `api/` 只导入 `providers.base`、`providers.exceptions`、`providers.registry`
- `messaging/` 不导入 `api`、`cli`、`smoke`

## 4. API 模块 (api/)

### 4.1 核心文件

| 文件 | 职责 |
|------|------|
| `routes.py` | API 路由定义 |
| `app.py` | FastAPI 应用 |
| `runtime.py` | 应用组合、消息启动 |
| `dependencies.py` | 依赖注入 |
| `model_router.py` | 模型路由器 |
| `detection.py` | 请求检测 |
| `admin_routes.py` | Admin UI 路由 |

### 4.2 Admin UI

本地 Admin UI 位于 `/admin`，用于：
- 编辑代理设置
- 验证配置变更
- 检查提供商状态

## 5. Providers 模块 (providers/)

### 5.1 提供商列表

| 提供商 | 描述 |
|--------|------|
| `nvidia_nim` | NVIDIA NIM |
| `kimi` | Kimi |
| `wafer` | Wafer |
| `open_router` | OpenRouter |
| `deepseek` | DeepSeek |
| `lmstudio` | LM Studio |
| `llamacpp` | llama.cpp |
| `ollama` | Ollama |

### 5.2 核心文件

| 文件 | 职责 |
|------|------|
| `base.py` | Provider 基类 |
| `registry.py` | Provider 注册表 |
| `defaults.py` | 默认配置 |
| `rate_limit.py` | 限速器 |
| `error_mapping.py` | 错误映射 |
| `anthropic_messages.py` | Anthropic 消息转换 |

## 6. Core 模块 (core/)

### 6.1 Anthropic 协议助手

`core/anthropic/` 包含：
- Anthropic 协议助手
- 流式原语
- 内容提取
- Token 估算
- 用户错误消息
- 请求转换
- Thinking/工具助手

## 7. Messaging 模块 (messaging/)

### 7.1 核心文件

| 文件 | 职责 |
|------|------|
| `handler.py` | 消息处理 |
| `commands.py` | 命令定义 |
| `session.py` | 会话管理 |
| `transcript.py` | 转录渲染 |
| `command_dispatcher.py` | 命令分发 |
| `event_parser.py` | 事件解析 |
| `limiter.py` | 限流器 |

### 7.2 平台适配器

```
messaging/platforms/
├── discord/
└── telegram/
```

## 8. CLI 模块 (cli/)

Claude CLI 子进程管理：
- 包入口点
- 子进程配置
- 子进程生命周期

## 9. 配置 (config/)

```python
# 环境变量配置
ANTHROPIC_API_KEY=xxx
PROVIDER_TYPE=nvidia_nim
PORT=8082
```

## 10. 测试

### 10.1 测试类型

| 类型 | 路径 | 说明 |
|------|------|------|
| 合约测试 | `tests/contracts/` | 导入边界测试 |
| 单元测试 | `tests/` | 标准 pytest |
| 烟雾测试 | `smoke/` | 产品烟雾场景 |

### 10.2 烟雾测试

```bash
# 启用烟雾测试
FCC_LIVE_SMOKE=1 uv run pytest
```

## 11. 设计原则

| 原则 | 说明 |
|------|------|
| 共享协议逻辑 | 放在 `core/anthropic/` |
| DRY | 提取共享基类 |
| 封装 | 使用访问器方法 |
| 无 type ignore | 修复类型问题 |
| 最大测试覆盖 | 包括烟雾测试 |
