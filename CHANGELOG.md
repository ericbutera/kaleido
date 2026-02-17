# Changelog

All notable changes to the Kaleido monorepo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial monorepo structure for Rust, TypeScript, and Go
- Rust workspace with auth and background_jobs crates
- TypeScript workspace with @kaleido/auth-ui package

## [0.1.0] - 2026-02-17

### Added

#### Rust Crates

**auth (0.1.0)**
- JWT authentication and refresh token handling
- Cookie-based session management
- User registration, login, logout
- Email verification and password reset flows
- OAuth provider support (Google, GitHub, etc.)
- Password hashing with Argon2
- SeaORM database integration
- Axum web framework integration
- Optional AWS Secrets Manager support

**background_jobs (0.1.0)**
- Async job queue with pluggable storage backends
- In-memory storage for development
- Durable/persistent storage via SeaORM
- Job retry logic with exponential backoff
- Scheduled/delayed jobs
- Job status tracking and monitoring
- Dead letter queue for failed jobs

#### TypeScript Packages

**@kaleido/auth-ui (0.1.0)**
- React authentication UI components
- Login, SignUp, ForgotPassword, Reset, Verify, ResendConfirmation pages
- react-hook-form integration with server-side validation
- Backend-agnostic via dependency injection pattern
- DaisyUI styling with Tailwind CSS
- Type-safe with full TypeScript support
- @tanstack/react-query integration

### Documentation
- README with monorepo structure overview
- Integration guide for consuming packages in projects
- Package-specific README files
- Example implementations

### Infrastructure
- Git repository initialization
- Workspace configurations for Rust and npm
- Shared dependency management
- .gitignore for multi-language support
- CI/CD ready structure

## Migration Notes

### From mycorner-axum

Components extracted from `mycorner-axum` project:
- `auth/` Rust crate → `kaleido/rust/auth`
- `background_jobs/` Rust crate → `kaleido/rust/background_jobs`
- `ui/src/pages/auth/` → `kaleido/typescript/packages/auth-ui/src/pages/auth`
- `ui/src/components/auth/` → `kaleido/typescript/packages/auth-ui/src/components/auth`
- `ui/src/lib/form.ts` → `kaleido/typescript/packages/auth-ui/src/lib/form.ts`

### Breaking Changes
None (initial release)

## Future Plans

### Rust
- Add middleware crate for common Axum middleware
- Add testing utilities crate
- Add migration management crate

### TypeScript
- Add @kaleido/ui-components for shared UI components
- Add @kaleido/hooks for common React hooks
- Add @kaleido/utils for shared utilities

### Go
- Add auth client library
- Add API SDK generator

[Unreleased]: https://github.com/yourusername/kaleido/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/kaleido/releases/tag/v0.1.0
