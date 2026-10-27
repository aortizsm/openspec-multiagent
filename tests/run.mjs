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
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  engramAssetName,
  hasMcpEntry,
  isEngramInstalled,
  mcpConfigFile,
  parseArgs,
  readJsonc,
  REPO_DIR,
  versionAtLeast,
  writeMcpEntry,
} from "../scripts/lib.mjs";

// Namespace import used to assert Zen symbols are no longer exported.
import * as lib from "../scripts/lib.mjs";

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
// 5. Engram helpers (lib.mjs)
// ---------------------------------------------------------------------------
test("isEngramInstalled returns a boolean", () => {
  assert.ok(typeof isEngramInstalled() === "boolean");
});

test("engramAssetName: linux asset suffix format", () => {
  const name = engramAssetName();
  if (process.platform === "linux") {
    const arch = process.arch === "arm64" ? "arm64" : "amd64";
    assert.strictEqual(name, `_linux_${arch}.tar.gz`);
    assert.ok(name.endsWith(".tar.gz"));
  } else {
    assert.strictEqual(name, null);
  }
});

// ---------------------------------------------------------------------------
// 5.5. MCP helpers (lib.mjs)
// ---------------------------------------------------------------------------
function withTempHome(fn) {
  const home = mkdtempSync(join(tmpdir(), "osm-mcp-home-"));
  const prev = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = home;
  try {
    return fn(home);
  } finally {
    process.env.XDG_CONFIG_HOME = prev;
    rmSync(home, { recursive: true, force: true });
  }
}

test("hasMcpEntry returns a boolean", () => {
  assert.ok(typeof hasMcpEntry("filesystem") === "boolean");
});

test("writeMcpEntry writes entry and hasMcpEntry detects it", () => {
  withTempHome(() => {
    const entry = { type: "local", command: ["npx", "-y", "@modelcontextprotocol/server-filesystem", REPO_DIR] };
    const result = writeMcpEntry("filesystem", entry);
    assert.ok(result.target.endsWith("opencode.json"));
    assert.ok(hasMcpEntry("filesystem"), "hasMcpEntry should detect the entry just written");

    const { data } = readJsonc(result.target);
    assert.ok(data.mcp.servers.filesystem);
    assert.strictEqual(data.mcp.servers.filesystem.type, "local");
    assert.ok(data.mcp.servers.filesystem.command.includes(REPO_DIR));
  });
});

