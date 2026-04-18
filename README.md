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

生产环境按单机 Linux、自托管、IP:Port 直连设计，推荐使用 `systemd + bun run start`。

1. 准备服务器环境：

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

如果你的服务器还没有 Node.js，请额外安装 Node.js 20 LTS，因为 `next start` 运行时依赖 Node。

2. 拉取代码并安装依赖：

```bash
git clone <你的仓库地址> /srv/atlas
cd /srv/atlas
bun install
```

3. 从模板复制生产环境变量文件：

```bash
cp .env.example .env.production
```

4. 按服务器实际情况修改以下关键字段：

- `BETTER_AUTH_URL=http://<server-ip>:<port>`
- `DATABASE_URL=<生产 PostgreSQL 连接串>`
- `S3_*=<生产对象存储配置>`
- `HOSTNAME=0.0.0.0`
- `PORT=<实际监听端口>`

5. 导入生产环境变量，执行迁移并构建：

```bash
set -a
source .env.production
set +a
export NODE_ENV=production

bun run db:migrate
bun run build
```

6. 手动验证启动：

```bash
NODE_ENV=production bun run start
```

确认可以通过 `http://<server-ip>:<port>` 访问后，再交给 `systemd` 托管。

7. 创建 `systemd` 服务文件：

先确认 Bun 的绝对路径：

```bash
which bun
```

然后创建 `/etc/systemd/system/atlas.service`：

```ini
[Unit]
Description=Atlas
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/atlas
EnvironmentFile=/srv/atlas/.env.production
Environment=NODE_ENV=production
ExecStart=/absolute/path/to/bun run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

其中 `ExecStart` 需要替换成上一步 `which bun` 的输出，例如：

```ini
ExecStart=/root/.bun/bin/bun run start
```

8. 启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable atlas
sudo systemctl start atlas
sudo systemctl status atlas
```

9. 更新部署：

```bash
cd /srv/atlas
git pull

set -a
source .env.production
set +a
export NODE_ENV=production

bun install
bun run db:migrate
bun run build
sudo systemctl restart atlas
```

常用排查命令：

```bash
sudo systemctl status atlas
sudo journalctl -u atlas -n 200 --no-pager
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
