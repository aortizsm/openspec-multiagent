#!/usr/bin/env node
// tests/pipeline-profiles.test.mjs - Tests for Change 3: adaptive-pipeline-profiles
// Run with: node tests/pipeline-profiles.test.mjs

import assert from "node:assert";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
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
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  \u2717 ${name}`);
    console.log(`      ${err.message}`);
  }
}

const TMP_CHANGE = "profiles-test-tmp";
const changeDir = join(PROJECT_ROOT, "openspec", "changes", TMP_CHANGE);

function writeTempChange(pipelineLine) {
  rmSync(changeDir, { recursive: true, force: true });
  mkdirSync(join(changeDir, "specs", "feature"), { recursive: true });
  writeFileSync(join(changeDir, "proposal.md"), "# Proposal\n\n## Intent\n## Why\n## What Changes\n");
  writeFileSync(
    join(changeDir, "design.md"),
    "# Design\n\n## status\nproposed\n\n## executive_summary\nx\n\n## artifacts\n- a\n\n## risks\n- r\n\n## next_recommended\nn\n",
  );
  writeFileSync(join(changeDir, "tasks.md"), "# Tasks\n\n- [ ] t\n");
  writeFileSync(join(changeDir, "specs", "feature", "spec.md"), "# Spec Delta\n\n## ADDED Requirements\n\n### Requirement: R\nThe system MUST work.\n\n#### Scenario: s\n- **WHEN** x\n- **THEN** y\n");
  writeFileSync(join(changeDir, ".openspec.yaml"), `schema: spec-driven\nx-correction_rounds: 3\n${pipelineLine}\n`);
}

function cleanupTempChange() {
  rmSync(changeDir, { recursive: true, force: true });
  rmSync(join(PROJECT_ROOT, ".opencode", "run", TMP_CHANGE), { recursive: true, force: true });
}

function runDryRun() {
  const result = spawnSync("node", [join(SCRIPTS, "orchestrate.mjs"), TMP_CHANGE, "--dry-run"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  return result;
}

async function runTests() {
  try {
    const lib = await import("file://" + join(SCRIPTS, "lib.mjs"));

    // 1. Default profile is standard when no pipeline key is declared.
    await test("default profile: standard DAG when no pipeline key", async () => {
      writeTempChange("");
      const result = runDryRun();
      assert.strictEqual(result.status, 0, result.stderr);
      assert.ok(result.stdout.includes("profile: standard"), "should report standard");
      assert.ok(result.stdout.includes("2. test-engineer (sequential)"), "standard runs test-engineer");
      assert.ok(result.stdout.includes("code-reviewer ∥ security-reviewer ∥ verifier"), "full parallel group");
    });

    // 2. Lite profile runs developer -> code-reviewer(unified) -> verifier.
    await test("lite profile: developer -> code-reviewer(unified) -> verifier, no security-reviewer", async () => {
      writeTempChange("x-pipeline: lite");
      const result = runDryRun();
      assert.strictEqual(result.status, 0, result.stderr);
      assert.ok(result.stdout.includes("profile: lite"), "should report lite");
      assert.ok(result.stdout.includes("developer (sequential)"), "lite includes developer");
      assert.ok(result.stdout.includes("code-reviewer (unified clean-code + security)"), "unified reviewer");
      assert.ok(!result.stdout.includes("security-reviewer"), "lite must not run security-reviewer");
      assert.ok(!result.stdout.includes("test-engineer"), "lite must not run test-engineer");
    });

    // 3. Strict profile keeps the full DAG.
    await test("strict profile: full DAG", async () => {
      writeTempChange("x-pipeline: strict");
      const result = runDryRun();
      assert.strictEqual(result.status, 0, result.stderr);
      assert.ok(result.stdout.includes("profile: strict"), "should report strict");
      assert.ok(result.stdout.includes("2. test-engineer (sequential)"), "strict runs test-engineer");
      assert.ok(result.stdout.includes("code-reviewer ∥ security-reviewer ∥ verifier"), "full parallel group");
    });

    // 4. Risk diff escalates standard -> strict.
    await test("risk escalation: standard + risk diff -> strict", async () => {
      const riskDiff = "diff --git a/src/auth/login.ts b/src/auth/login.ts\n+code";
      assert.strictEqual(lib.getEffectiveProfile("standard", riskDiff), "strict");
    });

    // 5. Strict stays strict on a risk diff.
    await test("risk escalation: strict stays strict", async () => {
      const riskDiff = "diff --git a/db/migrations/001.sql b/db/migrations/001.sql\n+code";
      assert.strictEqual(lib.getEffectiveProfile("strict", riskDiff), "strict");
    });

    // 6. Lite + risk diff is a hard error with the exact message.
    await test("risk escalation: lite + risk diff is a hard error", async () => {
      const riskDiff = "diff --git a/src/auth/login.ts b/src/auth/login.ts\n+code";
      assert.throws(
        () => lib.getEffectiveProfile("lite", riskDiff),
        /lite profile prohibited for changes touching risk paths: .*\. Use standard or strict\./,
      );
    });

    // 7. No risk diff leaves the profile unchanged.
    await test("risk escalation: non-risk diff leaves the profile unchanged", async () => {
      const safeDiff = "diff --git a/docs/readme.md b/docs/readme.md\n+text";
      assert.strictEqual(lib.getEffectiveProfile("standard", safeDiff), "standard");
      assert.strictEqual(lib.matchRiskGlobs(safeDiff), false);
    });

    // 8. matchedRiskGlobs reports the globs that matched.
    await test("risk globs: matcher reports matching globs", async () => {
      const diff = "diff --git a/src/auth/login.ts b/src/auth/login.ts\n+x\ndiff --git a/db/migrations/1.sql b/db/migrations/1.sql\n+y";
      const matched = lib.matchedRiskGlobs(diff);
      assert.ok(matched.includes("**/auth/**"), "should match auth glob");
      assert.ok(matched.includes("**/*.sql"), "should match sql glob");
    });

    // 9. Configurable risk globs replace the defaults.
    await test("risk globs: custom globs are honoured", async () => {
      const diff = "diff --git a/custom/path/x.ts b/custom/path/x.ts\n+y";
      assert.strictEqual(lib.getEffectiveProfile("standard", diff, ["**/custom/**"]), "strict");
      assert.strictEqual(lib.getEffectiveProfile("standard", diff, ["**/auth/**"]), "standard");
    });

    // 10. Coverage map all covered -> allCovered true.
    await test("coverage map: full coverage reported", async () => {
      const table = "| Scenario | Test File | Test Case | Status |\n|--|--|--|--|\n| a | a.test.ts | t | covered |\n| b | b.test.ts | t | covered |\n";
      const coverage = lib.parseCoverageMap(table);
      assert.strictEqual(coverage.found, true);
      assert.strictEqual(coverage.allCovered, true);
      assert.strictEqual(coverage.covered, 2);
    });

    // 11. Coverage map with a gap.
    await test("coverage map: gap detected", async () => {
      const table = "| Scenario | Test File | Test Case | Status |\n|--|--|--|--|\n| a | a.test.ts | t | covered |\n| b |  |  | missing |\n";
      const coverage = lib.parseCoverageMap(table);
      assert.strictEqual(coverage.found, true);
      assert.strictEqual(coverage.allCovered, false);
      assert.deepStrictEqual(coverage.gaps, ["b"]);
    });

    // 12. Coverage map absent -> not found, not allCovered (fail-safe).
    await test("coverage map: absent table is not treated as covered", async () => {
      const coverage = lib.parseCoverageMap("# Tasks\n\n- [ ] nothing here\n");
      assert.strictEqual(coverage.found, false);
      assert.strictEqual(coverage.allCovered, false);
    });
  } finally {
    cleanupTempChange();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
