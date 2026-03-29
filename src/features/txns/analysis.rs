use std::collections::BTreeMap;

use rust_decimal::Decimal;

use super::model::{TxnCategory, TxnKind, TxnRecord};

#[derive(Debug, Clone, serde::Serialize)]
pub struct CategoryBreakdown {
    pub category: TxnCategory,
    pub amount: Decimal,
    pub ratio: Decimal,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TxnAnalysisReport {
    pub start: String,
    pub end: String,
    pub total_income: Decimal,
    pub total_expense: Decimal,
    pub net_income: Decimal,
    pub expense_breakdown: Vec<CategoryBreakdown>,
    pub income_breakdown: Vec<CategoryBreakdown>,
}

pub fn analyze_records(records: &[TxnRecord], start: String, end: String) -> TxnAnalysisReport {
    let total_income = sum_by_kind(records, TxnKind::Income);
    let total_expense = sum_by_kind(records, TxnKind::Expense);
    let net_income = total_income - total_expense;
    let expense_breakdown = build_breakdown(records, TxnKind::Expense, total_expense);
    let income_breakdown = build_breakdown(records, TxnKind::Income, total_income);

    TxnAnalysisReport {
        start,
        end,
        total_income,
        total_expense,
        net_income,
        expense_breakdown,
        income_breakdown,
    }
}

fn sum_by_kind(records: &[TxnRecord], kind: TxnKind) -> Decimal {
    records
        .iter()
        .filter(|record| record.kind == kind)
        .fold(Decimal::ZERO, |acc, record| acc + record.amount)
}

fn build_breakdown(records: &[TxnRecord], kind: TxnKind, total: Decimal) -> Vec<CategoryBreakdown> {
    let mut grouped = BTreeMap::new();

    for record in records.iter().filter(|record| record.kind == kind) {
        grouped
            .entry(record.category)
            .and_modify(|amount| *amount += record.amount)
            .or_insert(record.amount);
    }

    let mut breakdown = grouped
        .into_iter()
        .map(|(category, amount)| CategoryBreakdown {
            category,
            amount,
            ratio: percentage(amount, total),
        })
        .collect::<Vec<_>>();

    breakdown.sort_by(|left, right| {
        right
            .amount
            .cmp(&left.amount)
            .then_with(|| left.category.as_str().cmp(right.category.as_str()))
    });

    breakdown
}

fn percentage(amount: Decimal, total: Decimal) -> Decimal {
    if total.is_zero() {
        Decimal::ZERO
    } else {
        (amount / total * Decimal::from(100)).round_dp(2)
    }
}

#[cfg(test)]
mod tests {
    use rust_decimal::Decimal;

    use super::analyze_records;
    use crate::features::txns::model::{TxnCategory, TxnKind, TxnRecord};

    #[test]
    fn aggregates_totals_and_category_ratios() {
        let records = vec![
            record(TxnKind::Expense, Decimal::new(3000, 2), TxnCategory::Food),
            record(
                TxnKind::Expense,
                Decimal::new(1000, 2),
                TxnCategory::Transport,
            ),
            record(TxnKind::Expense, Decimal::new(2000, 2), TxnCategory::Food),
            record(
                TxnKind::Income,
                Decimal::new(900000, 2),
                TxnCategory::Salary,
            ),
            record(TxnKind::Income, Decimal::new(100000, 2), TxnCategory::Bonus),
        ];

        let report = analyze_records(
            &records,
            "2026-03-01T00:00:00+08:00".to_owned(),
            "2026-03-31T23:59:59+08:00".to_owned(),
        );

        assert_eq!(report.total_expense, Decimal::new(6000, 2));
        assert_eq!(report.total_income, Decimal::new(1000000, 2));
        assert_eq!(report.net_income, Decimal::new(994000, 2));
        assert_eq!(report.expense_breakdown.len(), 2);
        assert_eq!(report.expense_breakdown[0].category, TxnCategory::Food);
        assert_eq!(report.expense_breakdown[0].amount, Decimal::new(5000, 2));
        assert_eq!(report.expense_breakdown[0].ratio, Decimal::new(8333, 2));
        assert_eq!(report.income_breakdown[0].category, TxnCategory::Salary);
        assert_eq!(report.income_breakdown[0].ratio, Decimal::new(9000, 2));
    }

    fn record(kind: TxnKind, amount: Decimal, category: TxnCategory) -> TxnRecord {
        TxnRecord {
            id: "txn".to_owned(),
            occurred: "2026-03-29T12:30:00+08:00".to_owned(),
            kind,
            amount,
            category,
            note: None,
            created: "2026-03-29T12:31:00+08:00".to_owned(),
            updated: "2026-03-29T12:31:00+08:00".to_owned(),
        }
    }
}
