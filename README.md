# @aseguragonzalez/seedwork

Shared domain, application, and infrastructure building blocks (DDD seedwork) for TypeScript/Node projects.

## Development workflows

This package supports three ways to work, all producing identical results.

### Option 1 — Local (traditional)

**Prerequisites:** Node 22, npm.

```bash
git clone <repo>
npm ci          # installs deps + sets up git pre-commit hooks via husky
```

Use npm scripts directly:

```bash
npm run lint
npm run format:check
npm run type:check
npm test
npm run build
```

### Option 2 — Docker (no local Node required)

**Prerequisites:** Docker, Make.

```bash
git clone <repo>
make docker-build   # build the dev image (one-time, cached)
```

Run any task through the container:

```bash
make docker-check        # full quality gate: lint + format + types + tests
make docker-test
make docker-lint
make docker-format-check
make docker-type-check
make docker-build-pkg    # compile TypeScript to dist/
make docker-shell        # open an interactive shell in the container
```

Set up a git pre-commit hook that runs the full gate in Docker automatically:

```bash
make hooks
```

### Option 3 — Devcontainer (VS Code / Cursor)

**Prerequisites:** Docker, VS Code with the Dev Containers extension (or Cursor).

Open the repository in VS Code and choose **Reopen in Container** when prompted.  
The container starts, `npm ci` runs automatically, and husky installs the pre-commit hooks.  
Use npm scripts or the Makefile local targets inside the integrated terminal — no host setup needed.

## Command reference

| Task               | npm (options 1 & 3)       | make local (option 1) | make Docker (option 2)     |
| ------------------ | ------------------------- | --------------------- | -------------------------- |
| Install deps       | `npm ci`                  | `make install`        | _(baked into image)_       |
| Full quality gate  | —                         | `make check`          | `make docker-check`        |
| Lint               | `npm run lint`            | `make lint`           | `make docker-lint`         |
| Format check       | `npm run format:check`    | `make format-check`   | `make docker-format-check` |
| Format write       | `npm run format`          | `make format`         | —                          |
| Type check         | `npm run type:check`      | `make type-check`     | `make docker-type-check`   |
| Tests              | `npm test`                | `make test`           | `make docker-test`         |
| Tests (watch)      | `npm run test:watch`      | `make test-watch`     | —                          |
| Build package      | `npm run build`           | `make build`          | `make docker-build-pkg`    |
| Clean dist         | `npm run clean`           | `make clean`          | —                          |
| Shell in container | —                         | —                     | `make docker-shell`        |
| Install git hooks  | _(automatic on `npm ci`)_ | —                     | `make hooks`               |

## Consuming from GitHub Packages

1. Add a `.npmrc` to your project:

   ```text
   @aseguragonzalez:registry=https://npm.pkg.github.com
   ```

   Replace `aseguragonzalez` with the scope used when publishing.

2. Authenticate with a personal access token with `read:packages`.

3. Install:

   ```bash
   npm install @aseguragonzalez/seedwork
   ```

## Customising the package scope

Replace `aseguragonzalez` in `package.json` (`name`, `repository.url`) and in any `.npmrc` files with your GitHub organisation or username.
