//! Helper functions for issuing and clearing refresh-token cookies.

/// Name of the HttpOnly cookie used for refresh tokens across the starter kit.
pub const REFRESH_COOKIE_NAME: &str = "refresh_token";

/// Build a `Set-Cookie` value for the HttpOnly refresh cookie.
///
/// # Arguments
/// * `token` - The refresh token value
/// * `frontend_url` - The frontend URL to determine if connection is secure
pub fn refresh_cookie_value(token: &str, frontend_url: &str) -> String {
    let secure = frontend_url.starts_with("https://");
    let mut cookie_val = format!(
        "{}={}; HttpOnly; Path=/; SameSite=Lax;",
        REFRESH_COOKIE_NAME, token
    );
    if secure {
        cookie_val.push_str(" Secure;");
    }
    cookie_val
}

/// Build a `Set-Cookie` value that clears the refresh cookie immediately.
///
/// # Arguments
/// * `frontend_url` - The frontend URL to determine if connection is secure
pub fn clear_refresh_cookie_value(frontend_url: &str) -> String {
    let secure = frontend_url.starts_with("https://");
    let mut cookie_val = format!(
        "{}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0;",
        REFRESH_COOKIE_NAME
    );
    if secure {
        cookie_val.push_str(" Secure;");
    }
    cookie_val
}
