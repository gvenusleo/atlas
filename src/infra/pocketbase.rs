use std::collections::HashMap;
use std::time::Duration;

use crate::core::error::AtlasError;
use reqwest::header::AUTHORIZATION;
use reqwest::{Method, RequestBuilder, Url};
use serde::Serialize;
use serde::de::DeserializeOwned;

#[derive(Debug, Clone)]
pub struct PocketBaseClient {
    base_url: String,
    http: reqwest::Client,
    token: Option<String>,
}

impl PocketBaseClient {
    pub fn new(base_url: impl Into<String>, token: Option<String>) -> Result<Self, AtlasError> {
        let base_url = normalize_base_url(base_url.into());
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .map_err(|err| AtlasError::Network {
                base_url: base_url.clone(),
                message: err.to_string(),
            })?;

        Ok(Self {
            base_url,
            http,
            token,
        })
    }

    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    pub async fn login_superuser(&self, email: &str, password: &str) -> Result<String, AtlasError> {
        let request = self
            .request(
                Method::POST,
                "/api/collections/_superusers/auth-with-password",
            )?
            .json(&serde_json::json!({
                "identity": email,
                "password": password,
            }));

        let response: AuthResponse = self.send(request).await?;
        Ok(response.token)
    }

    pub async fn create_record<T, B>(&self, collection: &str, body: &B) -> Result<T, AtlasError>
    where
        T: DeserializeOwned,
        B: Serialize + ?Sized,
    {
        let path = records_path(collection);
        let request = self.request(Method::POST, &path)?.json(body);
        self.send(request).await
    }

    pub async fn list_records<T>(
        &self,
        collection: &str,
        query: &RecordsQuery,
    ) -> Result<RecordsPage<T>, AtlasError>
    where
        T: DeserializeOwned,
    {
        let mut url = self.url(&records_path(collection))?;
        {
            let mut pairs = url.query_pairs_mut();
            if let Some(sort) = query.sort.as_deref() {
                pairs.append_pair("sort", sort);
            }
            if let Some(page) = query.page {
                pairs.append_pair("page", &page.to_string());
            }
            if let Some(per_page) = query.per_page {
                pairs.append_pair("perPage", &per_page.to_string());
            }
            if let Some(filter) = query.filter.as_deref() {
                pairs.append_pair("filter", filter);
            }
        }

        let mut request = self.http.get(url);
        if let Some(token) = &self.token {
            request = request.header(AUTHORIZATION, token);
        }

        self.send(request).await
    }

    pub async fn get_record<T>(&self, collection: &str, id: &str) -> Result<T, AtlasError>
    where
        T: DeserializeOwned,
    {
        let request = self.request(Method::GET, &record_path(collection, id))?;
        self.send(request).await
    }

    pub async fn update_record<T, B>(
        &self,
        collection: &str,
        id: &str,
        body: &B,
    ) -> Result<T, AtlasError>
    where
        T: DeserializeOwned,
        B: Serialize + ?Sized,
    {
        let request = self
            .request(Method::PATCH, &record_path(collection, id))?
            .json(body);
        self.send(request).await
    }

    pub async fn delete_record(&self, collection: &str, id: &str) -> Result<(), AtlasError> {
        let request = self.request(Method::DELETE, &record_path(collection, id))?;
        self.send_no_content(request).await
    }

    fn request(&self, method: Method, path: &str) -> Result<RequestBuilder, AtlasError> {
        let url = self.url(path)?;
        let mut request = self.http.request(method, url);

        if let Some(token) = &self.token {
            request = request.header(AUTHORIZATION, token);
        }

        Ok(request)
    }

    fn url(&self, path: &str) -> Result<Url, AtlasError> {
        Url::parse(&format!("{}{}", self.base_url, path))
            .map_err(|err| AtlasError::Validation(format!("PocketBase base URL 无效: {err}")))
    }

    async fn send<T>(&self, request: RequestBuilder) -> Result<T, AtlasError>
    where
        T: DeserializeOwned,
    {
        let response = request.send().await.map_err(|err| AtlasError::Network {
            base_url: self.base_url.clone(),
            message: err.to_string(),
        })?;

        parse_response(response, &self.base_url).await
    }

