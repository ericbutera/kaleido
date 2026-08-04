#!/bin/sh
set -e

: "${NPM_TOKEN:?NPM_TOKEN must be set}"

npm install -g pnpm@9
cd typescript/packages/kaleido
VERSION="$(node -p "require('./package.json').version")"

if npm view "@ericbutera/kaleido@$VERSION" version >/dev/null 2>&1; then
  echo "npm already has @ericbutera/kaleido@$VERSION; skipping npm publish."
  exit 0
fi

printf '//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n' > "$HOME/.npmrc"
pnpm publish --access public --no-git-checks
