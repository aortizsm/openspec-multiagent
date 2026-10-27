#!/usr/bin/env node
// tests/mock-child-process.mjs - Mock of node:child_process for rollback tests.
// Redirects `git commit`/`git reset` shell strings to recorded calls so tests
// can assert on the checkpoint message format without running real git.

export const calls = [];

export function execSync(command, options = {}) {
  calls.push({ kind: "execSync", command, options });
  return "[deadbeef99] rollback: checkpoint before fase\n";
}

export function execFileSync(file, args, options = {}) {
  calls.push({ kind: "execFileSync", file, args, options });
  return "[deadbeef99] rollback: checkpoint before fase\n";
}

export function spawnSync() {
  return { status: 0, stdout: "", stderr: "" };
}
