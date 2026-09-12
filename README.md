# Kaleido

Shared application code for Eric Butera SaaS experiments.

## Packages

- Rust: `rust/kaleido`, published as [`kaleido`](https://crates.io/crates/kaleido).
- TypeScript: `typescript/packages/kaleido`, published as `@ericbutera/kaleido`.
- Scaffold: `scaffold/`, templates for new apps that consume the released packages.

The Rust crate exports `auth`, `background_jobs`, `glass`, and `migrations`.

## Development

List available commands:

```sh
mise tasks
```

```sh
mise run build
mise run typecheck
```

Rust-only work:

```sh
cd rust
cargo check -p kaleido
cargo test -p kaleido
cargo package -p kaleido --locked
```

TypeScript-only work:

```sh
cd typescript/packages/kaleido
pnpm install
pnpm typecheck
pnpm build
```

Consumer apps should use released versions in production. Local development can
override Rust with `[patch.crates-io]` and TypeScript with the app's local
source alias or mounted package setup.

## Releases

Versions are kept aligned across the Rust crate and TypeScript package.

```sh
mise run release
mise run release:status
mise run release:minor
mise run release:major
```

`mise run release` creates a guarded patch release. It runs checks, bumps the
Rust crate and TypeScript package together, commits, tags, and pushes. The tag
workflow publishes both packages.

## License

MIT
