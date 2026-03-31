use std::fmt;
use std::str::FromStr;

use chrono::{
    FixedOffset, Local, LocalResult, NaiveDate, NaiveDateTime, Offset, SecondsFormat, TimeZone, Utc,
};
use clap::ValueEnum;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::core::error::AtlasError;

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, Deserialize, ValueEnum)]
pub enum TxnKind {
    #[serde(rename = "收入")]
    #[value(name = "收入")]
    Income,
    #[serde(rename = "支出")]
    #[value(name = "支出")]
    Expense,
}

impl TxnKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Income => "收入",
            Self::Expense => "支出",
        }
    }
}

impl fmt::Display for TxnKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(
    Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, serde::Serialize, Deserialize, ValueEnum,
)]
pub enum TxnCategory {
    #[serde(rename = "餐饮")]
    #[value(name = "餐饮")]
    Food,
    #[serde(rename = "交通")]
    #[value(name = "交通")]
    Transport,
    #[serde(rename = "住房")]
    #[value(name = "住房")]
    Housing,
    #[serde(rename = "购物")]
    #[value(name = "购物")]
    Shopping,
    #[serde(rename = "日用")]
    #[value(name = "日用")]
    DailyUse,
    #[serde(rename = "娱乐")]
    #[value(name = "娱乐")]
    Entertainment,
    #[serde(rename = "医疗")]
    #[value(name = "医疗")]
    Medical,
    #[serde(rename = "学习")]
    #[value(name = "学习")]
    Learning,
    #[serde(rename = "通讯")]
    #[value(name = "通讯")]
    Communication,
    #[serde(rename = "人情")]
    #[value(name = "人情")]
    Social,
    #[serde(rename = "旅行")]
    #[value(name = "旅行")]
    Travel,
    #[serde(rename = "工资")]
    #[value(name = "工资")]
    Salary,
    #[serde(rename = "奖金")]
    #[value(name = "奖金")]
    Bonus,
    #[serde(rename = "报销")]
    #[value(name = "报销")]
    Reimbursement,
    #[serde(rename = "退款")]
    #[value(name = "退款")]
    Refund,
    #[serde(rename = "副业")]
    #[value(name = "副业")]
    SideHustle,
    #[serde(rename = "其他")]
    #[value(name = "其他")]
    Other,
}

impl TxnCategory {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Food => "餐饮",
            Self::Transport => "交通",
            Self::Housing => "住房",
            Self::Shopping => "购物",
            Self::DailyUse => "日用",
            Self::Entertainment => "娱乐",
            Self::Medical => "医疗",
            Self::Learning => "学习",
            Self::Communication => "通讯",
            Self::Social => "人情",
            Self::Travel => "旅行",
            Self::Salary => "工资",
            Self::Bonus => "奖金",
            Self::Reimbursement => "报销",
            Self::Refund => "退款",
            Self::SideHustle => "副业",
            Self::Other => "其他",
        }
    }

    pub fn allowed_for_kind(self, kind: TxnKind) -> bool {
        match kind {
            TxnKind::Expense => matches!(
                self,
                Self::Food
                    | Self::Transport
                    | Self::Housing
                    | Self::Shopping
                    | Self::DailyUse
                    | Self::Entertainment
                    | Self::Medical
                    | Self::Learning
                    | Self::Communication
                    | Self::Social
                    | Self::Travel
                    | Self::Other
            ),
            TxnKind::Income => matches!(
                self,
                Self::Salary
                    | Self::Bonus
                    | Self::Reimbursement
                    | Self::Refund
                    | Self::SideHustle
                    | Self::Other
            ),
        }
    }
}

