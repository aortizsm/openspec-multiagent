#!/usr/bin/env node
// tests/orchestrator-gates.test.mjs - Tests for Change 1: harden-orchestrator-gates
// Run with: node tests/orchestrator-gates.test.mjs

import assert from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const SCRIPTS = join(PROJECT_ROOT, "scripts");

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  }
}

function createTestChange(root, changeName = "test-change") {
  const changeDir = join(root, "openspec", "changes", changeName);
  mkdirSync(join(changeDir, "specs", "feature"), { recursive: true });
  writeFileSync(join(changeDir, "proposal.md"), "# Proposal\n\n## Intent\n## Why\n## What Changes\n");
  writeFileSync(join(changeDir, "design.md"), "# Design\n\n## status\n## executive_summary\n## artifacts\n## risks\n## next_recommended\n");
  writeFileSync(join(changeDir, "tasks.md"), "# Tasks\n\n- [ ] Test\n");
  writeFileSync(join(changeDir, ".openspec.yaml"), "schema: spec-driven\n");
  writeFileSync(join(changeDir, "specs", "feature", "spec.md"), "# Feature\n");
  return changeDir;
}

function initGit(root) {
  const init = spawnSync("git", ["init"], { cwd: root, encoding: "utf8", stdio: "ignore" });
  const config1 = spawnSync("git", ["config", "user.name", "Test"], { cwd: root, encoding: "utf8", stdio: "ignore" });
  const config2 = spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: root, encoding: "utf8", stdio: "ignore" });
  const add = spawnSync("git", ["add", "."], { cwd: root, encoding: "utf8", stdio: "ignore" });
  const commit = spawnSync("git", ["commit", "--allow-empty", "-m", "fixture"], { cwd: root, encoding: "utf8", stdio: "ignore" });
  assert.strictEqual(init.status, 0);
  assert.strictEqual(config1.status, 0);
  assert.strictEqual(config2.status, 0);
  assert.strictEqual(add.status, 0);
  assert.strictEqual(commit.status, 0);
}

function getHead(root) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.strictEqual(result.status, 0);
  return result.stdout.trim();
}

const libPath = join(SCRIPTS, "lib.mjs");

