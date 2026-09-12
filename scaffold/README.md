# Scaffold App

This repository is now a Copier template, so generated projects can be upgraded over time with `copier update`.

Generated project layout:

- `api`
- `migration`
- `worker`
- `ui-next` (Next.js)
- Production and dev Dockerfiles for runtime services
- `mise.toml` for external tools and task runner commands

Generated projects are expected to use `mise run` as the human-facing command runner:

```sh
mise run ui-next:dev
mise run api:dev
mise run worker:dev
```

## Copier usage (recommended)

Install Copier:

```bash
mise x copier -- copier --version
# or:
pipx install copier
```

Create a new project from this local template (portable path):

```bash
copier copy ../scaffold rss
```

For team/shared repos, prefer a Git URL template source so `_src_path` in `.copier-answers.yml` is machine-independent.

Update an existing generated project later:

```bash
copier update
```

Copier writes `.copier-answers.yml` in generated projects to support repeatable upgrades.
Non-git projects are not supported for updates.

## Upgrade prerequisites

- Keep this template in a Git repository.
- Tag template releases (for example `v0.1.0`, `v0.2.0`).
- Keep generated projects in Git too before running `copier update`.
- No fallback path is supported for non-git projects.
