#!/usr/bin/env node
// tests/context-bundles.test.mjs - Tests for Change 2: role-scoped-context-bundles
// Run with: node tests/context-bundles.test.mjs

import assert from "node:assert";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const SCRIPTS = join(PROJECT_ROOT, "scripts");

const BUNDLE_BUDGET = 60 * 1024;

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

const TMP_CHANGE = "context-bundles-test-tmp";
const changeDir = join(PROJECT_ROOT, "openspec", "changes", TMP_CHANGE);

function writeTempChange() {
  mkdirSync(join(changeDir, "specs", "feature"), { recursive: true });
  writeFileSync(join(changeDir, "proposal.md"), "# Proposal\n\n## Intent\n## Why\n## What Changes\n");
  writeFileSync(
    join(changeDir, "design.md"),
    "# Design\n\n## status\nproposed\n\n## executive_summary\nSummary line.\n\n## artifacts\n- a.ts\n\n## risks\n- risk one\n\n## next_recommended\nDo the thing.\n\n## Rationale\nThis section must NOT appear in the developer bundle.\n",
  );
  writeFileSync(
    join(changeDir, "tasks.md"),
    [
      "# Tasks",
      "",
      "## Coverage Map",
      "",
      "| Scenario | Test File | Test Case | Status |",
      "|----------|-----------|-----------|--------|",
      "| login works | auth.test.ts | logs in | covered |",
      "| login fails | auth.test.ts | rejects | covered |",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(changeDir, "specs", "feature", "spec.md"),
    [
      "# Spec Delta",
      "",
      "## ADDED Requirements",
      "",
      "### Requirement: Login",
      "The system MUST allow login.",
      "",
      "#### Scenario: login works",
      "- **WHEN** valid credentials are sent",
      "- **THEN** a session is created",
      "",
      "#### Scenario: login authentication rejects bad password",
      "- **WHEN** the password is wrong",
      "- **THEN** the request is denied",
      "",
    ].join("\n"),
  );
}

function cleanupTempChange() {
  rmSync(changeDir, { recursive: true, force: true });
  rmSync(join(PROJECT_ROOT, ".opencode", "run", TMP_CHANGE), { recursive: true, force: true });
}

function makeLargeDiff(files) {
  const chunks = [];
  for (let i = 0; i < files; i += 1) {
    chunks.push(`diff --git a/src/file${i}.ts b/src/file${i}.ts`);
    for (let j = 0; j < 200; j += 1) {
      chunks.push(`+ line ${j} of file ${i} ${"x".repeat(60)}`);
    }
  }
  return chunks.join("\n");
}

async function runTests() {
  writeTempChange();
  try {
    const lib = await import("file://" + join(SCRIPTS, "lib.mjs"));

    await test("developer bundle: includes tasks/specs/design decisions, excludes design body", async () => {
      const bundle = lib.buildDeveloperBundle(TMP_CHANGE, "", []);
      assert.ok(bundle.includes("tasks.md"), "should include tasks.md");
      assert.ok(bundle.includes("Coverage Map"), "should include tasks content");
      assert.ok(bundle.includes("executive_summary"), "should include design decisions");
      assert.ok(bundle.includes("Summary line."), "should include design decision content");
      assert.ok(!bundle.includes("Rationale"), "should exclude non-decision design sections");
      assert.ok(bundle.includes("#### Scenario: login works"), "should include spec scenarios");
      assert.ok(Buffer.byteLength(bundle, "utf8") <= BUNDLE_BUDGET, "bundle must be <= 60 KB");
    });

    await test("developer bundle: includes scout cache and previous findings", async () => {
      const bundle = lib.buildDeveloperBundle(TMP_CHANGE, "SCOUT-CACHE-MARKER", [{ id: "RF-001" }]);
      assert.ok(bundle.includes("SCOUT-CACHE-MARKER"), "should include scout cache");
      assert.ok(bundle.includes("RF-001"), "should include previous findings");
    });

    await test("test-engineer bundle: includes scenarios and coverage map", async () => {
      const bundle = lib.buildTestEngineerBundle(TMP_CHANGE, "TEST-CONVENTIONS-MARKER");
      assert.ok(bundle.includes("#### Scenario: login works"), "should include scenarios");
      assert.ok(bundle.includes("coverage map"), "should include coverage map section");
      assert.ok(bundle.includes("allCovered"), "should include parsed coverage result");
      assert.ok(bundle.includes("TEST-CONVENTIONS-MARKER"), "should include test conventions");
      assert.ok(Buffer.byteLength(bundle, "utf8") <= BUNDLE_BUDGET, "bundle must be <= 60 KB");
    });

    await test("code-reviewer bundle: includes diff, scenarios, clean-code criteria", async () => {
      const bundle = lib.buildCodeReviewerBundle(TMP_CHANGE, "diff --git a/x b/x\n+change", "#### Scenario: login works");
      assert.ok(bundle.includes("diff --git"), "should include the diff");
      assert.ok(bundle.includes("#### Scenario: login works"), "should include scenarios");
      assert.ok(bundle.includes("clean-code criteria"), "should include clean-code criteria heading");
      assert.ok(bundle.includes("Prohibited names"), "should include the 12 rules");
    });

    await test("security-reviewer bundle: includes security criteria and relevant scenarios", async () => {
      const scenarios = "#### Scenario: login authentication rejects bad password\n#### Scenario: unrelated cosmetic thing";
      const bundle = lib.buildSecurityReviewerBundle(TMP_CHANGE, "diff --git a/x b/x\n+change", scenarios);
      assert.ok(bundle.includes("security criteria"), "should include security criteria heading");
      assert.ok(bundle.includes("SQL injection prevention"), "should include the 12 security rules");
      assert.ok(bundle.includes("login authentication"), "should include auth-relevant scenario");
      assert.ok(!bundle.includes("unrelated cosmetic"), "should exclude non-security scenario");
    });

    await test("verifier bundle: includes scenarios, commands, diff stat", async () => {
      const scoutCache = "# Repo\n- test: npm test\n- build: npm run build\n- unrelated note";
      const bundle = lib.buildVerifierBundle(TMP_CHANGE, "diff --git a/x b/x\n+1", "#### Scenario: login works", scoutCache);
      assert.ok(bundle.includes("#### Scenario: login works"), "should include scenarios");
      assert.ok(bundle.includes("project commands"), "should include commands section");
      assert.ok(bundle.includes("npm test"), "should include the test command");
    });

    await test("large diff: summarized and kept within 60 KB", async () => {
      const hugeDiff = makeLargeDiff(400);
      assert.ok(hugeDiff.length > BUNDLE_BUDGET, "fixture diff should exceed the budget");
      const bundle = lib.buildCodeReviewerBundle(TMP_CHANGE, hugeDiff, "#### Scenario: login works");
      assert.ok(Buffer.byteLength(bundle, "utf8") <= BUNDLE_BUDGET, "summarized bundle must be <= 60 KB");
      assert.ok(bundle.includes("DIFF SUMMARY"), "should include the summary marker");
      assert.ok(bundle.includes("diff full path"), "should include the full diff path for on-demand read");
    });

    await test("buildAgentBundle: dispatches role-specific bundles", async () => {
      const developerBundle = lib.buildAgentBundle(TMP_CHANGE, "developer");
      const reviewerBundle = lib.buildAgentBundle(TMP_CHANGE, "code-reviewer");
      assert.ok(developerBundle.includes("tasks.md"), "developer bundle should include tasks");
      assert.ok(reviewerBundle.includes("clean-code criteria"), "reviewer bundle should include criteria");
      assert.notStrictEqual(developerBundle, reviewerBundle, "bundles must differ by role");
    });

    await test("scout cache: write/read round-trip keyed by HEAD", async () => {
      const head = "testhead0001";
      assert.strictEqual(lib.readScoutCache(head), null, "cache should be empty before write");
      lib.writeScoutCache(head, "SCOUT DATA");
      assert.strictEqual(lib.readScoutCache(head), "SCOUT DATA");
      rmSync(join(PROJECT_ROOT, ".opencode", "cache", `scout-${head}.md`), { force: true });
    });

    await test("verdict: write/read round-trip", async () => {
      const verdict = {
        agent: "code-reviewer",
        verdict: "PASS",
        findings: [{ id: "RF-001", severity: "SUGGESTION", status: "open", evidence: "nit" }],
        summary: "ok",
      };
      lib.writeVerdict(TMP_CHANGE, "code-reviewer", verdict);
      const readVerdict = lib.readVerdict(TMP_CHANGE, "code-reviewer");
      assert.deepStrictEqual(readVerdict, verdict);
    });
  } finally {
    cleanupTempChange();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
