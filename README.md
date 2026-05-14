# Free Claude Code Design Documentation

Anthropic 兼容代理设计规范文档站。

## 项目结构

```
free-claudecode-design/
├── SPEC.md                      # 设计规范主文档
├── README.md                    # 项目说明
├── docs-site/                   # VitePress 文档站
│   ├── index.md                # 首页
│   ├── architecture.md         # 架构分析
│   ├── api.md                  # API 模块
│   ├── providers.md            # 提供商
│   ├── core.md                 # 核心模块
│   ├── messaging.md            # 消息系统
│   ├── cli.md                  # CLI 模块
│   ├── smoke.md                # 烟雾测试
│   ├── package.json            # VitePress 依赖
│   └── .vitepress/
│       ├── config.mjs          # VitePress 配置
│       ├── theme/
│       │   ├── index.js        # 主题入口
│       │   └── style.css       # 暗色主题
│       └── public/
│           └── logo.svg        # Logo
└── .github/
    └── workflows/
        └── deploy.yml          # GitHub Actions 部署
```

## 本地开发

```bash
cd docs-site
pnpm install
pnpm run dev     # 开发预览
pnpm run build   # 构建生产版本
```

## 部署

推送到 main 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

## 基于

本项目基于 [Alishahryar1/free-claude-code](https://github.com/Alishahryar1/free-claude-code) 开源项目构建。
