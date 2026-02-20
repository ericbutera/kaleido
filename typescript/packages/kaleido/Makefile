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
	@echo "Bumping patch version..."
	npm version patch -m "chore(release): %s"
	@echo "Pushing to remote..."
	git push --follow-tags

publish-minor:
	@echo "Bumping minor version..."
	npm version minor -m "chore(release): %s"
	@echo "Pushing to remote..."
	git push --follow-tags

publish-major:
	@echo "Bumping major version..."
	npm version major -m "chore(release): %s"
	@echo "Pushing to remote..."
	git push --follow-tags
