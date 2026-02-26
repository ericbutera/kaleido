use crate::controllers;
use axum::Router;
use std::sync::Arc;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AuthFeature {
    Auth,
    OAuth,
    AdminUsers,
}

#[derive(Debug, Clone)]
pub struct FeatureSet {
    pub auth: bool,
    pub oauth: bool,
    pub admin_users: bool,
}

impl Default for FeatureSet {
    fn default() -> Self {
        Self {
            auth: true,
            oauth: false,
            admin_users: false,
        }
    }
}

impl FeatureSet {
    pub fn auth_only() -> Self {
        Self {
            auth: true,
            oauth: false,
            admin_users: false,
        }
    }

    pub fn all() -> Self {
        Self {
            auth: true,
            oauth: true,
            admin_users: true,
        }
    }

    pub fn from_features(features: &[AuthFeature]) -> Self {
        let mut set = Self {
            auth: false,
            oauth: false,
            admin_users: false,
        };

        for feature in features {
            match feature {
                AuthFeature::Auth => set.auth = true,
                AuthFeature::OAuth => set.oauth = true,
                AuthFeature::AdminUsers => set.admin_users = true,
            }
        }

        set
    }
}

/// Install auth feature routes in a single call.
///
/// This is the first step toward feature-module driven setup where host apps
/// choose capabilities and avoid wiring endpoints one-by-one.
pub fn routes_for_features<S>(features: &FeatureSet) -> Router<Arc<S>>
where
    S: controllers::auth::AuthRouteStorage
        + crate::extractors::AuthStorage
        + controllers::oauth::OAuthRouteStorage,
{
    let mut router = Router::new();

    if features.auth {
        router = router.merge(controllers::auth::routes::<S>());
    }

    if features.oauth {
        router = router.nest("/oauth", controllers::oauth::routes::<S>());
    }

    // Placeholder for upcoming feature-module route installation.
    // `admin_users` endpoints will be mounted here when extracted from app code.
    if features.admin_users {
        tracing::debug!("admin_users feature enabled; no routes mounted yet");
    }

    router
}
