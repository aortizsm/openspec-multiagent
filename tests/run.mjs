#!/usr/bin/env node
// tests/run.mjs - Test suite for the openspec-multiagent installer.
// Runs with plain Node (no third-party dependencies).
//
//   node tests/run.mjs
//   npm run test

import assert from "node:assert";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  parseArgs,
  versionAtLeast,
} from "../scripts/lib.mjs";

const SCRIPTS = join(process.cwd(), "scripts");

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

// ---------------------------------------------------------------------------
// 1. Syntax check of every script
// ---------------------------------------------------------------------------
test("all scripts pass node --check", () => {
  const files = readdirSync(SCRIPTS).filter((f) => f.endsWith(".mjs"));
  for (const file of files) {
    const r = spawnSync("node", ["--check", join(SCRIPTS, file)], {
      encoding: "utf8",
    });
    assert.strictEqual(r.status, 0, `${file}: ${r.stderr}`);
  }
});

// ---------------------------------------------------------------------------
// 2. lib.mjs helpers
// ---------------------------------------------------------------------------
test("parseArgs: --key=value", () => {
  const { flags, values } = parseArgs(["--context7=remote", "--api-key=abc"]);
  assert.strictEqual(values.get("context7"), "remote");
  assert.strictEqual(values.get("api-key"), "abc");
});

test("parseArgs: --key value", () => {
  const { values } = parseArgs(["--context7", "remote"]);
  assert.strictEqual(values.get("context7"), "remote");
});

test("parseArgs: boolean flags", () => {
  const { flags } = parseArgs(["--local", "--dry-run", "--help"]);
  assert.ok(flags.has("local"));
  assert.ok(flags.has("dry-run"));
  assert.ok(flags.has("help"));
});

test("versionAtLeast: equal", () => {
  assert.ok(versionAtLeast([1, 14, 0], [1, 14, 0]));
});

test("versionAtLeast: greater minor", () => {
  assert.ok(versionAtLeast([1, 15, 0], [1, 14, 0]));
});

test("versionAtLeast: lower major", () => {
  assert.ok(!versionAtLeast([1, 14, 0], [2, 0, 0]));
});

test("versionAtLeast: equal major lower minor", () => {
  assert.ok(!versionAtLeast([1, 13, 0], [1, 14, 0]));
});

// ---------------------------------------------------------------------------
// 3. install-context7.mjs --print (no file writes)
// ---------------------------------------------------------------------------
test("install-context7 --print: no key => no Authorization header", () => {
  const r = run("install-context7.mjs", ["--print"]);
  assert.strictEqual(r.status, 0, r.stderr);
  const json = JSON.parse(r.stdout);
  assert.ok(!json.mcp.servers.context7.headers, "should not have headers");
  assert.strictEqual(
    json.mcp.servers.context7.url,
    "https://mcp.context7.com/mcp"
  );
});

test("install-context7 --print: with key => Authorization header present", () => {
  const r = run("install-context7.mjs", [
    "--print",
    "--api-key",
    "ctx7sk-TEST",
  ]);
  assert.strictEqual(r.status, 0, r.stderr);
  const json = JSON.parse(r.stdout);
  assert.ok(json.mcp.servers.context7.headers);
  assert.strictEqual(
    json.mcp.servers.context7.headers.Authorization,
    "Bearer ctx7sk-TEST"
  );
});

test("install-context7 --print: --local => local command entry", () => {
  const r = run("install-context7.mjs", ["--print", "--local"]);
  assert.strictEqual(r.status, 0, r.stderr);
  const json = JSON.parse(r.stdout);
  assert.strictEqual(json.mcp.servers.context7.type, "local");
  assert.ok(json.mcp.servers.context7.command);
  assert.ok(json.mcp.servers.context7.command.includes("@upstash/context7-mcp"));
});

// ---------------------------------------------------------------------------
// 4. install-engram.mjs --print
// ---------------------------------------------------------------------------
test("install-engram --print: local entry with engram mcp", () => {
  const r = run("install-engram.mjs", ["--print"]);
  assert.strictEqual(r.status, 0, r.stderr);
  const json = JSON.parse(r.stdout);
  assert.strictEqual(json.mcp.servers.engram.type, "local");
  assert.ok(json.mcp.servers.engram.command);
  assert.ok(json.mcp.servers.engram.command.includes("mcp"));
});

// ---------------------------------------------------------------------------
// 5. init.mjs flags and dry-run
// ---------------------------------------------------------------------------
test("init.mjs --help exits 0", () => {
  const r = run("init.mjs", ["--help"]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes("openspec-multiagent init"));
});

test("init.mjs --dry-run does not write config", () => {
  const home = mkdtempSync(join(tmpdir(), "osm-home-"));
  try {
    const r = run("init.mjs", ["--dry-run", "--skip-openspec-init"], {
      HOME: home,
    });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(
      !existsSync(join(home, ".config", "opencode", "opencode.json")),
      "dry-run must not write config"
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("init.mjs --context7 bogus exits 2", () => {
  const r = run("init.mjs", [
    "--skip-openspec-init",
    "--context7",
    "bogus",
  ]);
  assert.strictEqual(r.status, 2);
  assert.ok(r.stderr.includes("must be 'remote', 'local' or 'none'"));
});

test("init.mjs --engram bogus exits 2", () => {
  const r = run("init.mjs", [
    "--skip-openspec-init",
    "--engram",
    "bogus",
  ]);
  assert.strictEqual(r.status, 2);
  assert.ok(r.stderr.includes("must be 'local' or 'none'"));
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
