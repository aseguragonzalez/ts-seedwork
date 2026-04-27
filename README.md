# @aseguragonzalez/seedwork

Shared domain, application, and infrastructure building blocks (DDD seedwork) for TypeScript/Node projects.

## Development workflows

This package supports two ways to work, both producing identical results.

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

### Option 2 — Devcontainer (VS Code / Cursor)

**Prerequisites:** Docker, VS Code with the Dev Containers extension (or Cursor).

Open the repository in VS Code and choose **Reopen in Container** when prompted.  
The container starts, `npm ci` runs automatically, and husky installs the pre-commit hooks.  
Use npm scripts inside the integrated terminal — no host setup needed.

## Command reference

| Task              | npm                                                                      |
| ----------------- | ------------------------------------------------------------------------ |
| Install deps      | `npm ci`                                                                 |
| Full quality gate | `npm run lint && npm run format:check && npm run type:check && npm test` |
| Lint              | `npm run lint`                                                           |
| Format check      | `npm run format:check`                                                   |
| Format write      | `npm run format`                                                         |
| Type check        | `npm run type:check`                                                     |
| Tests             | `npm test`                                                               |
| Tests (watch)     | `npm run test:watch`                                                     |
| Build package     | `npm run build`                                                          |
| Clean dist        | `npm run clean`                                                          |
| Install git hooks | _(automatic on `npm ci`)_                                                |

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
