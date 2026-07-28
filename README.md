# Kaleido

Shared application code for Eric Butera SaaS experiments.

## Packages

- Rust: `rust/kaleido`, published as [`kaleido`](https://crates.io/crates/kaleido).
- TypeScript: `typescript/packages/kaleido`, published as `@ericbutera/kaleido`.
- Scaffold: `scaffold/`, templates for new apps that consume the released packages.

The Rust crate exports `auth`, `background_jobs`, `glass`, and `migrations`.

## Development

```sh
task build
task typecheck
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
task release:status
task release:patch
task release:minor
task release:major
```

The release task runs checks, bumps both package versions, commits, tags, and
pushes. The tag workflow publishes npm and, after crates.io Trusted Publishing
is configured for `publish.yml`, publishes the Rust crate without a stored
crates.io token.

## License

MIT
