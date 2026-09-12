# Releasing Kaleido

Kaleido releases are run with mise.

## Commands

```sh
mise tasks
mise run release:status
mise run release
```

`mise run release` creates a guarded patch release. For other bump levels:

```sh
mise run release:minor
mise run release:major
```

The release task:

- requires `main`;
- requires a clean working tree;
- fetches `origin/main` and tags;
- refuses to release if local `main` is not pushed and up to date;
- runs package checks;
- bumps the Rust crate and TypeScript package together;
- refreshes `rust/Cargo.lock`;
- creates a release commit and annotated tag;
- pushes `main` and the tag atomically.

The tag workflow publishes the Rust crate and TypeScript package.
