#!/usr/bin/env node
// Tries the update each `.github/dependabot.yml` npm `ignore` entry currently
// blocks. If a real `npm install` + the quality gate now succeeds, opens (or
// leaves alone, if one is already open) a tracking issue so a human can
// decide whether the ignore rule is safe to remove. Never fails the workflow
// just because an ignore rule is still justified — that is the expected,
// steady-state result.

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const dependabotPath = path.join(repoRoot, '.github/dependabot.yml');
const lockPath = path.join(repoRoot, 'package-lock.json');

const QUALITY_STEPS = [
  ['npm', ['ci']],
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

function readIgnoreEntries() {
  const json = sh('yq', [
    '-o=json',
    '.updates[] | select(.["package-ecosystem"] == "npm") | .ignore // []',
    dependabotPath,
  ]);
  return JSON.parse(json);
}

function currentVersionOf(name) {
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  const entry = lock.packages?.[`node_modules/${name}`];
  if (!entry?.version) {
    throw new Error(`${name} not found in package-lock.json`);
  }
  return entry.version;
}

function latestVersionOf(name) {
  return sh('npm', ['view', name, 'version']).trim();
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

function bumpType(current, target) {
  const c = parseVersion(current);
  const t = parseVersion(target);
  if (t.major !== c.major) {
    return 'major';
  }
  if (t.minor !== c.minor) {
    return 'minor';
  }
  if (t.patch !== c.patch) {
    return 'patch';
  }
  return 'none';
}

function isBlockedByIgnore(entry, bump) {
  if (bump === 'none') {
    return false;
  }
  const types = entry['update-types'];
  if (!types || types.length === 0) {
    return true;
  }
  return types.some(type => type.endsWith(`:semver-${bump}`));
}

function attemptUpdate(name, targetVersion) {
  const worktree = mkdtempSync(path.join(tmpdir(), 'dependabot-ignore-'));
  try {
    sh('git', ['worktree', 'add', '--detach', worktree, 'HEAD'], repoRoot);
    try {
      sh('npm', ['install', `${name}@${targetVersion}`], worktree);
    } catch (error) {
      return { passed: false, step: 'npm install', log: tail(error) };
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
  const query = encodeURIComponent(
    `repo:${repo} is:issue is:open label:dependabot-ignore-stale in:title "${dependencyName}"`
  );
  const response = await fetch(`https://api.github.com/search/issues?q=${query}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) {
    throw new Error(`GitHub search failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  return body.total_count > 0 ? body.items[0] : null;
}

async function openIssue(repo, token, { dependencyName, currentVersion, targetVersion, runUrl }) {
  const title = `chore(deps): dependabot ignore rule for ${dependencyName} may be stale`;
  const body = [
    `A real \`npm install ${dependencyName}@${targetVersion}\` followed by the full quality gate ` +
      `(\`npm ci\`, lint, format check, type check, test, build) succeeded against the currently ` +
      `ignored update, from ${currentVersion} to ${targetVersion}.`,
    '',
    'This suggests the condition that originally justified the `ignore` entry in ' +
      '`.github/dependabot.yml` for this dependency no longer holds.',
    '',
    '**A human should still confirm before removing the ignore rule** — this check only proves ' +
      'the update installs and passes CI on `main`, not that it is safe for every consumer of this ' +
      'library.',
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
    body: JSON.stringify({ title, body, labels: ['dependencies', 'dependabot-ignore-stale'] }),
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

  const entries = readIgnoreEntries();
  appendSummary('## Dependabot ignore staleness check\n');
  appendSummary('| Dependency | Current | Latest | Result |');
  appendSummary('| --- | --- | --- | --- |');

  for (const entry of entries) {
    const name = entry['dependency-name'];
    const current = currentVersionOf(name);
    const latest = latestVersionOf(name);
    const bump = bumpType(current, latest);

    if (!isBlockedByIgnore(entry, bump)) {
      appendSummary(`| ${name} | ${current} | ${latest} | not currently blocked |`);
      continue;
    }

    console.log(`Testing ${name} ${current} -> ${latest} (${bump} bump, currently ignored)...`);
    const result = attemptUpdate(name, latest);

    if (!result.passed) {
      appendSummary(`| ${name} | ${current} | ${latest} | still blocked (failed at \`${result.step}\`) |`);
      console.log(result.log);
      continue;
    }

    appendSummary(`| ${name} | ${current} | ${latest} | ✅ now succeeds — see tracking issue |`);

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
      currentVersion: current,
      targetVersion: latest,
      runUrl,
    });
    console.log(`Opened tracking issue for ${name}: ${issue.html_url}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
