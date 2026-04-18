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

仓库只保留一份环境变量模板：`.env.example`。

本地开发时：

```bash
cp .env.example .env.local
```

生产部署时：

```bash
cp .env.example .env.production
```

当前需要的服务端环境变量如下：

```bash
BETTER_AUTH_SECRET=replace-with-a-random-secret
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/atlas
S3_REGION=auto
S3_BUCKET=atlas-dev
S3_ACCESS_KEY_ID=replace-with-your-access-key
S3_SECRET_ACCESS_KEY=replace-with-your-secret-key
S3_PUBLIC_BASE_URL=http://127.0.0.1:9000/atlas-dev
S3_ENDPOINT=http://127.0.0.1:9000
HOSTNAME=0.0.0.0
PORT=3000
```

说明：

- `.env.local` 用于本地开发，不提交到仓库。
- `.env.production` 用于服务器部署，不提交到仓库。
- 生产环境直接通过 `http://IP:PORT` 访问时，`BETTER_AUTH_URL` 应写成 `http://<server-ip>:<port>`。
- `S3_ENDPOINT` 适用于 MinIO 或其他 S3 兼容对象存储；若使用原生 AWS S3，可留空或删除该项。

## 最小生产部署

生产环境按单机 Linux、自托管、IP:Port 直连设计：

1. 安装依赖并构建：

```bash
bun install
bun run build
```

2. 从模板复制生产环境变量文件：

```bash
cp .env.example .env.production
```

3. 按服务器实际情况修改以下关键字段：

- `BETTER_AUTH_URL=http://<server-ip>:<port>`
- `DATABASE_URL=<生产 PostgreSQL 连接串>`
- `S3_*=<生产对象存储配置>`
- `HOSTNAME=0.0.0.0`
- `PORT=<实际监听端口>`

4. 启动 standalone 产物：

```bash
set -a
source .env.production
set +a
NODE_ENV=production node .next/standalone/server.js
```

5. 若使用 `systemd`，可直接让服务从根目录加载 `.env.production`：

```ini
[Unit]
Description=Atlas
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/atlas
EnvironmentFile=/srv/atlas/.env.production
Environment=NODE_ENV=production
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always

[Install]
WantedBy=multi-user.target
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
