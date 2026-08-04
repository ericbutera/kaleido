#!/bin/sh
set -e

TAG="${CI_COMMIT_TAG:-}"
if [ -z "$TAG" ] && [ -n "${CI_COMMIT_REF:-}" ]; then
  TAG="${CI_COMMIT_REF#refs/tags/}"
fi

case "$TAG" in
  v[0-9]*.[0-9]*.[0-9]*) ;;
  *) echo "Expected a vX.Y.Z tag, got '${TAG:-unset}'" >&2; exit 1 ;;
esac

VERSION="${TAG#v}"
NPM_VERSION="$(node -p "require('./typescript/packages/kaleido/package.json').version")"
RUST_VERSION="$(sed -n 's/^version = "\([^"]*\)"/\1/p' rust/kaleido/Cargo.toml | head -n 1)"

[ "$NPM_VERSION" = "$VERSION" ] || {
  echo "npm package version $NPM_VERSION does not match tag $TAG" >&2
  exit 1
}

[ "$RUST_VERSION" = "$VERSION" ] || {
  echo "Rust crate version $RUST_VERSION does not match tag $TAG" >&2
  exit 1
}

echo "Release tag $TAG matches npm and Rust package versions."
