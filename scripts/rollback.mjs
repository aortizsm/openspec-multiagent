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
  } else {
    console.error('Usage: node scripts/rollback.mjs <save|rollback> [phase]');
    process.exit(1);
  }
}

export { saveCheckpoint, rollbackToCheckpoint };
