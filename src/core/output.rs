use serde::Serialize;

use crate::core::error::AtlasError;

#[derive(Debug, Serialize)]
struct SuccessEnvelope<T> {
    ok: bool,
    data: T,
}

#[derive(Debug, Serialize)]
struct ErrorEnvelope<'a> {
    ok: bool,
    error: ErrorPayload<'a>,
}

#[derive(Debug, Serialize)]
struct ErrorPayload<'a> {
    code: &'a str,
    message: String,
}

pub fn print_json_success<T>(data: T)
where
    T: Serialize,
{
    let payload = SuccessEnvelope { ok: true, data };
    print_stdout_json(&payload);
}

pub fn print_json_error(error: &AtlasError) {
    let payload = ErrorEnvelope {
        ok: false,
        error: ErrorPayload {
            code: error.code(),
            message: error.to_string(),
        },
    };
    print_stderr_json(&payload);
}

fn print_stdout_json<T>(value: &T)
where
    T: Serialize,
{
    match serde_json::to_string_pretty(value) {
        Ok(rendered) => println!("{rendered}"),
        Err(_) => println!(
            "{{\"ok\":false,\"error\":{{\"code\":\"serialization_error\",\"message\":\"JSON serialization failed\"}}}}"
        ),
    }
}

fn print_stderr_json<T>(value: &T)
where
    T: Serialize,
{
    match serde_json::to_string_pretty(value) {
        Ok(rendered) => eprintln!("{rendered}"),
        Err(_) => eprintln!(
            "{{\"ok\":false,\"error\":{{\"code\":\"serialization_error\",\"message\":\"JSON serialization failed\"}}}}"
        ),
    }
}
