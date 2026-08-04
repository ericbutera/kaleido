#!/bin/sh
set -e

cd rust
cargo fmt --all --check
cargo package -p kaleido --locked
