[English](./README.md)

# Atlas

Atlas 是一个面向知识管理与 AI 协作的一体化平台。

当前仓库已经进入产品基础能力建设阶段，具备认证、受保护的个人工作台和 Markdown 编辑流，但更完整的知识与 AI 模块仍在持续建设中。

## Atlas 要解决的问题

- 把笔记、文档和结构化知识统一沉淀到同一个工作空间。
- 让知识可以被检索、关联、复用，而不是分散在孤立工具里。
- 支持 AI 辅助写作、检索、总结和协作等工作流。

## 当前状态

- 项目基于 Next.js App Router、React 19、TypeScript 和 Bun。
- UI 已迁移到 shadcn/ui 的官方 `base` preset 工作流，并通过 `components.json` 管理生成组件。
- 认证基于 PostgreSQL 和 Drizzle，使用数据库持久会话。
- 当前首页是受保护的 Markdown 工作台，支持 Vditor 编辑、文档树、自动保存、历史版本和大纲查看。

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
├── src/components/    # 共享 UI 与应用层组合组件
├── src/lib/           # 认证、数据库、文档等领域能力
├── public/            # 静态资源
├── AGENTS.md          # 项目级实现约束与说明
├── biome.json         # 格式化与静态检查配置
├── components.json    # shadcn registry 配置
├── next.config.ts     # Next.js 配置
├── package.json       # 脚本与依赖
└── tsconfig.json      # TypeScript 配置
```

## 说明

- `AGENTS.md` 用于存放面向 coding agent 和仓库自动化的项目实现规则。
- `src/components/ui/*` 下的 shadcn 基础组件应通过官方 CLI 添加，并视为 registry 生成代码，而不是手工维护的业务组件。
