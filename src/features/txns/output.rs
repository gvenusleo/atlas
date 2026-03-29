use rust_decimal::Decimal;
use serde::Serialize;

use crate::cli::OutputFormat;
use crate::core::output::print_json_success;
use crate::infra::pocketbase::RecordsPage;

use super::analysis::{CategoryBreakdown, TxnAnalysisReport};
use super::model::{TxnKind, TxnRecord, format_amount};

#[derive(Debug, Serialize)]
struct TxnSummary {
    income: Decimal,
    expense: Decimal,
    net: Decimal,
}

#[derive(Debug, Serialize)]
struct TxnListOutput<'a> {
    page: u32,
    per_page: u32,
    total_items: u32,
    total_pages: u32,
    items: &'a [TxnRecord],
    summary: TxnSummary,
}

#[derive(Debug, Serialize)]
struct DeleteOutput<'a> {
    id: &'a str,
    deleted: bool,
}

pub fn print_txn(record: &TxnRecord, output: OutputFormat) {
    if output == OutputFormat::Json {
        print_json_success(record);
        return;
    }

    println!("id: {}", record.id);
    println!("occurred: {}", record.occurred);
    println!("kind: {}", record.kind);
    println!("amount: {}", format_amount(record.amount));
    println!("category: {}", record.category);
    println!("created: {}", record.created);
    println!("updated: {}", record.updated);

    if let Some(note) = record.note.as_deref() {
        if !note.is_empty() {
            println!("note: {note}");
        }
    }
}

pub fn print_txn_page(page: &RecordsPage<TxnRecord>, output: OutputFormat) {
    let summary = summarize_page(page);

    if output == OutputFormat::Json {
        print_json_success(TxnListOutput {
            page: page.page,
            per_page: page.per_page,
            total_items: page.total_items,
            total_pages: page.total_pages,
            items: &page.items,
            summary,
        });
        return;
    }

    if page.items.is_empty() {
        println!("没有符合条件的记录。");
        println!("收入合计: 0.00");
        println!("支出合计: 0.00");
        println!("净额: 0.00");
        println!(
            "page: {}/{} | per_page: {} | total: {}",
            page.page, page.total_pages, page.per_page, page.total_items
        );
        return;
    }

    println!("id | occurred | kind | amount | category | note");
    for item in &page.items {
        let note = item.note.as_deref().unwrap_or("");
        println!(
            "{} | {} | {} | {} | {} | {}",
            item.id,
            item.occurred,
            item.kind,
            format_amount(item.amount),
            item.category,
            truncate(note, 24)
        );
    }

    println!("收入合计: {}", format_amount(summary.income));
    println!("支出合计: {}", format_amount(summary.expense));
    println!("净额: {}", format_amount(summary.net));
    println!(
        "page: {}/{} | per_page: {} | total: {}",
        page.page, page.total_pages, page.per_page, page.total_items
    );
}

pub fn print_analysis(report: &TxnAnalysisReport, output: OutputFormat) {
    if output == OutputFormat::Json {
        print_json_success(report);
        return;
    }

    println!("时间范围: {} ~ {}", report.start, report.end);
    println!("总收入: {}", format_amount(report.total_income));
    println!("总支出: {}", format_amount(report.total_expense));
    println!("净收入: {}", format_amount(report.net_income));
    println!();

    print_breakdown("支出分类分析", &report.expense_breakdown);
    println!();
    print_breakdown("收入分类分析", &report.income_breakdown);
}

pub fn print_delete(id: &str, output: OutputFormat) {
    if output == OutputFormat::Json {
        print_json_success(DeleteOutput { id, deleted: true });
        return;
    }

    println!("已删除记录 {id}");
}

fn sum_by_kind(items: &[TxnRecord], kind: TxnKind) -> Decimal {
    items
        .iter()
        .filter(|item| item.kind == kind)
        .fold(Decimal::ZERO, |acc, item| acc + item.amount)
}

fn truncate(value: &str, limit: usize) -> String {
    let total = value.chars().count();
    if total <= limit {
        return value.to_owned();
    }

    let mut truncated = value
        .chars()
        .take(limit.saturating_sub(3))
        .collect::<String>();
    truncated.push_str("...");
    truncated
}

fn print_breakdown(title: &str, items: &[CategoryBreakdown]) {
    println!("{title}");
    if items.is_empty() {
        println!("无记录。");
        return;
    }

    println!("分类 | 金额 | 占比");
    for item in items {
        println!(
            "{} | {} | {}%",
            item.category,
            format_amount(item.amount),
            format_amount(item.ratio)
        );
    }
}

fn summarize_page(page: &RecordsPage<TxnRecord>) -> TxnSummary {
    let income = sum_by_kind(&page.items, TxnKind::Income);
    let expense = sum_by_kind(&page.items, TxnKind::Expense);

    TxnSummary {
        income,
        expense,
        net: income - expense,
    }
}
