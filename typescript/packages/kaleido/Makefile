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
	@echo "Bumping patch version in package.json..."
	@node -e "const fs=require('fs');const p='package.json';const j=JSON.parse(fs.readFileSync(p));const v=j.version.split('.').map(n=>parseInt(n));v[2]= (v[2]||0)+1;j.version=v.join('.');fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');console.log('version',j.version);" \
		; version=$$(node -p "require('./package.json').version"); \
		echo "Version bumped to $$version"; \
		git add package.json; \
		git commit -m "chore(release): v$$version" || true; \
		git tag -a "v$$version" -m "v$$version" || true; \
		echo "Created tag v$$version"; \
		echo "NOTE: not pushing. Run 'git push origin HEAD --follow-tags' when ready."

publish-minor:
	@if [ -n "$(shell git status --porcelain)" ]; then \
		echo "Working tree is dirty. Commit or stash changes before releasing." >&2; \
		exit 1; \
	fi
	@echo "Bumping minor version in package.json..."
	@node -e "const fs=require('fs');const p='package.json';const j=JSON.parse(fs.readFileSync(p));const v=j.version.split('.').map(n=>parseInt(n));v[1]=(v[1]||0)+1;v[2]=0;j.version=v.join('.');fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');console.log('version',j.version);" \
		; version=$$(node -p "require('./package.json').version"); \
		echo "Version bumped to $$version"; \
		git add package.json; \
		git commit -m "chore(release): v$$version" || true; \
		git tag -a "v$$version" -m "v$$version" || true; \
		echo "Created tag v$$version"; \
		echo "NOTE: not pushing. Run 'git push origin HEAD --follow-tags' when ready."

publish-major:
	@if [ -n "$(shell git status --porcelain)" ]; then \
		echo "Working tree is dirty. Commit or stash changes before releasing." >&2; \
		exit 1; \
	fi
	@echo "Bumping major version in package.json..."
	@node -e "const fs=require('fs');const p='package.json';const j=JSON.parse(fs.readFileSync(p));const v=j.version.split('.').map(n=>parseInt(n));v[0]=(v[0]||0)+1;v[1]=0;v[2]=0;j.version=v.join('.');fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');console.log('version',j.version);" \
		; version=$$(node -p "require('./package.json').version"); \
		echo "Version bumped to $$version"; \
		git add package.json; \
		git commit -m "chore(release): v$$version" || true; \
		git tag -a "v$$version" -m "v$$version" || true; \
		echo "Created tag v$$version"; \
		echo "NOTE: not pushing. Run 'git push origin HEAD --follow-tags' when ready."


