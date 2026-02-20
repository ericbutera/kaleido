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
	npm version patch
	git push --follow-tags

publish-minor:
	npm version minor
	git push --follow-tags

publish-major:
	npm version major
	git push --follow-tags
