.PHONY: help build publish-patch publish-minor publish-major release-status test

RELEASE_SCRIPT := ../../../scripts/release-npm.sh

help:
	@echo "Available targets:"
	@echo "  build           - Build the package"
	@echo "  release-status  - Show current release state"
	@echo "  publish-patch   - Create and push a guarded patch release"
	@echo "  publish-minor   - Create and push a guarded minor release"
	@echo "  publish-major   - Create and push a guarded major release"

build:
	pnpm run build

release-status:
	bash $(RELEASE_SCRIPT) status

publish-patch:
	bash $(RELEASE_SCRIPT) patch

publish-minor:
	bash $(RELEASE_SCRIPT) minor

publish-major:
	bash $(RELEASE_SCRIPT) major
