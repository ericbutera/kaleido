pub mod admin;
pub mod auth;
pub use auth::routes;

pub mod oauth;

pub use admin::routes as admin_routes;
