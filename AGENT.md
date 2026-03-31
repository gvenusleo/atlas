# AGENT.md

本文件面向进入本仓库协作的 Agent，目标是降低误判和返工。

## 项目定位

- 项目名为 `atlas`
- 这是一个基于 PocketBase 的可扩展 CLI
- 当前已实现模块有： `txns`
- 用于调用该 CLI 的 Agent Skill 位于 `skills/atlas-cli`

## 当前已实现能力

- `login`：使用 PocketBase 超级管理员账号登录，并保存本地配置
- `txns add` / `list` / `get` / `update` / `delete`
- `txns analyze`：输出总收入、总支出、净收入，以及收入/支出的分类占比
- 全局 `--output text|json`

## 关键约束

- 禁止手动编辑 `Cargo.toml` 添加依赖；如需新增依赖，只能使用 `cargo add`
- 默认保持中文帮助文案、中文业务枚举值、中文 skill 文档
- 面向程序、skill、Agent 的调用，优先使用 `--output json`

## 架构约定

- `src/app`：顶层运行流程和命令分发
- `src/cli`：Clap 命令模型和全局参数
- `src/core`：错误、输出等跨模块通用能力
- `src/features/<module>`：模块化业务代码
- `src/infra`：PocketBase 客户端、本地配置存储等基础设施

新增模块时，优先沿用 `features/<module>` 的组织方式，不要把逻辑重新堆回 `main.rs` 或根级大文件。

## 扩展新模块时的建议

- 在 `src/features/<module>` 下实现模块
- 在 `src/cli/mod.rs` 注册顶层命令
- 继续复用 `core` 中的错误和 JSON 输出封装
- 帮助文案保持中文且参数说明明确
- 如果新模块需要被 Agent 稳定调用，再扩展 `skills/atlas-cli` 的说明，而不是重新发散出另一套不一致的调用方式

## 常用开发命令

- `just help`
- `just fmt`
- `just check`
- `just clippy`
- `just test`
- `just verify`
- `just txns -- list --month 2026-03`
- `just txns-json -- analyze --start 2026-03-01 --end 2026-03-31`
- `just install`

其中 `just install` 会同时：

- 安装 `atlas` 二进制到 `~/.local/bin/atlas`
- 同步 `skills/atlas-cli` 到 `~/.codex/skills/atlas-cli`

## 提交前建议

如果改动涉及 Rust 代码，至少运行：

```bash
just clippy
cargo test
```

如果改动较大，优先运行：

```bash
just verify
```

## 提交信息规范

**格式：**
```
<类型>: <简短中文描述>
[可选的详细中文描述(内容较长时使用无序列表分点论述)]
```

**提交类型：**
- `feat`：新功能（feature）
- `fix`：修复 bug
- `docs`：文档/注释相关的修改
- `style`：代码格式修改（不影响代码逻辑），例如空格、缩进等
- `refactor`：代码重构（既不是新功能也不是修复 bug）
- `test`：添加或修改测试代码
- `chore`：构建过程或辅助工具的修改
