IMAGE := ts-seedwork-dev

# Mount source from host; anonymous volume preserves the image's node_modules
# so Docker targets work without installing Node locally.
DOCKER := docker run --rm \
	-v $(PWD):/workspace \
	-v /workspace/node_modules \
	-w /workspace \
	$(IMAGE)

DOCKER_IT := docker run --rm -it \
	-v $(PWD):/workspace \
	-v /workspace/node_modules \
	-w /workspace \
	$(IMAGE)

.PHONY: install build clean check test test-watch lint format format-check type-check \
        docker-build docker-check docker-test docker-lint docker-format-check \
        docker-type-check docker-build-pkg docker-shell hooks

## ── Local (requires Node 22) ─────────────────────────────────────────────────

install:
	npm ci

build:
	npm run build

clean:
	npm run clean

lint:
	npm run lint

format:
	npm run format

format-check:
	npm run format:check

type-check:
	npm run type:check

test:
	npm test

test-watch:
	npm run test:watch

check: lint format-check type-check test

## ── Docker (no local Node required) ──────────────────────────────────────────

docker-build:
	docker build -t $(IMAGE) .

docker-lint: docker-build
	$(DOCKER) npm run lint

docker-format-check: docker-build
	$(DOCKER) npm run format:check

docker-type-check: docker-build
	$(DOCKER) npm run type:check

docker-test: docker-build
	$(DOCKER) npm test

docker-check: docker-build
	$(DOCKER) sh -c "npm run lint && npm run format:check && npm run type:check && npm test"

docker-build-pkg: docker-build
	$(DOCKER) npm run build

docker-shell: docker-build
	$(DOCKER_IT) sh

## ── Git hooks ────────────────────────────────────────────────────────────────

# For Docker-only devs (option 2): installs a pre-commit hook that runs
# the full quality gate inside the container (no local Node needed).
hooks:
	@hooks_dir="$$(git config --path core.hooksPath 2>/dev/null || true)"; \
	if [ -z "$$hooks_dir" ]; then hooks_dir=".git/hooks"; fi; \
	mkdir -p "$$hooks_dir"; \
	printf '#!/bin/sh\nmake docker-check\n' > "$$hooks_dir/pre-commit"; \
	chmod +x "$$hooks_dir/pre-commit"; \
	echo "pre-commit hook installed → $$hooks_dir/pre-commit runs 'make docker-check'"
