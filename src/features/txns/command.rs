use clap::{Args, Subcommand};

use crate::cli::OutputFormat;
use crate::core::error::AtlasError;
use crate::infra::config::ConfigStore;
use crate::infra::pocketbase::PocketBaseClient;

use super::model::{
    AnalyzeTxnsQuery, ListTxnsQuery, NewTxn, TxnCategory, TxnKind, TxnPatch, YearMonth,
    current_occurred, normalize_analyze_end, normalize_analyze_start, normalize_occurred,
    parse_positive_amount, validate_kind_and_category,
};
use super::output::{print_analysis, print_delete, print_txn, print_txn_page};
use super::service::TxnService;

#[derive(Debug, Args)]
#[command(about = "记账数据的增删改查与统计分析")]
pub struct TxnsArgs {
    #[command(subcommand)]
    pub command: TxnCommand,
}

#[derive(Debug, Subcommand)]
pub enum TxnCommand {
    #[command(about = "新增一笔记账记录")]
    Add(AddTxnArgs),
    #[command(about = "按条件列出记账记录并显示当前页汇总")]
    List(ListTxnsArgs),
    #[command(about = "分析指定时间范围内的收支与分类占比")]
    Analyze(AnalyzeTxnsArgs),
    #[command(about = "查看单条记账记录详情")]
    Get(GetTxnArgs),
    #[command(about = "更新一笔已有记账记录")]
    Update(UpdateTxnArgs),
    #[command(about = "删除一笔记账记录")]
    Delete(DeleteTxnArgs),
}

#[derive(Debug, Args)]
#[command(about = "新增一笔记账记录")]
pub struct AddTxnArgs {
    #[arg(
        long,
        value_enum,
        help = "收支类型",
        long_help = "收支类型，可选值为“收入”或“支出”。"
    )]
    pub kind: TxnKind,
    #[arg(
        long,
        help = "金额",
        long_help = "金额，单位为元，必须大于 0，最多保留两位小数，例如 25.80。"
    )]
    pub amount: String,
    #[arg(
        long,
        value_enum,
        help = "分类",
        long_help = "交易分类，使用中文枚举值。CLI 会校验分类是否与收支类型匹配。"
    )]
    pub category: TxnCategory,
    #[arg(
        long,
        help = "备注",
        long_help = "备注信息，例如“午饭”“3 月工资”。可省略。"
    )]
    pub note: Option<String>,
    #[arg(
        long,
        help = "发生时间",
        long_help = "记录发生时间。支持 RFC3339、`YYYY-MM-DD HH:MM:SS`、`YYYY-MM-DD`。省略时默认使用当前本地时间。"
    )]
    pub occurred: Option<String>,
}

#[derive(Debug, Args)]
#[command(about = "按条件列出记账记录并显示当前页汇总")]
pub struct ListTxnsArgs {
    #[arg(
        long,
        help = "月份筛选",
        long_help = "按月份筛选，格式为 YYYY-MM，例如 2026-03。"
    )]
    pub month: Option<YearMonth>,
    #[arg(
        long,
        value_enum,
        help = "收支类型筛选",
        long_help = "按收支类型筛选，可选值为“收入”或“支出”。"
    )]
    pub kind: Option<TxnKind>,
    #[arg(
        long,
        value_enum,
        help = "分类筛选",
        long_help = "按分类筛选，使用中文枚举值；如果同时传入 --kind，会校验分类是否与收支类型匹配。"
    )]
    pub category: Option<TxnCategory>,
    #[arg(
        long,
        default_value_t = 20,
        help = "每页条数",
        long_help = "每页返回的记录数，必须大于 0，默认 20。"
    )]
    pub limit: u32,
    #[arg(
        long,
        default_value_t = 1,
        help = "页码",
        long_help = "分页页码，必须大于 0，默认 1。"
    )]
    pub page: u32,
}

#[derive(Debug, Args)]
#[command(about = "分析指定时间范围内的收支与分类占比")]
pub struct AnalyzeTxnsArgs {
    #[arg(
        long,
        help = "分析开始时间",
        long_help = "分析开始时间。支持 RFC3339、`YYYY-MM-DD HH:MM:SS`、`YYYY-MM-DD`。如果只传日期，会自动扩展为当天 00:00:00。"
    )]
    pub start: String,
    #[arg(
        long,
        help = "分析结束时间",
        long_help = "分析结束时间。支持 RFC3339、`YYYY-MM-DD HH:MM:SS`、`YYYY-MM-DD`。如果只传日期，会自动扩展为当天 23:59:59。"
    )]
    pub end: String,
}

#[derive(Debug, Args)]
#[command(about = "查看单条记账记录详情")]
pub struct GetTxnArgs {
    #[arg(help = "记录 ID", long_help = "要查询的 PocketBase record ID。")]
    pub id: String,
}

