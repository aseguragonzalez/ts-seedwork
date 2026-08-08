#!/usr/bin/env node
// Tries dropping each `package.json` npm `overrides` entry one at a time. If a
// real `npm install` without that override, followed by the quality gate,
// still succeeds, opens (or leaves alone, if one is already open) a tracking
// issue so a human can decide whether the override is safe to remove. Never
// fails the workflow just because an override is still justified — that is
// the expected, steady-state result.

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, 'package.json');

const QUALITY_STEPS = [
  ['npm', ['install']],
  ['npm', ['run', 'audit']],
  ['npm', ['run', 'lint']],
  ['npm', ['run', 'format:check']],
  ['npm', ['run', 'type:check']],
  ['npm', ['run', 'test:coverage']],
  ['npm', ['run', 'build']],
];

const MAX_BUFFER = 100 * 1024 * 1024;

function sh(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe', maxBuffer: MAX_BUFFER });
}

function readOverrideEntries() {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return pkg.overrides ?? {};
}

function latestVersionOf(name) {
  return sh('npm', ['view', name, 'version']).trim();
}

function attemptWithoutOverride(name) {
  const worktree = mkdtempSync(path.join(tmpdir(), 'npm-override-'));
  try {
    sh('git', ['worktree', 'add', '--detach', worktree, 'HEAD'], repoRoot);
    try {
      const pkgPath = path.join(worktree, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      delete pkg.overrides[name];
      if (Object.keys(pkg.overrides).length === 0) {
        delete pkg.overrides;
      }
      writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    } catch (error) {
      return { passed: false, step: 'rewrite package.json', log: tail(error) };
    }
    for (const [cmd, args] of QUALITY_STEPS) {
      try {
        sh(cmd, args, worktree);
      } catch (error) {
        return { passed: false, step: `${cmd} ${args.join(' ')}`, log: tail(error) };
      }
    }
    return { passed: true };
  } finally {
    try {
      sh('git', ['worktree', 'remove', '--force', worktree], repoRoot);
    } catch {
      rmSync(worktree, { recursive: true, force: true });
    }
  }
}

function tail(error) {
  const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.trim();
  return output.split('\n').slice(-40).join('\n');
}

async function findOpenIssue(repo, token, dependencyName) {
  const query = encodeURIComponent(`repo:${repo} is:issue is:open label:override-stale in:title "${dependencyName}"`);
  const response = await fetch(`https://api.github.com/search/issues?q=${query}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) {
    throw new Error(`GitHub search failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  return body.total_count > 0 ? body.items[0] : null;
}

async function openIssue(repo, token, { dependencyName, currentOverride, latestVersion, runUrl }) {
  const title = `chore(deps): npm override for ${dependencyName} may be stale`;
  const body = [
    `Dropping the \`overrides\` entry for \`${dependencyName}\` (currently pinned to ` +
      `\`${currentOverride}\`, latest available is \`${latestVersion}\`) and running a real ` +
      '`npm install` followed by the full quality gate (audit, lint, format check, type check, ' +
      'test, build) succeeded.',
    '',
    "This suggests the condition that originally justified this entry in `package.json`'s " +
      '`overrides` (regression, vulnerability, or peer conflict) may no longer apply.',
    '',
    '**A human should still confirm before removing the override** — this check only proves the ' +
      'default resolution installs and passes CI on `main`, not that it is safe for every consumer ' +
      'of this library.',
    '',
    `Workflow run: ${runUrl}`,
  ].join('\n');

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels: ['dependencies', 'override-stale'] }),
  });
  if (!response.ok) {
    throw new Error(`GitHub issue creation failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function appendSummary(line) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    appendFileSync(summaryPath, `${line}\n`);
  } else {
    console.log(line);
  }
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  const runUrl = `${process.env.GITHUB_SERVER_URL}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;

  const entries = readOverrideEntries();
  appendSummary('## npm overrides staleness check\n');
  appendSummary('| Package | Override | Latest | Result |');
  appendSummary('| --- | --- | --- | --- |');

  for (const [name, override] of Object.entries(entries)) {
    const latest = latestVersionOf(name);

    console.log(`Testing ${name} without its override (currently ${override}, latest ${latest})...`);
    const result = attemptWithoutOverride(name);

    if (!result.passed) {
      appendSummary(`| ${name} | ${override} | ${latest} | still needed (failed at \`${result.step}\`) |`);
      console.log(result.log);
      continue;
    }

    appendSummary(`| ${name} | ${override} | ${latest} | ✅ removable — see tracking issue |`);

    if (!repo || !token) {
      console.log('GITHUB_REPOSITORY/GITHUB_TOKEN not set, skipping issue creation.');
      continue;
    }

    const existing = await findOpenIssue(repo, token, name);
    if (existing) {
      console.log(`Tracking issue already open for ${name}: ${existing.html_url}`);
      continue;
    }

    const issue = await openIssue(repo, token, {
      dependencyName: name,
      currentOverride: override,
      latestVersion: latest,
      runUrl,
    });
    console.log(`Opened tracking issue for ${name}: ${issue.html_url}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
