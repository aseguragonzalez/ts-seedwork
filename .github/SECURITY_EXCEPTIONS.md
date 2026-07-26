# Security exceptions

This repository has three separate mechanisms for consciously accepting a dependency-security
tradeoff it can't or won't fix immediately, each with its own automation that watches the
exception for staleness. This document explains what each mechanism is for, when to reach for it,
and how to safely remove an entry once the automation flags it as possibly stale.

If a fourth mechanism is ever added, document it here too.

## 1. `package.json` `overrides`

**What it's for:** forcing npm to resolve a transitive dependency to a specific version, when the
vulnerable or broken package isn't a direct dependency and bumping a direct dependency alone can't
change its resolution (e.g. patching `esbuild`, `vite`, or `brace-expansion` pulled in deep inside
someone else's dependency tree).

**When to use it over the alternatives:** reach for `overrides` when the problem is "the wrong
version of a transitive package is being resolved" and there is no direct dependency you can bump
to fix it. If the affected package _is_ a direct dependency, prefer bumping it (or a dependabot
`ignore` rule if bumping currently breaks CI) instead of overriding it.

**File(s) involved:** the `overrides` field in `package.json`.

**Staleness check:** `.github/workflows/npm-overrides-check.yml` (cron `0 8 * * 3`, i.e. weekly on
Wednesday) runs `scripts/check-npm-overrides.mjs`, which drops each override entry one at a time in
a scratch worktree, runs a real `npm install` plus the full quality gate (lint, format check, type
check, test, build), and — if that succeeds — opens or updates a tracking issue labeled
`override-stale` (and `dependencies`).

**Before removing an entry:** the automation only proves that dropping the override still installs
and passes the quality gate **on `main`, in this repo's own CI environment**. That is not proof the
override is safe to remove for every downstream consumer of this library — a different lockfile,
a different platform, or a peer dependency combination the tests here don't exercise could still hit
the original problem. A human should re-read the original justification (check the git blame /
linked issue for why the override was added), confirm the underlying advisory or regression is
actually fixed upstream (not just that CI happens to pass), and only then remove the entry.

## 2. `.github/dependabot.yml` `ignore` rules

**What it's for:** telling dependabot not to keep proposing an update that is currently known to
break the build or tests, so dependabot doesn't spam a PR every week for an update the project can't
take yet.

**When to use it over the alternatives:** reach for a dependabot `ignore` rule when a direct
dependency has a newer version available, but updating to it currently breaks lint/type-check/tests/
build. This is different from `overrides`: an `ignore` rule doesn't change what's currently
installed, it just stops dependabot from re-proposing a version that's known not to work yet.

**File(s) involved:** the `ignore` list under the relevant `updates` entry in
`.github/dependabot.yml`.

**Staleness check:** `.github/workflows/dependabot-ignore-check.yml` (cron `0 8 * * 1`, weekly on
Monday, timed a few hours after dependabot's own weekly run) runs
`scripts/check-dependabot-ignores.mjs`, which installs the ignored target version in a scratch
worktree and runs the full quality gate (`npm ci`, lint, format check, type check, test, build). If
it now succeeds, it opens or updates a tracking issue labeled `dependabot-ignore-stale` (and
`dependencies`).

**Before removing an entry:** as with overrides, "installs and passes CI" only demonstrates the
update works in this repo's own test suite and environment — it doesn't prove the new version is
safe for every consumer of this library or that it doesn't introduce a subtler behavioral change
the tests don't cover. A human should check the dependency's changelog/release notes for the
versions being skipped, confirm there's no remaining known incompatibility, and only then remove the
`ignore` entry (letting dependabot propose the update normally on its next run).

## 3. `audit-ci.jsonc` `allowlist`

**What it's for:** accepting a specific security advisory (by GHSA id) that `npm audit`/`audit-ci`
would otherwise fail the build on, when there's no non-breaking fix available and the advisory has
been assessed as not applicable to how this project actually uses the affected code path.

**When to use it over the alternatives:** reach for an allowlist entry only when neither an
`overrides` entry nor a dependency bump can resolve the advisory (e.g. it's bundled inside a
transitive dependency's own `bundleDependencies`, unreachable via top-level `overrides`) — see the
`GHSA-mh99-v99m-4gvg` entry in `audit-ci.jsonc` for a concrete example. Every entry must include an
inline comment justifying why it's safe to accept and an `expiry` date forcing periodic review.

**File(s) involved:** the `allowlist` array in `audit-ci.jsonc`.

**Staleness check:** `.github/workflows/audit-allowlist-watch.yml` (cron `0 9 * * 1`, weekly on
Monday) runs `npm run audit` (`audit-ci --config ./audit-ci.jsonc`) and checks its output for
`Consider not allowlisting advisory`, which `audit-ci` prints when an allowlisted GHSA id is no
longer matched by the current dependency tree. If found, it opens or updates a tracking issue
labeled `dependencies`.

**Before removing an entry:** this check only confirms the advisory is no longer present in the
resolved dependency tree at the moment the workflow ran — it does not confirm the advisory was fixed
for the reason originally documented in the entry's comment (it could equally mean the vulnerable
package was dropped entirely, or temporarily absent due to an unrelated lockfile change). Per the
review pattern established when this allowlist was hardened (see issues #62/#63), a human should run
`npm run audit` locally, confirm the specific GHSA id is genuinely gone or genuinely unreachable, and
only then delete the entry — don't remove it purely because the weekly check went quiet or a
tracking issue was opened.
