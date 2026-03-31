# Atlas

Atlas 是一个基于 PocketBase 的可扩展命令行工具集。

当前已实现的模块是 `txns`，用于命令行记账，包括新增、查询、更新、删除，以及指定时间范围内的收支分析。后续可以继续扩展到其他模块，例如日记、清单、个人数据管理等。

## 当前能力

- 使用 `login` 登录 PocketBase 超级管理员账号，并将访问令牌保存到本地配置文件
- 使用 `txns` 对 PocketBase 中的 `txns` collection 做增删改查
- 使用 `txns analyze` 统计一段时间内的总收入、总支出、净收入，以及分类金额和占比
- 支持 `text` 和 `json` 两种输出格式
- 提供 `skills/atlas-cli`，便于 Agent 以稳定的 JSON 输出方式调用

## 环境要求

- Rust 稳定版工具链
- 可访问的 PocketBase 服务
- 本机安装 `just`

## PocketBase 初始化

当前代码约定操作的 collection 名称为 `txns`。

推荐在 PocketBase 中创建以下字段：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `occurred` | `date` | 发生时间，建议必填 |
| `kind` | `select` | 单选，候选值：`收入`、`支出` |
| `amount` | `number` | 金额，单位为元，支持小数 |
| `category` | `select` | 单选，候选值见下文 |
| `note` | `text` | 备注，可为空 |

`category` 候选值：

- `餐饮`
- `交通`
- `住房`
- `购物`
- `日用`
- `娱乐`
- `医疗`
- `学习`
- `通讯`
- `人情`
- `旅行`
- `工资`
- `奖金`
- `报销`
- `退款`
- `副业`
- `其他`

CLI 还会做收支与分类的联动校验：

- `支出` 允许：`餐饮`、`交通`、`住房`、`购物`、`日用`、`娱乐`、`医疗`、`学习`、`通讯`、`人情`、`旅行`、`其他`
- `收入` 允许：`工资`、`奖金`、`报销`、`退款`、`副业`、`其他`

## 快速开始

查看总帮助：

```bash
cargo run -- --help
```

登录 PocketBase：

```bash
cargo run -- login \
  --base-url http://127.0.0.1:8090 \
  --email admin@example.com \
  --password 'your-password'
```

新增一条支出：

```bash
cargo run -- txns add \
  --kind 支出 \
  --amount 25.80 \
  --category 餐饮 \
  --note 午饭
```

列出某个月的账目：

```bash
cargo run -- txns list --month 2026-03
```

分析时间范围：

```bash
cargo run -- txns analyze --start 2026-03-01 --end 2026-03-31
```

使用 JSON 输出：

```bash
cargo run -- --output json txns list --month 2026-03
```

## 命令概览

顶层命令：

- `atlas login`
- `atlas txns`

`txns` 子命令：

- `add`
- `list`
- `analyze`
- `get`
- `update`
- `delete`

时间参数支持以下格式：

- RFC3339
- `YYYY-MM-DD HH:MM:SS`
- `YYYY-MM-DD`

其中 `txns analyze` 在仅传日期时会自动扩展：

- `--start` 扩展为当天 `00:00:00`
- `--end` 扩展为当天 `23:59:59`

## 输出格式

默认输出格式为 `text`，适合人工阅读。

如果需要稳定地供脚本、Agent 或 skill 解析，建议统一使用：

```bash
atlas --output json ...
```

成功返回：

```json
{
  "ok": true,
  "data": {}
}
```

失败返回：

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "..."
  }
}
```

常见错误码：

- `missing_config`
- `config_error`
- `validation_error`
- `time_parse_error`
- `authentication_error`
- `not_found`
- `network_error`
- `pocketbase_error`

## 本地配置

登录成功后，配置会保存到系统配置目录下的 `atlas/config.toml`。

- macOS 下通常位于 `~/Library/Application Support/atlas/config.toml`
- 可以通过环境变量 `ATLAS_CONFIG_DIR` 覆盖配置目录

## 开发命令

项目根目录提供了 `Justfile`：

- `just fmt`：格式化代码
- `just check`：快速编译检查
- `just clippy`：运行 Clippy 静态检查
- `just test`：运行测试
- `just verify`：格式、编译、Clippy、测试一把过
- `just help`：查看 CLI 帮助
- `just txns -- list --month 2026-03`：运行 `txns` 模块
- `just txns-json -- analyze --start 2026-03-01 --end 2026-03-31`：以 JSON 输出运行 `txns`
- `just install`：安装 `atlas` 二进制并同步 `atlas-cli` skill

## 安装到本机

执行：

```bash
just install
```

会完成两件事：

- 将 `atlas` 安装到 `~/.local/bin/atlas`
- 将仓库内的 `skills/atlas-cli` 同步到 `~/.codex/skills/atlas-cli`

请确保 `~/.local/bin` 已加入 `PATH`。

## 项目结构

```text
src/
  app/        应用入口与命令分发
  cli/        Clap 命令行定义
  core/       通用错误与输出封装
  features/   按模块组织的业务能力
  infra/      PocketBase 与本地配置等基础设施
skills/
  atlas-cli/  供 Agent 使用的 skill
```

## 后续扩展方向

- 在 `src/features/<module>` 下新增模块
- 在 `src/cli` 中接入新的顶层命令
- 保持 `--output json` 的稳定输出约定
- 如需面向 Agent 使用，再补充对应 skill 文档