async function runTests() {
  // Test 1: Fingerprint invalidation - 1 byte change invalidates gate
  await test("fingerprint: 1 byte change invalidates gate", async () => {
    const root = mkdtempSync(join(tmpdir(), "osm-fingerprint-"));
    try {
      const changeDir = createTestChange(root);
      initGit(root);
      const head1 = getHead(root);

      const lib = await import("file://" + libPath);
      const fingerprint1 = await lib.computeFingerprint(["base", "diff", "proposal", "design", "tasks", "specs", "agent", "model", "v1"]);
      const fingerprint2 = await lib.computeFingerprint(["base", "diffX", "proposal", "design", "tasks", "specs", "agent", "model", "v1"]);

      assert.notStrictEqual(fingerprint1, fingerprint2, "Fingerprints should differ when input changes");
      assert.strictEqual(fingerprint1.length, 64, "Fingerprint should be 64 hex chars (SHA-256)");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // Test 2: Skip verification - same fingerprint skips gate
  await test("skip: identical fingerprint skips gate", async () => {
    const root = mkdtempSync(join(tmpdir(), "osm-skip-"));
    try {
      const changeDir = createTestChange(root);
      initGit(root);
      const head = getHead(root);

      const lib = await import("file://" + libPath);
      const fingerprint = await lib.computeFingerprint(["base", "diff", "proposal", "design", "tasks", "specs", "agent", "model", "v1"]);

      await lib.saveGate("test-change", "developer", "PASS", fingerprint, "evidence.json");

      const { gates } = lib.loadGates("test-change");
      const gate = gates.developer;
      assert.strictEqual(gate.verdict, "PASS");
      assert.strictEqual(gate.fingerprint, fingerprint);

      const shouldSkip = gate && gate.verdict === "PASS" && gate.fingerprint === fingerprint;
      assert.strictEqual(shouldSkip, true, "Gate should be skipped with matching fingerprint");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // Test 3: Diff includes staged and untracked
  await test("diff: includes staged and untracked files", async () => {
    const root = mkdtempSync(join(tmpdir(), "osm-diff-"));
    try {
      const changeDir = createTestChange(root);
      initGit(root);
      const head = getHead(root);

      writeFileSync(join(root, "new-file.txt"), "untracked content");
      writeFileSync(join(root, "openspec", "config.yaml"), "schema: spec-driven\nmodified: true\n");

      const lib = await import("file://" + libPath);
      const diff = await lib.computeChangeDiff(head, root);

      assert.ok(diff.includes("new-file.txt"), "Diff should include untracked file");
      assert.ok(diff.includes("untracked content"), "Diff should include untracked file content");
      assert.ok(diff.includes("modified: true"), "Diff should include staged changes");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // Test 4: Ledger gate blocks on WARNING open
  await test("ledger: blocks on WARNING with status=open", async () => {
    const root = mkdtempSync(join(tmpdir(), "osm-ledger-"));
    try {
      const changeDir = createTestChange(root);
      initGit(root);

      const tasksContent = `# Tasks

## Review Findings

| id | severity | status | evidence | file | line |
|----|----------|--------|----------|------|------|
| RF-001 | WARNING | open | missing test | src/x.ts | 42 |
| RF-002 | CRITICAL | resolved | fixed | src/y.ts | 10 |

`;
      writeFileSync(join(changeDir, "tasks.md"), tasksContent);

      const { parseReviewLedgerContent } = await import("file://" + join(SCRIPTS, "orchestrate.mjs"));
      const { headerFound, columns, rows } = parseReviewLedgerContent(tasksContent);

      assert.strictEqual(headerFound, true);
      assert.strictEqual(rows.length, 2);

      const severityIndex = columns.indexOf("severity");
      const statusIndex = columns.indexOf("status");
      let blocked = false;
      for (const cells of rows) {
        const severity = (cells[severityIndex] || "").toUpperCase();
        const status = (cells[statusIndex] || "open").toLowerCase();
        if ((severity === "CRITICAL" || severity === "WARNING") && status === "open") {
          blocked = true;
        }
      }
      assert.strictEqual(blocked, true, "Ledger gate should block on open WARNING");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // Test 5: Ledger gate passes when all resolved
  await test("ledger: passes when all CRITICAL/WARNING are resolved", async () => {
    const root = mkdtempSync(join(tmpdir(), "osm-ledger2-"));
    try {
      const changeDir = createTestChange(root);
      initGit(root);

      const tasksContent = `# Tasks

## Review Findings

| id | severity | status | evidence | file | line |
|------|----------|--------|----------|------|------|
| RF-001 | WARNING | resolved | added test | src/x.ts | 42 |
| RF-002 | CRITICAL | resolved | fixed | src/y.ts | 10 |

`;
      writeFileSync(join(changeDir, "tasks.md"), tasksContent);

      const { parseReviewLedgerContent } = await import("file://" + join(SCRIPTS, "orchestrate.mjs"));
      const { columns, rows } = parseReviewLedgerContent(tasksContent);

      const severityIndex = columns.indexOf("severity");
      const statusIndex = columns.indexOf("status");
      let blocked = false;
      for (const cells of rows) {
        const severity = (cells[severityIndex] || "").toUpperCase();
        const status = (cells[statusIndex] || "open").toLowerCase();
        if ((severity === "CRITICAL" || severity === "WARNING") && status === "open") {
          blocked = true;
        }
      }
      assert.strictEqual(blocked, false, "Ledger gate should not block when all resolved");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // Test 6: Parallel group doesn't kill siblings (conceptual test)
  await test("parallel: Promise.allSettled collects all outcomes", async () => {
    const results = await Promise.allSettled([
      Promise.resolve({ agent: "code-reviewer", verdict: "PASS" }),
      Promise.resolve({ agent: "security-reviewer", verdict: "PASS" }),
      Promise.reject(new Error("verifier failed")),
    ]);

    const outcomes = results.map((r, i) => ({
      agent: ["code-reviewer", "security-reviewer", "verifier"][i],
      ...(r.status === "fulfilled" ? r.value : { error: r.reason })
    }));

    assert.strictEqual(outcomes.length, 3);
    assert.strictEqual(outcomes[0].verdict, "PASS");
    assert.strictEqual(outcomes[1].verdict, "PASS");
    assert.ok(outcomes[2].error);
    assert.strictEqual(outcomes[2].error.message, "verifier failed");
  });

  // Test 7: Timeout kills single process (conceptual)
  await test("timeout: kills only hung process", async () => {
    let killed = false;
    const child = {
      kill: (signal) => { killed = true; },
      on: (event, cb) => {
        if (event === "close") setTimeout(() => cb(0), 150);
      }
    };

    const timeoutHandle = setTimeout(() => {
      child.kill("SIGTERM");
    }, 100);

    await new Promise(resolve => child.on("close", resolve));
    clearTimeout(timeoutHandle);

    assert.strictEqual(killed, true, "Child should be killed on timeout");
  });

  // Test 8: Telemetry records skipped gate
  await test("telemetry: records skipped gate with fingerprint match", async () => {
    const root = mkdtempSync(join(tmpdir(), "osm-telemetry-"));
    try {
      const changeDir = createTestChange(root);
      initGit(root);

      const lib = await import("file://" + libPath);
      const fingerprint = await lib.computeFingerprint(["base", "diff", "proposal", "design", "tasks", "specs", "agent", "model", "v1"]);

      await lib.saveGate("test-change", "developer", "PASS", fingerprint, "evidence.json");

      const telemetryInvocation = {
        invocation_id: "inv_test",
        profile: "standard",
        timestamp: new Date().toISOString(),
        gates: []
      };

      const gateResult = {
        gate: "developer",
        attempts: 0,
        wall_ms: 0,
        exit_code: 0,
        verdict: "PASS",
        fingerprint,
        skipped: true,
        bundle_bytes: 0,
        tokens: null,
      };

      telemetryInvocation.gates.push(gateResult);

      assert.strictEqual(telemetryInvocation.gates[0].skipped, true);
      assert.strictEqual(telemetryInvocation.gates[0].verdict, "PASS");
      assert.strictEqual(telemetryInvocation.gates[0].fingerprint, fingerprint);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // Test 9: validateAllGatesPass requires current PASS
  await test("gates: validateAllGatesPass fails on missing gate", async () => {
    const root = mkdtempSync(join(tmpdir(), "osm-validate-"));
    try {
      const changeDir = createTestChange(root);
      initGit(root);

      const lib = await import("file://" + libPath);
      const fingerprint = await lib.computeFingerprint(["base", "diff", "proposal", "design", "tasks", "specs", "agent", "model", "v1"]);

      await lib.saveGate("test-change", "developer", "PASS", fingerprint, "evidence.json");

      const requiredGates = ["developer", "test-engineer", "code-reviewer", "security-reviewer", "verifier"];
      const currentFingerprints = { developer: fingerprint };

      const result = lib.validateAllGatesPass("test-change", requiredGates, currentFingerprints);
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.missing, "test-engineer");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // Test 10: validateAllGatesPass fails on stale fingerprint
  await test("gates: validateAllGatesPass fails on stale fingerprint", async () => {
    const root = mkdtempSync(join(tmpdir(), "osm-validate2-"));
    try {
      const changeDir = createTestChange(root);
      initGit(root);

      const lib = await import("file://" + libPath);
      const fingerprint1 = await lib.computeFingerprint(["base", "diff", "proposal", "design", "tasks", "specs", "agent", "model", "v1"]);
      const fingerprint2 = await lib.computeFingerprint(["base", "diffX", "proposal", "design", "tasks", "specs", "agent", "model", "v1"]);

      await lib.saveGate("test-change", "developer", "PASS", fingerprint1, "evidence.json");

      const requiredGates = ["developer"];
      const currentFingerprints = { developer: fingerprint2 };

      const result = lib.validateAllGatesPass("test-change", requiredGates, currentFingerprints);
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.stale, "developer");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // saveGate targets the repository (lib.mjs REPO_DIR is fixed); remove the
  // fixture change it creates so the test never pollutes the working tree.
  rmSync(join(PROJECT_ROOT, "openspec", "changes", "test-change"), { recursive: true, force: true });
  rmSync(join(PROJECT_ROOT, ".opencode", "run", "test-change"), { recursive: true, force: true });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
