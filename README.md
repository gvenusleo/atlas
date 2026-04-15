# Atlas

Atlas 是一个基于 Next.js 的个人知识管理与 AI 协作平台，面向知识沉淀、组织、检索、生成与协同使用场景。

## 项目目标

- 建立统一的个人知识管理工作台。
- 提供可持续演进的 AI 协作能力与内容工作流。
- 以全栈方式打通前端体验、服务端能力与数据持久化。

## 技术栈

- Next.js 16
- React 19
- Bun
- PostgreSQL
- shadcn/ui
- Tailwind CSS 4

## 本地开发

安装依赖：

```bash
bun install
```

启动开发环境：

```bash
bun run dev
```

常用质量检查命令：

```bash
bun run lint
bun run typecheck
bun run build
```

数据库与认证相关命令：

```bash
bun run auth:generate
bun run db:generate
bun run db:migrate
```

## 环境变量

除了 `DATABASE_URL`，认证首版还需要以下变量：

```bash
BETTER_AUTH_SECRET=replace-with-a-random-secret
BETTER_AUTH_URL=http://localhost:3000
```

## 目录概览

- `app/`：应用路由、页面、布局与服务端入口。
- `components/`：业务组件与通用组件。
- `hooks/`：可复用交互逻辑。
- `lib/`：工具函数与基础能力。
- `public/`：静态资源。

## 规划方向

- 个人知识采集、整理、检索与沉淀。
- AI 辅助写作、总结、问答与协作。
- 围绕 PostgreSQL 构建稳定、可扩展的数据层能力。

## 协作入口

项目协作与工程约束请查看 [AGENTS.md](./AGENTS.md)。