impl fmt::Display for TxnCategory {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TxnRecord {
    pub id: String,
    pub occurred: String,
    pub kind: TxnKind,
    #[serde(with = "rust_decimal::serde::arbitrary_precision")]
    pub amount: Decimal,
    pub category: TxnCategory,
    #[serde(default)]
    pub note: Option<String>,
    pub created: String,
    pub updated: String,
}

#[derive(Debug, Clone)]
pub struct NewTxn {
    pub occurred: String,
    pub kind: TxnKind,
    pub amount: Decimal,
    pub category: TxnCategory,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct TxnPatch {
    pub occurred: Option<String>,
    pub kind: Option<TxnKind>,
    pub amount: Option<Decimal>,
    pub category: Option<TxnCategory>,
    pub note: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ListTxnsQuery {
    pub page: u32,
    pub per_page: u32,
    pub month: Option<YearMonth>,
    pub kind: Option<TxnKind>,
    pub category: Option<TxnCategory>,
}

impl ListTxnsQuery {
    pub fn filter(&self) -> Result<Option<String>, AtlasError> {
        let mut clauses = Vec::new();

        if let Some(month) = self.month {
            let (start, end) = month.bounds()?;
            clauses.push(format!("occurred >= {}", quote_filter_value(&start)));
            clauses.push(format!("occurred < {}", quote_filter_value(&end)));
        }

        if let Some(kind) = self.kind {
            clauses.push(format!("kind = {}", quote_filter_value(kind.as_str())));
        }

        if let Some(category) = self.category {
            clauses.push(format!(
                "category = {}",
                quote_filter_value(category.as_str())
            ));
        }

        if clauses.is_empty() {
            Ok(None)
        } else {
            Ok(Some(clauses.join(" && ")))
        }
    }
}

#[derive(Debug, Clone)]
pub struct AnalyzeTxnsQuery {
    pub start: String,
    pub end: String,
}

impl AnalyzeTxnsQuery {
    pub fn new(start: String, end: String) -> Result<Self, AtlasError> {
        let start_value = parse_datetime(&start)?;
        let end_value = parse_datetime(&end)?;

        if end_value < start_value {
            return Err(AtlasError::Validation(
                "分析结束时间不能早于开始时间".to_owned(),
            ));
        }

        Ok(Self { start, end })
    }

    pub fn filter(&self) -> String {
        format!(
            "occurred >= {} && occurred <= {}",
            quote_filter_value(&self.start),
            quote_filter_value(&self.end)
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct YearMonth {
    year: i32,
    month: u32,
}

impl YearMonth {
    pub fn bounds(self) -> Result<(String, String), AtlasError> {
        let offset = Local::now().offset().fix();
        let start = build_offset_datetime(offset, self.year, self.month, 1, 0, 0, 0)?;

        let (next_year, next_month) = if self.month == 12 {
            (self.year + 1, 1)
        } else {
            (self.year, self.month + 1)
        };
        let end = build_offset_datetime(offset, next_year, next_month, 1, 0, 0, 0)?;

        Ok((
            format_pocketbase_datetime_utc(start),
            format_pocketbase_datetime_utc(end),
        ))
    }
}

impl FromStr for YearMonth {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        let (year, month) = value
            .split_once('-')
            .ok_or_else(|| "必须使用 YYYY-MM 格式".to_owned())?;

        let year = year.parse::<i32>().map_err(|_| "年份格式无效".to_owned())?;
        let month = month
            .parse::<u32>()
            .map_err(|_| "月份格式无效".to_owned())?;

        if !(1..=12).contains(&month) {
            return Err("月份必须在 01 到 12 之间".to_owned());
        }

        Ok(Self { year, month })
    }
}

pub fn validate_kind_and_category(kind: TxnKind, category: TxnCategory) -> Result<(), AtlasError> {
    if category.allowed_for_kind(kind) {
        return Ok(());
    }

    Err(AtlasError::Validation(format!(
        "`{kind}` 不能使用分类 `{category}`"
    )))
}

pub fn parse_positive_amount(raw: &str) -> Result<Decimal, AtlasError> {
    let amount = Decimal::from_str(raw)
        .map_err(|_| AtlasError::Validation("金额必须是合法数字".to_owned()))?;

    if amount <= Decimal::ZERO {
        return Err(AtlasError::Validation("金额必须大于 0".to_owned()));
    }

    if amount.scale() > 2 {
        return Err(AtlasError::Validation(
            "金额最多只能保留两位小数".to_owned(),
        ));
    }

    Ok(amount)
}

pub fn normalize_occurred(raw: &str) -> Result<String, AtlasError> {
    normalize_pocketbase_datetime(raw)
}

pub fn normalize_analyze_start(raw: &str) -> Result<String, AtlasError> {
    normalize_day_boundary(raw, 0, 0, 0, 0)
}

pub fn normalize_analyze_end(raw: &str) -> Result<String, AtlasError> {
    normalize_day_boundary(raw, 23, 59, 59, 999)
}

pub fn current_occurred() -> String {
    format_pocketbase_datetime_utc(Local::now().fixed_offset())
}

pub fn format_amount(amount: Decimal) -> String {
    format!("{:.2}", amount.round_dp(2))
}

fn parse_datetime(raw: &str) -> Result<chrono::DateTime<FixedOffset>, AtlasError> {
    if let Ok(value) = chrono::DateTime::parse_from_rfc3339(raw) {
        return Ok(value);
    }

    if let Some(candidate) = raw
        .strip_suffix('Z')
        .map(|value| format!("{}Z", value.replacen(' ', "T", 1)))
        && let Ok(value) = chrono::DateTime::parse_from_rfc3339(&candidate)
    {
        return Ok(value);
    }

    if let Ok(value) = NaiveDateTime::parse_from_str(raw, "%Y-%m-%d %H:%M:%S") {
        return localize_naive(value);
    }

    if let Ok(value) = NaiveDate::parse_from_str(raw, "%Y-%m-%d") {
        let naive = value
            .and_hms_opt(0, 0, 0)
            .ok_or_else(|| AtlasError::TimeParse("无法将日期转换为本地时间".to_owned()))?;
        return localize_naive(naive);
    }

    Err(AtlasError::TimeParse(
        "请使用 RFC3339、`YYYY-MM-DD HH:MM:SS` 或 `YYYY-MM-DD`".to_owned(),
    ))
}

fn localize_naive(value: NaiveDateTime) -> Result<chrono::DateTime<FixedOffset>, AtlasError> {
    match Local.from_local_datetime(&value) {
        LocalResult::Single(datetime) => Ok(datetime.fixed_offset()),
        _ => Err(AtlasError::TimeParse("本地时区无法解析这个时间".to_owned())),
    }
}

fn build_offset_datetime(
    offset: FixedOffset,
    year: i32,
    month: u32,
    day: u32,
    hour: u32,
    minute: u32,
    second: u32,
) -> Result<chrono::DateTime<FixedOffset>, AtlasError> {
    offset
        .with_ymd_and_hms(year, month, day, hour, minute, second)
        .single()
        .ok_or_else(|| AtlasError::TimeParse("无法构造月份筛选时间范围".to_owned()))
}

fn normalize_pocketbase_datetime(raw: &str) -> Result<String, AtlasError> {
    parse_datetime(raw).map(format_pocketbase_datetime_utc)
}

fn normalize_day_boundary(
    raw: &str,
    hour: u32,
    minute: u32,
    second: u32,
    millisecond: u32,
) -> Result<String, AtlasError> {
    if let Ok(date) = NaiveDate::parse_from_str(raw, "%Y-%m-%d") {
        let naive = date
            .and_hms_milli_opt(hour, minute, second, millisecond)
            .ok_or_else(|| AtlasError::TimeParse("无法将日期转换为本地时间".to_owned()))?;
        return localize_naive(naive).map(format_pocketbase_datetime_utc);
    }

    normalize_pocketbase_datetime(raw)
}

fn format_pocketbase_datetime_utc(value: chrono::DateTime<FixedOffset>) -> String {
    value
        .with_timezone(&Utc)
        .to_rfc3339_opts(SecondsFormat::Millis, true)
        .replace('T', " ")
}

fn quote_filter_value(value: &str) -> String {
    let escaped = value.replace('\\', "\\\\").replace('"', "\\\"");
    format!("\"{escaped}\"")
}

#[cfg(test)]
mod tests {
    use chrono::{NaiveDate, NaiveDateTime};

    use super::{
        AnalyzeTxnsQuery, ListTxnsQuery, TxnCategory, TxnKind, YearMonth,
        format_pocketbase_datetime_utc, localize_naive, normalize_analyze_end,
        normalize_analyze_start, normalize_occurred, parse_positive_amount,
        validate_kind_and_category,
    };

    #[test]
    fn validates_income_category_pairs() {
        assert!(validate_kind_and_category(TxnKind::Income, TxnCategory::Salary).is_ok());
        assert!(validate_kind_and_category(TxnKind::Expense, TxnCategory::Salary).is_err());
    }

    #[test]
    fn parses_positive_amount_with_two_decimals() {
        assert!(parse_positive_amount("25.80").is_ok());
        assert!(parse_positive_amount("0").is_err());
        assert!(parse_positive_amount("25.801").is_err());
    }

    #[test]
    fn normalizes_date_only_input() {
        let occurred = normalize_occurred("2026-03-29").unwrap();
        assert_eq!(occurred, expected_local_datetime(2026, 3, 29, 0, 0, 0, 0));
    }

    #[test]
    fn parses_month_and_builds_filter() {
        let month: YearMonth = "2026-03".parse().unwrap();
        let query = ListTxnsQuery {
            page: 1,
            per_page: 20,
            month: Some(month),
            kind: Some(TxnKind::Expense),
            category: Some(TxnCategory::Food),
        };

        let filter = query.filter().unwrap().unwrap();

        assert!(filter.contains(&format!(
            "occurred >= \"{}\"",
            expected_local_datetime(2026, 3, 1, 0, 0, 0, 0)
        )));
        assert!(filter.contains(&format!(
            "occurred < \"{}\"",
            expected_local_datetime(2026, 4, 1, 0, 0, 0, 0)
        )));
        assert!(filter.contains("kind = \"支出\""));
        assert!(filter.contains("category = \"餐饮\""));
    }

    #[test]
    fn normalize_analyze_start_converts_date_only_to_utc_pocketbase_format() {
        let occurred = normalize_analyze_start("2026-03-30").unwrap();
        assert_eq!(occurred, expected_local_datetime(2026, 3, 30, 0, 0, 0, 0));
    }

    #[test]
    fn normalize_analyze_end_expands_date_only_to_day_end() {
        let occurred = normalize_analyze_end("2026-03-30").unwrap();
        assert_eq!(
            occurred,
            expected_local_datetime(2026, 3, 30, 23, 59, 59, 999)
        );
    }

    #[test]
    fn normalize_analyze_datetime_input_to_utc_pocketbase_format() {
        let expected = expected_local_datetime(2026, 3, 30, 0, 0, 0, 0);
        let occurred = normalize_analyze_start("2026-03-30T00:00:00+08:00").unwrap();
        assert_eq!(occurred, expected);
    }

    #[test]
    fn analyze_query_requires_end_not_before_start() {
        let result = AnalyzeTxnsQuery::new(
            "2026-03-29T10:00:00+08:00".to_owned(),
            "2026-03-28T10:00:00+08:00".to_owned(),
        );

        assert!(result.is_err());
    }

    #[test]
    fn analyze_query_accepts_pocketbase_datetime_format() {
        let result = AnalyzeTxnsQuery::new(
            normalize_analyze_start("2026-03-30").unwrap(),
            normalize_analyze_end("2026-03-30").unwrap(),
        );

        assert!(result.is_ok());
    }

    fn expected_local_datetime(
        year: i32,
        month: u32,
        day: u32,
        hour: u32,
        minute: u32,
        second: u32,
        millisecond: u32,
    ) -> String {
        let naive = build_naive_datetime(year, month, day, hour, minute, second, millisecond);
        let localized = localize_naive(naive).unwrap();
        format_pocketbase_datetime_utc(localized)
    }

    fn build_naive_datetime(
        year: i32,
        month: u32,
        day: u32,
        hour: u32,
        minute: u32,
        second: u32,
        millisecond: u32,
    ) -> NaiveDateTime {
        let date = NaiveDate::from_ymd_opt(year, month, day).unwrap();
        date.and_hms_milli_opt(hour, minute, second, millisecond)
            .unwrap()
    }
}
