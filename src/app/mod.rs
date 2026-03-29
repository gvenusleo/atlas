use crate::cli::{Cli, Command};
use crate::core::error::AtlasError;
use crate::features::{auth, txns};

pub async fn run(cli: Cli) -> Result<(), AtlasError> {
    match cli.command {
        Command::Login(args) => auth::command::handle_login(args, cli.output).await,
        Command::Txns(args) => txns::command::handle_txns(args, cli.output).await,
    }
}
