#!/bin/sh
set -e

npm install -g pnpm@9
cd typescript/packages/kaleido
pnpm install --no-frozen-lockfile
pnpm typecheck
pnpm build
