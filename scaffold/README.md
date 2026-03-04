# Scaffold App

This repository is now a Copier template, so generated projects can be upgraded over time with `copier update`.

Generated project layout:

- `api`
- `migration`
- `worker`
- `ui` (React/Vite) and/or `ui-next` (Next.js)
- Production and dev Dockerfiles for runtime services
- `.tool-versions` for asdf-managed external tools

## Copier usage (recommended)

Install Copier:

```bash
# using asdf-vm:
# asdf plugin add copier
# asdf install copier latest
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