test("writeMcpEntry writes github entry with env", () => {
  withTempHome(() => {
    const entry = {
      type: "local",
      command: ["npx", "-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: "ghp_testtoken123" },
    };
    writeMcpEntry("github", entry);
    assert.ok(hasMcpEntry("github"));

    const { data } = readJsonc(mcpConfigFile());
    assert.strictEqual(data.mcp.servers.github.env.GITHUB_TOKEN, "ghp_testtoken123");
  });
});

// ---------------------------------------------------------------------------
// 6. init.mjs flags and dry-run
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
// 7. setup.mjs flags and dry-run
// ---------------------------------------------------------------------------
test("setup.mjs --help lists --dry-run", () => {
  const r = run("setup.mjs", ["--help"]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes("--dry-run"));
});

test("setup.mjs --dry-run does not write config", () => {
  const home = mkdtempSync(join(tmpdir(), "osm-setup-home-"));
  const prev = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = home;
  try {
    const r = run("setup.mjs", ["--dry-run"], {
      HOME: home,
    });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(
      !existsSync(join(home, "opencode.json")),
      "dry-run must not write config"
    );
  } finally {
    process.env.XDG_CONFIG_HOME = prev;
    rmSync(home, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 8. check.mjs MCP report
// ---------------------------------------------------------------------------
test("check.mjs --json does not report a git MCP server", () => {
  const home = mkdtempSync(join(tmpdir(), "osm-check-home-"));
  try {
    const r = run("check.mjs", ["--json"], {
      HOME: home,
      XDG_CONFIG_HOME: home,
    });
    let json;
    try {
      json = JSON.parse(r.stdout);
    } catch {
      assert.fail(
        `check.mjs --json did not print JSON (exit ${r.status}): ${r.stderr || r.stdout}`
      );
    }
    assert.ok(
      Array.isArray(json.results) && json.results.length > 0,
      "check.mjs must report at least one result"
    );
    const names = json.results.map((entry) => entry.name);
    assert.ok(
      names.includes("filesystem"),
      `expected a filesystem MCP entry in results: ${names.join(", ")}`
    );
    assert.ok(
      names.includes("github"),
      `expected a github MCP entry in results: ${names.join(", ")}`
    );
    assert.ok(
      !names.includes("git"),
      `unexpected git MCP entry in results: ${names.join(", ")}`
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 9. Zen model selection removal (regression)
// ---------------------------------------------------------------------------

const ZEN_SYMBOLS = [
  "ZEN_EMBEDDED_PRICING",
  "configureZenProvider",
  "selectModelFromList",
  "fetchZenData",
  "runModelSelection",
];

test("lib.mjs: does not export Zen symbols", () => {
  for (const symbol of ZEN_SYMBOLS) {
    assert.ok(!(symbol in lib), `lib.mjs must not export ${symbol}`);
  }
});

test("setup.mjs: TOTAL_STEPS is 9 (model selection step removed)", () => {
  const src = readFileSync(join(SCRIPTS, "setup.mjs"), "utf8");
  assert.ok(src.includes("const TOTAL_STEPS = 9;"), "expected TOTAL_STEPS === 9");
  assert.ok(!src.includes("TOTAL_STEPS = 10"), "TOTAL_STEPS must not be 10");
});

test("setup.mjs: no runModelSelection helper", () => {
  const src = readFileSync(join(SCRIPTS, "setup.mjs"), "utf8");
  assert.ok(!src.includes("runModelSelection"), "runModelSelection must be removed");
});

test("setup.mjs: does not import or reference Zen symbols", () => {
  const src = readFileSync(join(SCRIPTS, "setup.mjs"), "utf8");
  for (const symbol of ZEN_SYMBOLS) {
    assert.ok(!src.includes(symbol), `setup.mjs must not reference ${symbol}`);
  }
  assert.ok(!/zen/i.test(src), "setup.mjs must not reference Zen (case-insensitive)");
});

test("deleted spec: openspec/specs/model-selector/spec.md no longer exists", () => {
  assert.ok(
    !existsSync(join(process.cwd(), "openspec/specs/model-selector/spec.md")),
    "model-selector/spec.md must be deleted"
  );
});

test("added spec: openspec/specs/setup-wizard/spec.md exists", () => {
  assert.ok(
    existsSync(join(process.cwd(), "openspec/specs/setup-wizard/spec.md")),
    "setup-wizard/spec.md must exist"
  );
});

test("deleted spec: openspec/specs/zen-provider/spec.md no longer exists", () => {
  assert.ok(
    !existsSync(join(process.cwd(), "openspec/specs/zen-provider/spec.md")),
    "zen-provider/spec.md must be deleted"
  );
});

test("deleted doc: docs/changes/2026-10-26-zen-model-selection.md no longer exists", () => {
  assert.ok(
    !existsSync(
      join(process.cwd(), "docs/changes/2026-10-26-zen-model-selection.md")
    ),
    "zen-model-selection changelog entry must be deleted"
  );
});

test("CHANGELOG.md: no zen-model-selection entry", () => {
  const changelog = readFileSync(join(process.cwd(), "docs/CHANGELOG.md"), "utf8");
  assert.ok(
    !/\[2026-10-26\] zen-model-selection\*\*/m.test(changelog),
    "CHANGELOG.md must not reference the old zen-model-selection entry"
  );
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
