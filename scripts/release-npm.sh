#!/usr/bin/env bash
set -euo pipefail

PACKAGE_NAME="@ericbutera/kaleido"
PACKAGE_RELATIVE_PATH="typescript/packages/kaleido"

usage() {
  cat <<'EOF'
Usage:
  scripts/release-npm.sh status
  scripts/release-npm.sh patch
  scripts/release-npm.sh minor
  scripts/release-npm.sh major

Optional:
  CONFIRM=vX.Y.Z        Skip the interactive tag confirmation.
  SKIP_CHECKS=1         Skip pnpm install/typecheck/build.

Release safety:
  - must be on main with a clean working tree
  - fetches origin/main and tags before deciding anything
  - refuses to release from an unpushed or out-of-date branch
  - exits without bumping if HEAD is already a pushed release tag
  - requires confirming the computed tag before creating it
EOF
}

die() {
  echo "release: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
package_dir="$repo_root/$PACKAGE_RELATIVE_PATH"
package_json="$package_dir/package.json"

action="${1:-}"
case "$action" in
  status | patch | minor | major) ;;
  -h | --help | help | "") usage; exit 0 ;;
  *) usage; die "unknown action: $action" ;;
esac

cd "$repo_root"

require_cmd git
require_cmd node

current_version() {
  PACKAGE_JSON="$package_json" node <<'NODE'
const fs = require("fs");
const packageJson = JSON.parse(fs.readFileSync(process.env.PACKAGE_JSON, "utf8"));
console.log(packageJson.version);
NODE
}

next_version() {
  BUMP="$1" PACKAGE_JSON="$package_json" node <<'NODE'
const fs = require("fs");

const bump = process.env.BUMP;
const packageJson = JSON.parse(fs.readFileSync(process.env.PACKAGE_JSON, "utf8"));
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(packageJson.version);

if (!match) {
  console.error(`Unsupported version format: ${packageJson.version}`);
  process.exit(1);
}

const version = match.slice(1).map(Number);

if (bump === "patch") {
  version[2] += 1;
} else if (bump === "minor") {
  version[1] += 1;
  version[2] = 0;
} else if (bump === "major") {
  version[0] += 1;
  version[1] = 0;
  version[2] = 0;
} else {
  console.error(`Unsupported bump: ${bump}`);
  process.exit(1);
}

console.log(version.join("."));
NODE
}

write_version() {
  VERSION="$1" PACKAGE_JSON="$package_json" node <<'NODE'
const fs = require("fs");

const path = process.env.PACKAGE_JSON;
const packageJson = JSON.parse(fs.readFileSync(path, "utf8"));
packageJson.version = process.env.VERSION;
fs.writeFileSync(path, `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
}

release_tags_at_head() {
  git tag --points-at HEAD | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' || true
}

remote_tag_exists() {
  git ls-remote --exit-code --tags origin "refs/tags/$1" >/dev/null 2>&1
}

ensure_main_branch() {
  local branch
  branch="$(git branch --show-current)"
  [ "$branch" = "main" ] || die "must release from main; current branch is ${branch:-detached}"
}

ensure_clean_tree() {
  [ -z "$(git status --porcelain)" ] || die "working tree is dirty. Commit or stash changes before releasing."
}

fetch_release_refs() {
  echo "Fetching origin/main and tags..."
  git fetch origin main --tags
}

ensure_synced_with_origin_main() {
  local local_head remote_head
  local_head="$(git rev-parse HEAD)"
  remote_head="$(git rev-parse origin/main)"

  [ "$local_head" = "$remote_head" ] || die "main must match origin/main before a new release. Push or pull first."
}

latest_release_tag() {
  git tag --merged HEAD --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1 || true
}

confirm_tag() {
  local tag="$1"

  if [ "${CONFIRM:-}" = "$tag" ]; then
    return
  fi

  if [ -n "${CONFIRM:-}" ] && [ "$CONFIRM" != "$tag" ]; then
    die "CONFIRM was '$CONFIRM', expected '$tag'"
  fi

  if [ ! -t 0 ]; then
    die "non-interactive release requires CONFIRM=$tag"
  fi

  printf "About to create and push %s. Type %s to continue: " "$tag" "$tag" >&2
  read -r typed
  [ "$typed" = "$tag" ] || die "confirmation did not match; aborted"
}

run_package_checks() {
  if [ "${SKIP_CHECKS:-}" = "1" ]; then
    echo "Skipping package checks because SKIP_CHECKS=1."
    return
  fi

  require_cmd pnpm

  echo "Installing dependencies..."
  (cd "$package_dir" && pnpm install --no-frozen-lockfile)

  echo "Typechecking..."
  (cd "$package_dir" && pnpm typecheck)

  echo "Building..."
  (cd "$package_dir" && pnpm build)
}

push_release_refs() {
  local tag="$1"
  echo "Pushing main and $tag atomically..."
  git push --atomic origin "HEAD:refs/heads/main" "refs/tags/$tag:refs/tags/$tag"
}

print_status() {
  local clean="dirty"
  local head_tags latest

  [ -z "$(git status --porcelain)" ] && clean="clean"
  head_tags="$(release_tags_at_head | paste -sd, -)"
  latest="$(latest_release_tag)"

  echo "$PACKAGE_NAME version: $(current_version)"
  echo "branch: $(git branch --show-current)"
  echo "working tree: $clean"
  echo "HEAD: $(git rev-parse --short HEAD)"
  echo "HEAD release tag(s): ${head_tags:-none}"
  echo "latest release tag: ${latest:-none}"
}

if [ "$action" = "status" ]; then
  print_status
  exit 0
fi

ensure_main_branch
ensure_clean_tree
fetch_release_refs

head_tags="$(release_tags_at_head)"
if [ -n "$head_tags" ]; then
  head_tag="$(printf "%s\n" "$head_tags" | head -n 1)"
  if remote_tag_exists "$head_tag" && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
    echo "HEAD is already released as $head_tag and pushed. Nothing to do."
    exit 0
  fi

  confirm_tag "$head_tag"
  push_release_refs "$head_tag"
  echo "Recovered by pushing existing local release $head_tag."
  exit 0
fi

ensure_synced_with_origin_main

current="$(current_version)"
next="$(next_version "$action")"
tag="v$next"

echo "$PACKAGE_NAME: $current -> $next ($action)"

if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
  die "local tag already exists: $tag"
fi

if remote_tag_exists "$tag"; then
  die "remote tag already exists: $tag"
fi

if command -v npm >/dev/null 2>&1 && npm view "$PACKAGE_NAME@$next" version >/dev/null 2>&1; then
  die "npm already has $PACKAGE_NAME@$next"
fi

run_package_checks
confirm_tag "$tag"

write_version "$next"
git add "$PACKAGE_RELATIVE_PATH/package.json"
git commit -m "chore(release): $tag"
git tag -a "$tag" -m "$tag"
push_release_refs "$tag"

echo "Created release $tag. GitHub Actions will publish $PACKAGE_NAME@$next from the tag."
