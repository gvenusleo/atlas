use clap::{Parser, Subcommand, ValueEnum};

use crate::features::auth::command::LoginArgs;
use crate::features::txns::command::TxnsArgs;

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum OutputFormat {
    Text,
    Json,
}

#[derive(Debug, Parser)]
#[command(
    name = "atlas",
    version,
    about = "基于 PocketBase 的可扩展命令行工具集"
)]
pub struct Cli {
    #[arg(
        long,
        global = true,
        value_enum,
        default_value_t = OutputFormat::Text,
        help = "输出格式",
        long_help = "输出格式。text 适合人工阅读，json 适合 skill、agent 或其他程序解析。"
    )]
    pub output: OutputFormat,
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    #[command(about = "登录 PocketBase 并保存本地访问令牌")]
    Login(LoginArgs),
    #[command(about = "记账数据的增删改查与统计分析")]
    Txns(TxnsArgs),
}
