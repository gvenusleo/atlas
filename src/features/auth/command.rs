use clap::Args;
use serde::Serialize;

use crate::cli::OutputFormat;
use crate::core::error::AtlasError;
use crate::core::output::print_json_success;
use crate::infra::config::{AppConfig, ConfigStore};
use crate::infra::pocketbase::PocketBaseClient;

#[derive(Debug, Args)]
#[command(about = "登录 PocketBase 超级管理员账号并保存本地配置")]
pub struct LoginArgs {
    #[arg(
        long,
        help = "PocketBase 服务地址",
        long_help = "PocketBase 服务地址，例如 http://127.0.0.1:8090。不要省略协议头。"
    )]
    pub base_url: String,
    #[arg(
        long,
        help = "PocketBase 登录邮箱",
        long_help = "用于 PocketBase 超级管理员登录的邮箱地址。"
    )]
    pub email: String,
    #[arg(
        long,
        help = "PocketBase 登录密码",
        long_help = "用于 PocketBase 超级管理员登录的密码。"
    )]
    pub password: String,
}

#[derive(Debug, Serialize)]
struct LoginOutput {
    base_url: String,
    auth_type: String,
    config_path: String,
}

pub async fn handle_login(args: LoginArgs, output: OutputFormat) -> Result<(), AtlasError> {
    let client = PocketBaseClient::new(args.base_url, None)?;
    let token = client.login_superuser(&args.email, &args.password).await?;

    let store = ConfigStore::default();
    let config = AppConfig {
        base_url: client.base_url().to_owned(),
        token,
        auth_type: "superuser".to_owned(),
    };

    store.save(&config)?;
    match output {
        OutputFormat::Text => println!("登录成功，配置已保存到 {}", store.path().display()),
        OutputFormat::Json => print_json_success(LoginOutput {
            base_url: client.base_url().to_owned(),
            auth_type: config.auth_type,
            config_path: store.path().display().to_string(),
        }),
    }
    Ok(())
}
