/// Single entry-point for all kaleido Rust libraries.
///
/// Downstream crates add one dependency:
/// ```toml
/// kaleido = "0.8"
/// ```
/// and import via `kaleido::auth::`, `kaleido::background_jobs::`,
/// `kaleido::glass::`, and `kaleido::migrations::`.
pub mod auth;
pub mod background_jobs;
pub mod glass;
pub mod migrations;