    async fn send_no_content(&self, request: RequestBuilder) -> Result<(), AtlasError> {
        let response = request.send().await.map_err(|err| AtlasError::Network {
            base_url: self.base_url.clone(),
            message: err.to_string(),
        })?;

        if response.status().is_success() {
            return Ok(());
        }

        let status = response.status().as_u16();
        let body = response.bytes().await.map_err(|err| AtlasError::Network {
            base_url: self.base_url.clone(),
            message: err.to_string(),
        })?;
        Err(map_pocketbase_error(status, &body))
    }
}

#[derive(Debug, Clone, Default)]
pub struct RecordsQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub sort: Option<String>,
    pub filter: Option<String>,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct RecordsPage<T> {
    pub page: u32,
    #[serde(rename = "perPage")]
    pub per_page: u32,
    #[serde(rename = "totalItems")]
    pub total_items: u32,
    #[serde(rename = "totalPages")]
    pub total_pages: u32,
    pub items: Vec<T>,
}

#[derive(Debug, serde::Deserialize)]
struct AuthResponse {
    token: String,
}

#[derive(Debug, serde::Deserialize)]
struct PocketBaseErrorBody {
    #[serde(default)]
    message: String,
    #[serde(default)]
    data: HashMap<String, PocketBaseFieldError>,
}

#[derive(Debug, serde::Deserialize)]
struct PocketBaseFieldError {
    #[serde(default)]
    message: String,
}

fn records_path(collection: &str) -> String {
    format!("/api/collections/{collection}/records")
}

fn record_path(collection: &str, id: &str) -> String {
    format!("{}/{}", records_path(collection), id)
}

fn normalize_base_url(base_url: String) -> String {
    base_url.trim_end_matches('/').to_owned()
}

async fn parse_response<T>(response: reqwest::Response, base_url: &str) -> Result<T, AtlasError>
where
    T: DeserializeOwned,
{
    let status = response.status();
    let bytes = response.bytes().await.map_err(|err| AtlasError::Network {
        base_url: base_url.to_owned(),
        message: err.to_string(),
    })?;

    if status.is_success() {
        return serde_json::from_slice(&bytes).map_err(|err| AtlasError::PocketBase {
            status: status.as_u16(),
            message: format!("无法解析 PocketBase 响应: {err}"),
        });
    }

    Err(map_pocketbase_error(status.as_u16(), &bytes))
}

fn map_pocketbase_error(status: u16, bytes: &[u8]) -> AtlasError {
    if let Ok(parsed) = serde_json::from_slice::<PocketBaseErrorBody>(bytes) {
        let message = format_error_message(parsed);
        return match status {
            401 => AtlasError::Authentication(format!("{message}；请重新执行 `atlas login`")),
            404 => AtlasError::NotFound(message),
            _ => AtlasError::PocketBase { status, message },
        };
    }

    let fallback = String::from_utf8_lossy(bytes).trim().to_owned();
    let message = if fallback.is_empty() {
        "PocketBase 返回了空错误响应".to_owned()
    } else {
        fallback
    };

    match status {
        401 => AtlasError::Authentication(format!("{message}；请重新执行 `atlas login`")),
        404 => AtlasError::NotFound(message),
        _ => AtlasError::PocketBase { status, message },
    }
}

fn format_error_message(body: PocketBaseErrorBody) -> String {
    if body.data.is_empty() {
        return body.message;
    }

    let mut details = body
        .data
        .into_iter()
        .filter_map(|(field, error)| {
            if error.message.is_empty() {
                None
            } else {
                Some(format!("{field}: {}", error.message))
            }
        })
        .collect::<Vec<_>>();
    details.sort();

    if body.message.is_empty() {
        details.join("; ")
    } else {
        format!("{} ({})", body.message, details.join("; "))
    }
}

#[cfg(test)]
mod tests {
    use super::{map_pocketbase_error, normalize_base_url};

    #[test]
    fn maps_401_to_relogin_message() {
        let error = map_pocketbase_error(
            401,
            br#"{"message":"The current auth token is invalid","data":{}}"#,
        );

        assert_eq!(
            error.to_string(),
            "PocketBase 鉴权失败: The current auth token is invalid；请重新执行 `atlas login`"
        );
    }

    #[test]
    fn trims_trailing_slash_from_base_url() {
        assert_eq!(
            normalize_base_url("http://127.0.0.1:8090/".to_owned()),
            "http://127.0.0.1:8090"
        );
    }
}
