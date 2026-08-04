#!/bin/sh
set -e

: "${CARGO_REGISTRY_TOKEN:?CARGO_REGISTRY_TOKEN must be set}"

cd rust
VERSION="$(sed -n 's/^version = "\([^"]*\)"/\1/p' kaleido/Cargo.toml | head -n 1)"

if cargo info "kaleido@$VERSION" >/dev/null 2>&1; then
  echo "crates.io already has kaleido@$VERSION; skipping Rust publish."
  exit 0
fi

cargo publish -p kaleido --locked
