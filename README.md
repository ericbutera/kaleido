# Kaleido

A multi-language monorepo for shared components across SaaS applications.

## Quickstart

Use the repo Taskfile as the human-facing entrypoint:

```sh
task build
task typecheck
task version
```

Release through guarded task wrappers instead of publishing by hand:

```sh
task release:status
task release:patch
task release:minor
task release:major
```

The release task fetches `origin/main` and tags, requires a clean `main`
branch, runs npm and Cargo package checks, asks you to type the computed tag,
creates the version commit and tag, then pushes them atomically. The tag
workflow publishes both `@ericbutera/kaleido` to npm and `kaleido` to
crates.io. If you rerun the command while `HEAD` is already a pushed release
tag, it exits without bumping again.

Consumer apps are updated from their own repos:

```sh
cd ../mycorner-axum
VERSION=0.7.0 task kaleido:upgrade

cd ../rss
VERSION=0.7.0 task kaleido:upgrade

cd ../bike
VERSION=0.7.0 task kaleido:upgrade
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

- **kaleido** - Shared Rust crate exporting `auth`, `background_jobs`, `glass`, and `migrations`

### TypeScript

- **@kaleido/auth-ui** - React authentication UI components

## Publishing

Normal publish flow should go through the repo `task` commands above. GitHub
Actions needs npm trusted publishing configured for `publish.yml` and a
`CARGO_REGISTRY_TOKEN` secret with crates.io publish rights for the `kaleido`
crate.

### Rust Crates

```bash
cd rust/kaleido
cargo publish --locked
```

### npm Packages

```bash
cd typescript/packages/kaleido
pnpm publish --access public
```

## Development

Each language workspace is independent. Navigate to the appropriate directory and use standard tooling for that ecosystem.

### Adding New Packages

**Rust**: Add modules to `rust/kaleido` unless there is a strong reason to create a new crate.

**TypeScript**: Add new package directory and reference in `typescript/package.json` workspaces

**Go**: Add new module directory with `go.mod`

### Starter Template

See `STARTER_TEMPLATE.md` for the initial SaaS starter blueprint.

## License

MIT

---

## TODO

- [ ] CSRF tokens
