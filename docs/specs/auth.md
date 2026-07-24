# Kaleido Auth Spec

## Purpose

Kaleido auth provides shared session, password, OAuth/OIDC, user identity, worker email, and frontend auth UI contracts for Kaleido-powered apps. Apps own deployment configuration and policy. Kaleido owns route handlers, token issuing, refresh-cookie behavior, provider normalization, OAuth provider discovery, and shared React auth components.

## Auth Modes

Password auth remains supported and is enabled by default. Apps may disable it with `AUTH_PASSWORD_ENABLED=false`.

Registration is separately controlled and is enabled by default. Apps may disable account creation with `AUTH_REGISTRATION_ENABLED=false` while still allowing existing password users to sign in.

OAuth is additive. It does not have a feature flag. Providers become available when their API environment variables form a complete provider config.

## Backend Routes

Apps mount the shared routes from `kaleido::auth`:

- `session_routes()` provides `/auth/current`, `/auth/refresh`, and `/auth/logout`.
- `routes()` provides session routes plus `/auth/register`, `/auth/login`, `/auth/resend-confirmation`, `/auth/verify/{token}`, `/auth/forgot`, and `/auth/reset`.
- `oauth_routes()` provides `/providers`, `/{provider}`, and `/{provider}/callback` relative to the app OAuth mount point.

Recommended app mount shape:

```rust
Router::new()
    .nest("/api", kaleido::auth::routes())
    .nest("/api/oauth", kaleido::auth::oauth_routes())
```

Apps implement `AuthStorage`, `AuthRouteStorage`, and `OAuthRouteStorage`. `AuthRouteStorage::password_auth_enabled()` and `registration_enabled()` default to `true`; apps can override them from env-backed config.

## Provider Env Contract

Provider IDs are stable lowercase strings used in routes:

```text
/api/oauth/{provider}
/api/oauth/{provider}/callback
```

Kaleido reads generic provider env vars:

```text
OAUTH_PROVIDERS=acme,internal
OAUTH_ACME_LABEL=Acme SSO
OAUTH_ACME_CLIENT_ID=...
OAUTH_ACME_CLIENT_SECRET=...
OAUTH_ACME_ISSUER_URL=https://idp.example.com

OAUTH_INTERNAL_CLIENT_ID=...
OAUTH_INTERNAL_CLIENT_SECRET=...
OAUTH_INTERNAL_AUTH_URL=https://login.example.com/oauth/authorize
OAUTH_INTERNAL_TOKEN_URL=https://login.example.com/oauth/token
OAUTH_INTERNAL_USERINFO_URL=https://login.example.com/oauth/userinfo
```

`OAUTH_PROVIDERS` is optional and controls display order. Kaleido also infers providers from `OAUTH_<PROVIDER>_CLIENT_ID`, `OAUTH_<PROVIDER>_ISSUER_URL`, `OAUTH_<PROVIDER>_AUTH_URL`, and `OAUTH_DEV_ENABLED`.

Generic OIDC providers need either:

- `OAUTH_<PROVIDER>_ISSUER_URL`, using OIDC discovery, or
- `OAUTH_<PROVIDER>_AUTH_URL`, `OAUTH_<PROVIDER>_TOKEN_URL`, and `OAUTH_<PROVIDER>_USERINFO_URL`.

All non-dev providers use the same generic `OAUTH_<PROVIDER>_*` contract. Kaleido does not ship provider-specific endpoint defaults.

Provider secrets are read from process env only. Kaleido does not store OAuth client secrets in the database.

## Provider Discovery

`GET /api/oauth/providers` returns enabled providers:

```json
{
  "providers": [
    { "id": "acme", "label": "Continue with Acme SSO" }
  ]
}
```

Only complete provider configs are returned. For example, `OAUTH_ACME_CLIENT_ID` without a secret and issuer/endpoints does not expose an Acme button.

## Frontend Contract

Apps configure shared auth UI with:

```tsx
const authConfig = {
  passwordAuthEnabled,
  registrationEnabled,
  OAuthProviderButtons: auth.createOAuthProviderButtons(apiUrl),
};
```

The shared provider buttons fetch `{apiUrl}/oauth/providers` and render the providers the API detects from complete OAuth environment configuration.

Password-only, OAuth-only, and mixed sign-in screens all use the same shared Kaleido pages. Password recovery and confirmation pages render a SSO-only notice when password auth is disabled.

## Redirect Contract

Kaleido constructs OAuth callback URLs from `OAuthRouteStorage::api_url()`:

```text
{API_URL_WITHOUT_TRAILING_SLASH}/api/oauth/{provider}/callback
```

After a successful OAuth callback, Kaleido links by provider subject, then by email, otherwise creates a provider user with `password = NULL`. It issues tokens, sets the refresh cookie, and redirects to `{FRONTEND_URL}/auth/callback`.

## Open Decisions

- CSRF state is generated during authorization URL creation but is not persisted or validated by the callback path.
