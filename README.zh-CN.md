[English](./README.md)

# Atlas

Atlas 是一个面向知识管理与 AI 协作的一体化平台。

当前仓库还处于产品基础设施搭建阶段，已经具备应用骨架、基础工具链和项目文档，但核心产品模块仍在持续建设中。

## Atlas 要解决的问题

- 把笔记、文档和结构化知识统一沉淀到同一个工作空间。
- 让知识可以被检索、关联、复用，而不是分散在孤立工具里。
- 支持 AI 辅助写作、检索、总结和协作等工作流。

## 当前状态

- 项目基于 Next.js App Router、React、TypeScript 和 Bun。
- 仓库级基础设施和协作约定正在逐步完善。
- 数据库接入、编辑器接入和具体产品流程仍在实现中。

## 快速开始

安装依赖：

```bash
bun install
```

启动开发服务器：

```bash
bun run dev
```

然后打开 `http://localhost:3000`。

## 可用命令

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run format
```

## 仓库结构

```text
.
├── src/app/           # Next.js App Router 入口
├── public/            # 静态资源
├── AGENTS.md          # 项目级实现约束与说明
├── biome.json         # 格式化与静态检查配置
├── next.config.ts     # Next.js 配置
├── package.json       # 脚本与依赖
└── tsconfig.json      # TypeScript 配置
```

## 说明

- `AGENTS.md` 用于存放面向 coding agent 和仓库自动化的项目实现规则。
- 当前首页仍是默认脚手架页面，不代表最终产品界面。
