import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Free Claude Code Design",
  description: "Free Claude Code Anthropic 兼容代理设计规范文档站",
  lang: "zh-CN",

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
  ],

  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "首页", link: "/" },
      { text: "架构分析", link: "/architecture" },
      { text: "API 模块", link: "/api" },
      { text: "提供商", link: "/providers" },
      { text: "核心模块", link: "/core" },
      { text: "消息系统", link: "/messaging" },
    ],

    sidebar: [
      {
        text: "文档",
        items: [
          { text: "首页", link: "/" },
          { text: "架构分析", link: "/architecture" },
          { text: "API 模块", link: "/api" },
          { text: "提供商", link: "/providers" },
          { text: "核心模块", link: "/core" },
          { text: "消息系统", link: "/messaging" },
          { text: "CLI 模块", link: "/cli" },
          { text: "烟雾测试", link: "/smoke" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/Alishahryar1/free-claude-code" },
    ],

    footer: {
      message: "基于 Free Claude Code 开源项目构建",
      copyright: "Copyright © 2024-present Free Claude Code Contributors",
    },
  },
});
