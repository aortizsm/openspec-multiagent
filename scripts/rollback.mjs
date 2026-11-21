#!/usr/bin/env node

import { execSync, execFileSync } from 'node:child_process';

const REPO_ROOT = process.cwd();

function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: REPO_ROOT,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function ensureGitRepo() {
  if (!isGitRepo()) {
    console.error('Error: not inside a git repository');
    process.exit(1);
  }
}

function validatePhaseName(phaseName) {
  if (!/^[a-z0-9_-]+$/.test(phaseName)) {
    throw new Error(
      'Invalid phase name "' +
        phaseName +
        '": only lowercase letters, digits, hyphens and underscores are allowed'
    );
  }
}

function saveCheckpoint(phaseName) {
  validatePhaseName(phaseName);
  ensureGitRepo();
  const output = execFileSync(
    'git',
    ['commit', '--allow-empty', '-m', 'rollback: checkpoint before ' + phaseName],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }
  );
  const match = output.match(/\[([a-f0-9]+)/);
  return match ? match[1] : null;
}

function rollbackToCheckpoint() {
  ensureGitRepo();
  const log = execSync(
    'git log --format="%H %s" --grep="rollback: checkpoint before"',
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }
  );
  const lines = log.trim().split('\n').filter(Boolean);
  if (lines.length === 0) {
    console.error('Error: no rollback checkpoint found');
    process.exit(1);
  }
  const hash = lines[0].split(' ')[0];
  execSync('git reset --hard ' + hash, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  return hash;
}

/** Save implementation checkpoint for a specific agent (developer, test-engineer). */
function saveImplementationCheckpoint(agent) {
  validatePhaseName(agent);
  ensureGitRepo();
  const output = execFileSync(
    'git',
    ['commit', '--allow-empty', '-m', `rollback: impl checkpoint before ${agent}`],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }
  );
  const match = output.match(/\[([a-f0-9]+)/);
  return match ? match[1] : null;
}

/** Rollback to implementation checkpoint for a specific agent. */
function rollbackImplementation(agent) {
  ensureGitRepo();
  const log = execSync(
    `git log --format="%H %s" --grep="rollback: impl checkpoint before ${agent}"`,
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }
  );
  const lines = log.trim().split('\n').filter(Boolean);
  if (lines.length === 0) {
    console.error(`Error: no implementation checkpoint found for ${agent}`);
    process.exit(1);
  }
  const hash = lines[0].split(' ')[0];
  execSync('git reset --hard ' + hash, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  return hash;
}

/** No-op checkpoint for read-only agents (reviewers, verifier). */
function noopCheckpoint() {
  return 'noop';
}

/** No-op rollback for read-only agents. */
function noopRollback() {
  return 'noop';
}

const [command, phase] = process.argv.slice(2);

if (import.meta.main) {
  if (command === 'save') {
    if (!phase) {
      console.error('Error: phase name required');
      process.exit(1);
    }
    saveCheckpoint(phase);
  } else if (command === 'rollback') {
    rollbackToCheckpoint();
  } else if (command === 'save-impl') {
    if (!phase) {
      console.error('Error: agent name required');
      process.exit(1);
    }
    saveImplementationCheckpoint(phase);
  } else if (command === 'rollback-impl') {
    if (!phase) {
      console.error('Error: agent name required');
      process.exit(1);
    }
    rollbackImplementation(phase);
  } else {
    console.error('Usage: node scripts/rollback.mjs <save|rollback|save-impl|rollback-impl> [phase]');
    process.exit(1);
  }
}

export { saveCheckpoint, rollbackToCheckpoint, saveImplementationCheckpoint, rollbackImplementation, noopCheckpoint, noopRollback };
