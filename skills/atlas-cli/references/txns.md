# Txns 模块参考

## 支持的分类

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

## 业务规则

- `kind` 只能是 `收入` 或 `支出`。
- `amount` 以元为单位，必须大于 `0`，最多保留两位小数。
- `occurred`、`--start`、`--end` 支持以下格式：
  - RFC3339
  - `YYYY-MM-DD HH:MM:SS`
  - `YYYY-MM-DD`
- 对 `txns analyze`：
  - 只传日期的 `--start` 会扩展为当天 `00:00:00`
  - 只传日期的 `--end` 会扩展为当天 `23:59:59`
- 分类和收支类型存在联动校验：
  - `支出` 允许：`餐饮/交通/住房/购物/日用/娱乐/医疗/学习/通讯/人情/旅行/其他`
  - `收入` 允许：`工资/奖金/报销/退款/副业/其他`

## 推荐调用方式

自动化调用优先使用 JSON 模式：

```bash
atlas --output json txns ...
```

默认假设 `atlas` 已经在 `PATH` 中，所以当前工作目录不重要。

## 命令示例

新增一条记录：

```bash
atlas --output json txns add \
  --kind 支出 \
  --amount 25.80 \
  --category 餐饮 \
  --note 午饭
```

按月份查询：

```bash
atlas --output json txns list --month 2026-03
```

按收支类型和分类筛选：

```bash
atlas --output json txns list --kind 支出 --category 餐饮
```

查看单条记录：

```bash
atlas --output json txns get <record-id>
```

更新单条记录：

```bash
atlas --output json txns update <record-id> --amount 30.00 --note 晚饭
```

删除单条记录：

```bash
atlas --output json txns delete <record-id>
```

分析时间范围：

```bash
atlas --output json txns analyze --start 2026-03-01 --end 2026-03-31
```

## JSON 返回结构

单条记录类命令返回：

```json
{
  "ok": true,
  "data": {
    "id": "record-id",
    "occurred": "2026-03-29T12:30:00+08:00",
    "kind": "支出",
    "amount": 25.8,
    "category": "餐饮",
    "note": "午饭",
    "created": "2026-03-29T12:31:00+08:00",
    "updated": "2026-03-29T12:31:00+08:00"
  }
}
```

`txns list` 返回：

```json
{
  "ok": true,
  "data": {
    "page": 1,
    "per_page": 20,
    "total_items": 1,
    "total_pages": 1,
    "items": [],
    "summary": {
      "income": 0,
      "expense": 25.8,
      "net": -25.8
    }
  }
}
```

`txns analyze` 返回：

```json
{
  "ok": true,
  "data": {
    "start": "2026-03-01T00:00:00+08:00",
    "end": "2026-03-31T23:59:59+08:00",
    "total_income": 10000.0,
    "total_expense": 3500.0,
    "net_income": 6500.0,
    "expense_breakdown": [],
    "income_breakdown": []
  }
}
```

错误返回：

```json
{
  "ok": false,
  "error": {
    "code": "missing_config",
    "message": "..."
  }
}
```
