.PHONY: help build publish-patch publish-minor publish-major test

help:
	@echo "Available targets:"
	@echo "  build          - Build the package"
	@echo "  publish-patch  - Bump patch version and publish (0.1.0 -> 0.1.1)"
	@echo "  publish-minor  - Bump minor version and publish (0.1.0 -> 0.2.0)"
	@echo "  publish-major  - Bump major version and publish (0.1.0 -> 1.0.0)"

build:
	npm run build

publish-patch:
	@if [ -n "$(shell git status --porcelain)" ]; then \
		echo "Working tree is dirty. Commit or stash changes before releasing." >&2; \
		exit 1; \
	fi
	@echo "Updating package.json version (no git/tag)..."
	@npm version patch --no-git-tag-version
	@version=$$(node -p "require('./package.json').version"); \
		echo "Version bumped to $$version"; \
		git add package.json ../../package-lock.json || git add package.json || true; \
		git commit -m "chore(release): v$$version" || true; \
		git tag -a "v$$version" -m "v$$version" || true; \
		echo "Created tag v$$version"
	@echo "Pushing to remote with tags..."
	@git push origin HEAD --follow-tags

publish-minor:
	@if [ -n "$(shell git status --porcelain)" ]; then \
		echo "Working tree is dirty. Commit or stash changes before releasing." >&2; \
		exit 1; \
	fi
	@echo "Updating package.json version (no git/tag)..."
	@npm version minor --no-git-tag-version
	@version=$$(node -p "require('./package.json').version"); \
		echo "Version bumped to $$version"; \
		git add package.json ../../package-lock.json || git add package.json || true; \
		git commit -m "chore(release): v$$version" || true; \
		git tag -a "v$$version" -m "v$$version" || true; \
		echo "Created tag v$$version"
	@echo "Pushing to remote with tags..."
	@git push origin HEAD --follow-tags

publish-major:
	@if [ -n "$(shell git status --porcelain)" ]; then \
		echo "Working tree is dirty. Commit or stash changes before releasing." >&2; \
		exit 1; \
	fi
	@echo "Updating package.json version (no git/tag)..."
	@npm version major --no-git-tag-version
	@version=$$(node -p "require('./package.json').version"); \
		echo "Version bumped to $$version"; \
		git add package.json ../../package-lock.json || git add package.json || true; \
		git commit -m "chore(release): v$$version" || true; \
		git tag -a "v$$version" -m "v$$version" || true; \
		echo "Created tag v$$version"
	@echo "Pushing to remote with tags..."
	@git push origin HEAD --follow-tags


