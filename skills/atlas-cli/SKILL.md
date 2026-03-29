---
name: Atlas CLI
description: 在任意工作目录下调用已安装的 `atlas` 命令行工具，访问基于 PocketBase 的 Atlas 能力。当用户提出记账、记一笔、添加收入、添加支出、查询账目、查询流水、查看消费、查看收支、统计收入支出、分析分类占比、删除或修改记账记录等需求时应使用此 skill；当 Codex 需要登录 PocketBase、查看 Atlas 当前有哪些模块、调用某个模块命令，或从其他 skill/agent 中以稳定的 `--output json` 方式调用 Atlas 时，也应使用此 skill。把 `txns` 视为当前已实现模块，但不要假设它永远是唯一模块。
---

# Atlas CLI

## 快速开始

- 直接调用 `atlas`。假定可执行文件安装在 `~/.local/bin/atlas`，并且该目录已经加入 `PATH`。
- 面向 Agent 调用时优先使用 JSON 模式：

```bash
atlas --output json ...
```

- 如果 `atlas` 命令不可用，应明确说明已安装的二进制不存在，除非用户明确要求你基于源码工作。
- 如果 CLI 提示缺少本地配置或认证失效，先执行登录：

```bash
atlas --output json login --base-url <url> --email <email> --password <password>
```

## 模块发现

1. 当你需要确认 Atlas 当前有哪些顶层命令或模块时，先执行 `atlas --help`。
2. 当你需要确认某个模块支持哪些子命令和参数时，执行 `atlas <模块> --help`。
3. 优先通过 CLI 自身的帮助信息发现能力，而不是直接猜测参数。
4. 只有在任务明确涉及当前已实现的 `txns` 模块时，再读取 `references/txns.md`。

## 当前模块状态

- Atlas 被设计为一个可持续扩展的多模块 CLI。
- `txns` 是当前已实现模块。
- 后续可能新增更多模块，而不改变这个 skill 的基本使用方式。
- 当新增模块出现时，应通过 `atlas --help` 和 `atlas <模块> --help` 重新发现能力，而不是沿用旧假设。

## 工作流程

1. 除非用户明确要求人类可读输出，否则优先使用 `atlas --output json ...`。
2. 只调用能解决当前任务的最小命令。
3. 当命令退出码为 `0` 时，把 `stdout` 当成成功结果。
4. 当命令非零退出时，把 `stderr` 当成错误结果。
5. 需要确认能力边界时，优先使用模块帮助命令。

## 输出约定

- 成功结果统一使用：

```json
{
  "ok": true,
  "data": {}
}
```

- 错误结果统一使用：

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "..."
  }
}
```

- 常见错误码：
  - `missing_config`
  - `authentication_error`
  - `validation_error`
  - `time_parse_error`
  - `not_found`
  - `network_error`
  - `pocketbase_error`

## 备注

- 只有在用户明确需要面向人类展示时才使用文本输出。
- 只要 JSON 输出可以回答问题，就不要去解析帮助文本或自然语言终端输出。
- 保持模块无关视角。把 `txns` 当作当前示例模块，而不是 Atlas 的最终边界。
