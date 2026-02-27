pub mod cooldown;
pub mod data;
pub mod email;
pub mod error;
pub mod feature_flags;
pub mod features;
pub mod openapi;

pub use error::GlassError;
pub use openapi::SecurityAddon;

// Re-export auth crate and common feature modules so callers can import
// Re-export common feature modules so callers can import
// features from `glass::flags`, `glass::cooldowns`, or `glass::email_features`.
pub use cooldown as cooldowns;
pub use email as email_features;
pub use feature_flags as flags;
