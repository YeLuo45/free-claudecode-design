# Free Claude Code Design Specification

## 1. Project Overview

| Item | Value |
|------|-------|
| Name | Free Claude Code Design |
| Description | Free Claude Code Anthropic 兼容代理设计规范文档站 |
| Based On | github.com/Alishahryar1/free-claude-code |
| Type | Design Documentation (VitePress) |
| Language | 中文 + English |

## 2. Core Value Proposition

Free Claude Code 是一个 Anthropic 兼容代理，将 Claude Code 的 API 流量路由到 NVIDIA NIM、Kimi、Wafer、OpenRouter、DeepSeek、LM Studio、llama.cpp 或 Ollama。

**核心特性**：
- 8 个提供商后端：NVIDIA NIM, Kimi, Wafer, OpenRouter, DeepSeek, LM Studio, llama.cpp, Ollama
- 按模型路由：Opus/Sonnet/Haiku 流量分发到不同提供商
- 流式响应、工具使用、推理/thinking block 处理
- 可选 Discord/Telegram 机器人包装
- 可选语音转录（Whisper/NVIDIA NIM）
- 本地 Admin UI

## 3. Architecture Overview

```
free-claude-code/
├── api/                    # HTTP 路由、请求编排、模型路由、认证
│   ├── routes.py          # API 路由
│   ├── app.py             # FastAPI 应用
│   ├── runtime.py         # 应用组合
│   ├── dependencies.py    # 依赖注入
│   └── model_router.py    # 模型路由器
├── providers/             # 上游模型适配器
│   ├── nvidia_nim/        # NVIDIA NIM
│   ├── kimi/              # Kimi
│   ├── wafer/             # Wafer
│   ├── open_router/       # OpenRouter
│   ├── deepseek/          # DeepSeek
│   ├── lmstudio/          # LM Studio
│   ├── llamacpp/          # llama.cpp
│   └── ollama/            # Ollama
├── core/
│   └── anthropic/         # Anthropic 协议助手
├── messaging/             # Discord/Telegram 适配器
│   ├── handler.py
│   ├── commands.py
│   ├── session.py
│   └── platforms/
├── cli/                   # Claude CLI 子进程管理
├── config/                # 环境配置
├── smoke/                 # 产品烟雾测试
└── tests/                 # 合约测试
```

## 4. Module Structure

| Module | Description |
|--------|-------------|
| api | HTTP 路由、请求编排、模型路由、认证 |
| providers | 上游模型适配器、流式转换、限速 |
| core/anthropic | Anthropic 协议助手、流式原语 |
| messaging | Discord/Telegram 适配器、命令处理 |
| cli | Claude CLI 子进程管理 |
| config | 环境配置、日志设置 |
| smoke | 产品烟雾测试 |

## 5. 依赖方向

```
config --> api --> cli
  |       |       |
  v       v       v
providers core messaging
  ^
  |
api --> providers
```

## 6. 设计原则

| 原则 | 说明 |
|------|------|
| 共享协议逻辑 | Anthropic 协议逻辑放在 `core/anthropic/` |
| DRY | 提取共享基类消除重复 |
| 封装 | 使用访问器方法而非直接属性赋值 |
| 最小依赖 | API 只导入 `providers.base`, `providers.exceptions`, `providers.registry` |
| 无 type ignore | 修复类型问题，不使用 `# type: ignore` |

## 7. 技术栈

| 层级 | 技术 |
|------|------|
| 语言 | Python 3.14 |
| Web 框架 | FastAPI |
| 类型检查 | Ty |
| 代码格式 | Ruff |
| 日志 | Loguru |
| 测试 | Pytest |
| 包管理 | UV |

## 8. 文档结构

```
docs-site/
├── index.md              # 首页
├── architecture.md       # 架构分析
├── api.md               # API 模块
├── providers.md         # 提供商
├── core.md              # 核心模块
├── messaging.md         # 消息系统
├── cli.md               # CLI 模块
├── smoke.md             # 烟雾测试
└── package.json
```

## 9. 部署

- **Platform**: GitHub Pages
- **Mode**: workflow mode (GitHub Actions)
- **Build Tool**: VitePress
- **Theme**: Custom dark theme

## 10. Version

- v0.1.0 — 初始版本，基于 free-claude-code 源码分析
