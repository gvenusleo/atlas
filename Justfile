set positional-arguments := true

# 列出所有可用的 just 命令
default:
    @just --list

# 格式化整个项目的 Rust 代码
fmt:
    cargo fmt --all

# 仅检查代码格式，不实际修改文件
fmt-check:
    cargo fmt --all -- --check

# 执行基础编译检查，快速发现语法和类型错误
check:
    cargo check

# 运行 Clippy 静态检查，覆盖全部 target 和 feature
clippy:
    cargo clippy --all-targets --all-features

# 运行项目测试
test:
    cargo test

# 一次性执行格式、编译、Clippy 和测试检查
verify: fmt-check check clippy test

# 以开发模式构建项目
build:
    cargo build

# 以 release 模式构建项目
release:
    cargo build --release

# 清理编译产物
clean:
    cargo clean

# 以开发模式运行 atlas，并透传任意命令行参数
run *args:
    cargo run -- "$@"

# 以 JSON 输出模式运行 atlas，并透传任意命令行参数
run-json *args:
    cargo run -- --output json "$@"

# 查看 atlas CLI 的总帮助信息
help:
    cargo run -- --help

# 执行 PocketBase 登录命令，并透传登录参数
login *args:
    cargo run -- login "$@"

# 执行 txns 模块命令，并透传任意子命令和参数
txns *args:
    cargo run -- txns "$@"

# 以 JSON 输出模式执行 txns 模块命令
txns-json *args:
    cargo run -- --output json txns "$@"

# 安装 atlas 二进制并同步 skill
install:
    cargo install --path . --root ~/.local --force
    mkdir -p ~/.codex/skills
    rm -rf ~/.codex/skills/atlas-cli
    cp -R skills/atlas-cli ~/.codex/skills/atlas-cli
