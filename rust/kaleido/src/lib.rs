/// Single entry-point for all kaleido Rust libraries.
///
/// Downstream crates add one dependency:
/// ```toml
/// kaleido = { git = "https://github.com/ericbutera/kaleido", branch = "main" }
/// ```
/// and import via `kaleido::auth::`, `kaleido::background_jobs::`, `kaleido::glass::`.
pub mod auth;
pub mod background_jobs;
pub mod glass;
