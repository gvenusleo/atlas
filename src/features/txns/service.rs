use serde_json::{Map, Value};

use crate::core::error::AtlasError;
use crate::infra::pocketbase::{PocketBaseClient, RecordsPage, RecordsQuery};

use super::analysis::{TxnAnalysisReport, analyze_records};
use super::model::AnalyzeTxnsQuery;
use super::model::{ListTxnsQuery, NewTxn, TxnPatch, TxnRecord};

const COLLECTION: &str = "txns";
const ANALYZE_PAGE_SIZE: u32 = 500;

pub struct TxnService<'a> {
    client: &'a PocketBaseClient,
}

impl<'a> TxnService<'a> {
    pub fn new(client: &'a PocketBaseClient) -> Self {
        Self { client }
    }

    pub async fn create(&self, txn: NewTxn) -> Result<TxnRecord, AtlasError> {
        let body = build_create_body(txn)?;
        self.client.create_record(COLLECTION, &body).await
    }

    pub async fn list(&self, query: &ListTxnsQuery) -> Result<RecordsPage<TxnRecord>, AtlasError> {
        let records_query = RecordsQuery {
            page: Some(query.page),
            per_page: Some(query.per_page),
            sort: Some("-occurred".to_owned()),
            filter: query.filter()?,
        };

        self.client.list_records(COLLECTION, &records_query).await
    }

    pub async fn get(&self, id: &str) -> Result<TxnRecord, AtlasError> {
        self.client.get_record(COLLECTION, id).await
    }

    pub async fn analyze(&self, query: &AnalyzeTxnsQuery) -> Result<TxnAnalysisReport, AtlasError> {
        let records = self.list_all_for_analysis(query).await?;
        Ok(analyze_records(
            &records,
            query.start.clone(),
            query.end.clone(),
        ))
    }

    pub async fn update(&self, id: &str, patch: TxnPatch) -> Result<TxnRecord, AtlasError> {
        let body = build_update_body(patch)?;
        self.client.update_record(COLLECTION, id, &body).await
    }

    pub async fn delete(&self, id: &str) -> Result<(), AtlasError> {
        self.client.delete_record(COLLECTION, id).await
    }

    async fn list_all_for_analysis(
        &self,
        query: &AnalyzeTxnsQuery,
    ) -> Result<Vec<TxnRecord>, AtlasError> {
        let mut page = 1;
        let mut records = Vec::new();

        loop {
            let records_query = RecordsQuery {
                page: Some(page),
                per_page: Some(ANALYZE_PAGE_SIZE),
                sort: Some("occurred".to_owned()),
                filter: Some(query.filter()),
            };
            let response = self.client.list_records(COLLECTION, &records_query).await?;
            let total_pages = response.total_pages;
            records.extend(response.items);

            if total_pages == 0 || page >= total_pages {
                break;
            }

            page += 1;
        }

        Ok(records)
    }
}

fn build_create_body(txn: NewTxn) -> Result<Value, AtlasError> {
    let mut body = Map::new();
    body.insert("occurred".to_owned(), Value::String(txn.occurred));
    body.insert(
        "kind".to_owned(),
        Value::String(txn.kind.as_str().to_owned()),
    );
    body.insert("amount".to_owned(), decimal_to_value(txn.amount)?);
    body.insert(
        "category".to_owned(),
        Value::String(txn.category.as_str().to_owned()),
    );
    if let Some(note) = txn.note {
        body.insert("note".to_owned(), Value::String(note));
    }

    Ok(Value::Object(body))
}

fn build_update_body(patch: TxnPatch) -> Result<Value, AtlasError> {
    let mut body = Map::new();

    if let Some(occurred) = patch.occurred {
        body.insert("occurred".to_owned(), Value::String(occurred));
    }

    if let Some(kind) = patch.kind {
        body.insert("kind".to_owned(), Value::String(kind.as_str().to_owned()));
    }

    if let Some(amount) = patch.amount {
        body.insert("amount".to_owned(), decimal_to_value(amount)?);
    }

    if let Some(category) = patch.category {
        body.insert(
            "category".to_owned(),
            Value::String(category.as_str().to_owned()),
        );
    }

    if let Some(note) = patch.note {
        body.insert("note".to_owned(), Value::String(note));
    }

    Ok(Value::Object(body))
}

fn decimal_to_value(amount: rust_decimal::Decimal) -> Result<Value, AtlasError> {
    serde_json::from_str(&amount.normalize().to_string())
        .map_err(|err| AtlasError::Validation(format!("金额序列化失败: {err}")))
}

#[cfg(test)]
mod tests {
    use rust_decimal::Decimal;
    use serde_json::json;

    use super::{build_create_body, build_update_body};
    use crate::features::txns::model::{NewTxn, TxnCategory, TxnKind, TxnPatch};

    #[test]
    fn create_body_contains_expected_json() {
        let body = build_create_body(NewTxn {
            occurred: "2026-03-29T12:30:00+08:00".to_owned(),
            kind: TxnKind::Expense,
            amount: Decimal::new(258, 1),
            category: TxnCategory::Food,
            note: Some("午饭".to_owned()),
        })
        .unwrap();

        assert_eq!(
            body,
            json!({
                "occurred": "2026-03-29T12:30:00+08:00",
                "kind": "支出",
                "amount": 25.8,
                "category": "餐饮",
                "note": "午饭",
            })
        );
    }

    #[test]
    fn update_body_only_includes_changed_fields() {
        let body = build_update_body(TxnPatch {
            amount: Some(Decimal::new(999, 1)),
            note: Some(String::new()),
            ..TxnPatch::default()
        })
        .unwrap();

        assert_eq!(
            body,
            json!({
                "amount": 99.9,
                "note": "",
            })
        );
    }
}