#[derive(Debug, Args)]
#[command(about = "更新一笔已有记账记录")]
pub struct UpdateTxnArgs {
    #[arg(help = "记录 ID", long_help = "要更新的 PocketBase record ID。")]
    pub id: String,
    #[arg(
        long,
        value_enum,
        help = "新的收支类型",
        long_help = "新的收支类型，可选值为“收入”或“支出”。"
    )]
    pub kind: Option<TxnKind>,
    #[arg(
        long,
        help = "新的金额",
        long_help = "新的金额，单位为元，必须大于 0，最多保留两位小数，例如 25.80。"
    )]
    pub amount: Option<String>,
    #[arg(
        long,
        value_enum,
        help = "新的分类",
        long_help = "新的交易分类，使用中文枚举值。CLI 会结合现有或新的收支类型做匹配校验。"
    )]
    pub category: Option<TxnCategory>,
    #[arg(
        long,
        help = "新的备注",
        long_help = "新的备注内容。传入空字符串可将备注更新为空。"
    )]
    pub note: Option<String>,
    #[arg(
        long,
        help = "新的发生时间",
        long_help = "新的发生时间。支持 RFC3339、`YYYY-MM-DD HH:MM:SS`、`YYYY-MM-DD`。"
    )]
    pub occurred: Option<String>,
}

#[derive(Debug, Args)]
#[command(about = "删除一笔记账记录")]
pub struct DeleteTxnArgs {
    #[arg(help = "记录 ID", long_help = "要删除的 PocketBase record ID。")]
    pub id: String,
}

pub async fn handle_txns(args: TxnsArgs, output: OutputFormat) -> Result<(), AtlasError> {
    let store = ConfigStore::default();
    let config = store.load()?;
    let client = PocketBaseClient::new(config.base_url, Some(config.token))?;
    let service = TxnService::new(&client);

    match args.command {
        TxnCommand::Add(args) => handle_add(&service, args, output).await,
        TxnCommand::List(args) => handle_list(&service, args, output).await,
        TxnCommand::Analyze(args) => handle_analyze(&service, args, output).await,
        TxnCommand::Get(args) => handle_get(&service, args, output).await,
        TxnCommand::Update(args) => handle_update(&service, args, output).await,
        TxnCommand::Delete(args) => handle_delete(&service, args, output).await,
    }
}

async fn handle_add(
    service: &TxnService<'_>,
    args: AddTxnArgs,
    output: OutputFormat,
) -> Result<(), AtlasError> {
    let amount = parse_positive_amount(&args.amount)?;
    validate_kind_and_category(args.kind, args.category)?;

    let occurred = match args.occurred.as_deref() {
        Some(raw) => normalize_occurred(raw)?,
        None => current_occurred(),
    };

    let txn = NewTxn {
        occurred,
        kind: args.kind,
        amount,
        category: args.category,
        note: normalize_new_note(args.note),
    };

    let record = service.create(txn).await?;
    print_txn(&record, output);
    Ok(())
}

async fn handle_list(
    service: &TxnService<'_>,
    args: ListTxnsArgs,
    output: OutputFormat,
) -> Result<(), AtlasError> {
    if args.page == 0 {
        return Err(AtlasError::Validation("--page 必须大于 0".to_owned()));
    }

    if args.limit == 0 {
        return Err(AtlasError::Validation("--limit 必须大于 0".to_owned()));
    }

    if let (Some(kind), Some(category)) = (args.kind, args.category) {
        validate_kind_and_category(kind, category)?;
    }

    let query = ListTxnsQuery {
        page: args.page,
        per_page: args.limit,
        month: args.month,
        kind: args.kind,
        category: args.category,
    };

    let page = service.list(&query).await?;
    print_txn_page(&page, output);
    Ok(())
}

async fn handle_analyze(
    service: &TxnService<'_>,
    args: AnalyzeTxnsArgs,
    output: OutputFormat,
) -> Result<(), AtlasError> {
    let query = AnalyzeTxnsQuery::new(
        normalize_analyze_start(&args.start)?,
        normalize_analyze_end(&args.end)?,
    )?;

    let report = service.analyze(&query).await?;
    print_analysis(&report, output);
    Ok(())
}

async fn handle_get(
    service: &TxnService<'_>,
    args: GetTxnArgs,
    output: OutputFormat,
) -> Result<(), AtlasError> {
    let record = service.get(&args.id).await?;
    print_txn(&record, output);
    Ok(())
}

async fn handle_update(
    service: &TxnService<'_>,
    args: UpdateTxnArgs,
    output: OutputFormat,
) -> Result<(), AtlasError> {
    if args.kind.is_none()
        && args.amount.is_none()
        && args.category.is_none()
        && args.note.is_none()
        && args.occurred.is_none()
    {
        return Err(AtlasError::Validation(
            "请至少提供一个需要更新的字段".to_owned(),
        ));
    }

    let amount = args
        .amount
        .as_deref()
        .map(parse_positive_amount)
        .transpose()?;
    let occurred = args
        .occurred
        .as_deref()
        .map(normalize_occurred)
        .transpose()?;

    if args.kind.is_some() || args.category.is_some() {
        let current = service.get(&args.id).await?;
        let effective_kind = args.kind.unwrap_or(current.kind);
        let effective_category = args.category.unwrap_or(current.category);
        validate_kind_and_category(effective_kind, effective_category)?;
    }

    let patch = TxnPatch {
        occurred,
        kind: args.kind,
        amount,
        category: args.category,
        note: args.note,
    };

    let record = service.update(&args.id, patch).await?;
    print_txn(&record, output);
    Ok(())
}

async fn handle_delete(
    service: &TxnService<'_>,
    args: DeleteTxnArgs,
    output: OutputFormat,
) -> Result<(), AtlasError> {
    service.delete(&args.id).await?;
    print_delete(&args.id, output);
    Ok(())
}

fn normalize_new_note(note: Option<String>) -> Option<String> {
    note.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_owned())
        }
    })
}
