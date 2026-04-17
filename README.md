# Kaleido

A multi-language monorepo for shared components across SaaS applications.

## Quickstart

Use the workspace task surface as the human-facing entrypoint:

```sh
task kaleido:build
task kaleido:typecheck
task kaleido:version
```

Release through task wrappers instead of publishing by hand:

```sh
task kaleido:release:patch
task kaleido:release:patch:upgrade
```

## Language-Specific Workspaces

When you need lower-level debugging or package work, use the language workspaces directly.

### Rust Workspace

```bash
cd rust
cargo build
cargo test
```

### TypeScript Workspace

```bash
cd typescript
pnpm install
pnpm build
```

## Packages

### Rust

- **auth** - JWT authentication, cookies, user management, OAuth
- **background_jobs** - Durable background job queue with memory/persistent storage
- **glass** - Shared application services and primitives (including shared email transport/templates)

### TypeScript

- **@kaleido/auth-ui** - React authentication UI components

## Publishing

Normal publish flow should go through the workspace `task` commands above.

### Rust Crates

```bash
cd rust/auth
cargo publish
```

### npm Packages

```bash
cd typescript/packages/kaleido
pnpm publish --access public
```

## Development

Each language workspace is independent. Navigate to the appropriate directory and use standard tooling for that ecosystem.

### Adding New Packages

**Rust**: Add new crate directory and reference in `rust/Cargo.toml`

**TypeScript**: Add new package directory and reference in `typescript/package.json` workspaces

**Go**: Add new module directory with `go.mod`

### Starter Template

See `STARTER_TEMPLATE.md` for the initial SaaS starter blueprint.

## License

MIT

---

## TODO

- [ ] CSRF tokens
