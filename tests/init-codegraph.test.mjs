#!/usr/bin/env node
// tests/init-codegraph.test.mjs - Unit and integration tests for the CodeGraph
// mandatory step in scripts/init.mjs.
//   node tests/init-codegraph.test.mjs

import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SCRIPTS = join(process.cwd(), "scripts");
const INIT_SRC = readFileSync(join(SCRIPTS, "init.mjs"), "utf8");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  }
}

function run(script, args = [], env = {}) {
  return spawnSync("node", [join(SCRIPTS, script), ...args], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

// =============================================================================
// Unit tests — source-level assertions on scripts/init.mjs
// =============================================================================

// 1. TOTAL_STEPS is 6 (not 5)
test("init.mjs: TOTAL_STEPS is 6 (not 5)", () => {
  assert.ok(
    INIT_SRC.includes("const TOTAL_STEPS = 6;"),
    "expected 'const TOTAL_STEPS = 6;' in init.mjs",
  );
  assert.ok(
    !INIT_SRC.includes("const TOTAL_STEPS = 5;"),
    "TOTAL_STEPS must not be 5",
  );
});

// 2. Step 3 is "CodeGraph MCP server"
test("init.mjs: step 3 is 'CodeGraph MCP server'", () => {
  assert.ok(
    INIT_SRC.includes('step(3, TOTAL_STEPS, "CodeGraph MCP server");'),
    "step 3 must be 'CodeGraph MCP server'",
  );
});

// 3. installCodeGraph exists and is async
test("init.mjs: installCodeGraph is declared as async function", () => {
  assert.ok(
    INIT_SRC.includes("async function installCodeGraph()"),
    "installCodeGraph must be declared as async function",
  );
});

// 4. npm install -g @colbymchenry/codegraph when codegraph not on PATH
test("init.mjs: attempts global npm install when codegraph missing on PATH", () => {
  assert.ok(
    INIT_SRC.includes('["install", "-g", "@colbymchenry/codegraph"]'),
    "must run 'npm install -g @colbymchenry/codegraph'",
  );
  assert.ok(
    INIT_SRC.includes("codegraph not found on PATH; installing globally..."),
    "must inform user when installing globally",
  );
});

// 5. codegraph install --target=opencode --location=global --yes
test("init.mjs: wires CodeGraph with --target=opencode --location=global --yes", () => {
  assert.ok(
    INIT_SRC.includes('["install", "--target=opencode", "--location=global", "--yes"]'),
    "must wire CodeGraph to OpenCode",
  );
});

// 6. process.exit(1) when CodeGraph wiring fails
test("init.mjs: exits with code 1 when CodeGraph wiring fails", () => {
  assert.ok(
    INIT_SRC.includes("Command failed:"),
    "must report command failure via spawnCommand error message",
  );
  assert.ok(
    INIT_SRC.includes("process.exit(1)"),
    "must call process.exit(1) on failure",
  );
});

// 7. Step numbering: Context7=4, Engram=5, Verification=6
test("init.mjs: Context7 MCP server is step 4", () => {
  assert.ok(
    INIT_SRC.includes('step(4, TOTAL_STEPS, "Context7 MCP server");'),
    "Context7 must be step 4",
  );
});

test("init.mjs: Engram MCP server is step 5", () => {
  assert.ok(
    INIT_SRC.includes('step(5, TOTAL_STEPS, "Engram MCP server");'),
    "Engram must be step 5",
  );
});

test("init.mjs: Verification is step 6", () => {
  assert.ok(
    INIT_SRC.includes('step(6, TOTAL_STEPS, "Verification");'),
    "Verification must be step 6",
  );
});

// Wizard header documents 6 steps
test("init.mjs: header documents Wizard steps (6)", () => {
  assert.ok(
    INIT_SRC.includes("// Wizard steps (6):"),
    "header comment must say Wizard steps (6)",
  );
  assert.ok(
    INIT_SRC.includes("//   3. CodeGraph MCP server  — mandatory"),
    "header must list CodeGraph as step 3 (mandatory)",
  );
});

// =============================================================================
// Integration tests — run init.mjs as a subprocess
// =============================================================================

test("init.mjs --help exits 0 and mentions the command", () => {
  const r = run("init.mjs", ["--help"]);
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}: ${r.stderr}`);
  assert.ok(r.stdout.includes("openspec-multiagent init"), "help must mention the command");
  assert.ok(r.stdout.includes("--dry-run"), "help should list --dry-run option");
  assert.ok(r.stdout.includes("Wizard steps (6):"), "help should document 6 wizard steps");
  assert.ok(r.stdout.includes("CodeGraph MCP server"), "help should mention CodeGraph step");
});

test("init.mjs --dry-run --skip-openspec-init prints CodeGraph step header", () => {
  const r = run("init.mjs", ["--dry-run", "--skip-openspec-init"]);
  // The CodeGraph step may fail in environments without npm/codegraph on PATH
  // (preexisting env limitation, see tasks.md item 6). We only assert the step
  // header is printed before any failure.
  const combined = r.stdout + r.stderr;
  assert.ok(
    combined.includes("[3/6] CodeGraph MCP server"),
    "step 3 header '[3/6] CodeGraph MCP server' must be printed",
  );
});

// =============================================================================
// Summary
// =============================================================================

console.log("");
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
