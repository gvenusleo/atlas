use clap::Parser;

use crate::cli::{Cli, OutputFormat};

mod app;
mod cli;
mod core;
mod features;
mod infra;

#[tokio::main]
async fn main() {
    let cli = Cli::parse();
    let output = cli.output;

    if let Err(err) = app::run(cli).await {
        match output {
            OutputFormat::Text => eprintln!("{err}"),
            OutputFormat::Json => core::output::print_json_error(&err),
        }
        std::process::exit(1);
    }
}
