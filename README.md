# Kaleido

A multi-language monorepo for shared components across SaaS applications.

## Language-Specific Workspaces

### Rust Workspace

```bash
cd rust
cargo build
cargo test
```

### TypeScript Workspace

```bash
cd typescript
npm install
npm run build
```

## Packages

### Rust

- **auth** - JWT authentication, cookies, user management, OAuth
- **background_jobs** - Durable background job queue with memory/persistent storage
- **glass** - Shared application services and primitives (including shared email transport/templates)

### TypeScript

- **@kaleido/auth-ui** - React authentication UI components

## Publishing

### Rust Crates

```bash
cd rust/auth
cargo publish
```

### npm Packages

```bash
cd typescript/auth-ui
npm publish --access public
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
