// OpenAPI re-exports for the `auth` crate.
// Exposes `paths`, `schemas`, and `tags` so downstream services can
// include auth endpoints and components succinctly.

pub mod paths {
    // Re-export the original path functions
    pub use crate::controllers::auth::{
        current, forgot_password, login, logout, refresh, register, resend_confirmation,
        reset_password, verify_email,
    };
    pub use crate::controllers::oauth::{oauth_authorize, oauth_callback};

    // Re-export the utoipa-generated marker types so downstream `derive(OpenApi)`
    // can resolve the path markers from this module (e.g. `auth::openapi::paths::register`).
    pub use crate::controllers::auth::{
        __path_current, __path_forgot_password, __path_login, __path_logout, __path_refresh,
        __path_register, __path_resend_confirmation, __path_reset_password, __path_verify_email,
    };
    pub use crate::controllers::oauth::{__path_oauth_authorize, __path_oauth_callback};
}

pub mod schemas {
    pub use crate::controllers::auth::MessageResponse;
    pub use crate::services::{
        ForgotPasswordRequest, LoginRequest, RegisterRequest, RegisterResponse,
        ResendConfirmationRequest, ResetPasswordRequest, TokenResponse, UserResponse,
    };
}

pub mod tags {
    pub const TAGS: &[(&str, &str)] = &[("auth", "Authentication and user management")];
}
