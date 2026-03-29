use std::path::PathBuf;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum AtlasError {
    #[error(
        "未找到本地登录配置，请先执行 `atlas login --base-url <url> --email <email> --password <password>`"
    )]
    MissingConfig,
    #[error("配置文件不可用: {path}: {message}")]
    Config { path: PathBuf, message: String },
    #[error("参数无效: {0}")]
    Validation(String),
    #[error("时间格式无效: {0}")]
    TimeParse(String),
    #[error("PocketBase 鉴权失败: {0}")]
    Authentication(String),
    #[error("记录不存在: {0}")]
    NotFound(String),
    #[error("无法连接 PocketBase ({base_url}): {message}")]
    Network { base_url: String, message: String },
    #[error("PocketBase 请求失败 ({status}): {message}")]
    PocketBase { status: u16, message: String },
}

impl AtlasError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::MissingConfig => "missing_config",
            Self::Config { .. } => "config_error",
            Self::Validation(_) => "validation_error",
            Self::TimeParse(_) => "time_parse_error",
            Self::Authentication(_) => "authentication_error",
            Self::NotFound(_) => "not_found",
            Self::Network { .. } => "network_error",
            Self::PocketBase { .. } => "pocketbase_error",
        }
    }
}
