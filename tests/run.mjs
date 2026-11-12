#!/usr/bin/env node
// tests/run.mjs - Test suite for the openspec-multiagent installer.
// Runs with plain Node (no third-party dependencies).
//
//   node tests/run.mjs
//   npm run test

import assert from "node:assert";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  readdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { delimiter, join, dirname } from "node:path";
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

import {
  designGate,
  validateProposalSections,
} from "../scripts/orchestrate.mjs";

// Namespace import used to assert Zen symbols are no longer exported.
import * as lib from "../scripts/lib.mjs";

const SCRIPTS = join(process.cwd(), "scripts");

let passed = 0;
let failed = 0;
let skipped = 0;

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

function integrationTest(name, fn) {
  if (process.platform === "win32") {
    skipped += 1;
    console.log(`  ↷ ${name} (Windows shellless npx launch cannot run .cmd shims)`);
    return;
  }
  test(name, fn);
}

function run(script, args = [], env = {}, cwd) {
  return spawnSync("node", [join(SCRIPTS, script), ...args], {
    env: { ...process.env, ...env },
    cwd,
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
// 10. reinstall.mjs / reset.mjs / install-agents.mjs
// ---------------------------------------------------------------------------

function withTempConfigHome(fn) {
  const home = mkdtempSync(join(tmpdir(), "osm-config-home-"));
  const prev = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = home;
  try {
    return fn(home);
  } finally {
    process.env.XDG_CONFIG_HOME = prev;
    rmSync(home, { recursive: true, force: true });
  }
}

test("reinstall.mjs --help exits 0", () => {
  const r = run("reinstall.mjs", ["--help"]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes("reinstall.mjs - Reinstall agents"));
});

test("reinstall.mjs --dry-run exits 0 and does not modify anything", () => {
  withTempConfigHome(() => {
    const r = run("reinstall.mjs", ["--dry-run"]);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(
      !existsSync(join(process.env.XDG_CONFIG_HOME, "opencode", "agents")),
      "dry-run must not create agents dir"
    );
    assert.ok(
      !existsSync(join(process.env.XDG_CONFIG_HOME, "opencode", "opencode.json")),
      "dry-run must not write config"
    );
  });
});

test("reset.mjs --help exits 0", () => {
  const r = run("reset.mjs", ["--help"]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes("reset.mjs - Remove ALL multi-agent setup"));
});

test("reset.mjs --dry-run exits 0 and does not modify anything", () => {
  withTempConfigHome(() => {
    const r = run("reset.mjs", ["--dry-run"]);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(
      !existsSync(join(process.env.XDG_CONFIG_HOME, "opencode", "opencode.json")),
      "dry-run must not write config"
    );
  });
});

test("reset.mjs without --confirm exits non-zero", () => {
  withTempConfigHome(() => {
    const r = run("reset.mjs", []);
    assert.strictEqual(r.status, 1, "reset without --confirm must exit non-zero");
    assert.ok(r.stderr.includes("requires --confirm"), "should mention --confirm");
  });
});

test("install-agents.mjs --force overwrites existing agent files", () => {
  withTempConfigHome(() => {
    const target = join(process.env.XDG_CONFIG_HOME, "opencode", "agents");
    mkdirSync(target, { recursive: true });
    const agent = "developer.md";
    writeFileSync(join(target, agent), "OLD CONTENT\n");
    const r = run("install-agents.mjs", ["--force"]);
    assert.strictEqual(r.status, 0, r.stderr);
    const current = readFileSync(join(target, agent), "utf8");
    assert.ok(!current.includes("OLD CONTENT"), "--force must replace existing content");
    assert.ok(current.includes("description:"), "source agent content must be present");
  });
});

test("install-agents.mjs without --force skips existing agent files", () => {
  withTempConfigHome(() => {
    const target = join(process.env.XDG_CONFIG_HOME, "opencode", "agents");
    mkdirSync(target, { recursive: true });
    const agent = "developer.md";
    writeFileSync(join(target, agent), "OLD CONTENT\n");
    const r = run("install-agents.mjs", []);
    assert.strictEqual(r.status, 0, r.stderr);
    const current = readFileSync(join(target, agent), "utf8");
    assert.strictEqual(
      current,
      "OLD CONTENT\n",
      "existing file must be skipped without --force"
    );
    assert.ok(r.stdout.includes("skipped"), "should report skipped files");
  });
});

test("install-agents.mjs fresh install omits fast-architect", () => {
  withTempConfigHome(() => {
    const installed = run("install-agents.mjs", []);
    assert.strictEqual(installed.status, 0, installed.stderr);
    const target = join(process.env.XDG_CONFIG_HOME, "opencode", "agents");
    assert.ok(!existsSync(join(target, "fast-architect.md")));
  });
});

test("reinstall non-dry-run overwrites agent files and reconfigures MCP servers", () => {
  withTempConfigHome(() => {
    const r = run("reinstall.mjs", []);
    assert.strictEqual(r.status, 0, r.stderr);

    const agentDir = join(process.env.XDG_CONFIG_HOME, "opencode", "agents");
    const agentFiles = readdirSync(agentDir).filter((f) => f.endsWith(".md"));
    assert.ok(agentFiles.length > 0, "agent files must be copied to target dir");
    assert.ok(
      existsSync(join(agentDir, "developer.md")),
      "developer.md must be copied to target dir"
    );

    const configPath = join(process.env.XDG_CONFIG_HOME, "opencode", "opencode.json");
    const { data: configData } = readJsonc(configPath);
    assert.ok(configData.mcp.servers.openspec, "openspec MCP entry present");
    assert.ok(configData.mcp.servers.context7, "context7 MCP entry present");
    assert.ok(configData.mcp.servers.engram, "engram MCP entry present");
    assert.ok(configData.mcp.servers.codegraph, "codegraph MCP entry present");
  });
});

test("reset --confirm removes agent files, MCP entries and local .opencode/agents", () => {
  withTempConfigHome(() => {
    // Build a fresh state: copy agents into XDG config dir and write MCP entries
    const agentDir = join(process.env.XDG_CONFIG_HOME, "opencode", "agents");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "developer.md"), "# developer\n");
    writeFileSync(join(agentDir, "architect.md"), "# architect\n");

    const configPath = join(process.env.XDG_CONFIG_HOME, "opencode", "opencode.json");
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          mcp: {
            servers: {
              openspec: { type: "local", command: ["openspec-mcp"] },
              context7: { type: "remote", url: "https://mcp.context7.com/mcp" },
              engram: { type: "local", command: ["engram", "mcp"] },
              codegraph: { type: "local", command: ["codegraph", "mcp"] },
            },
          },
        },
        null,
        2
      )
    );

    // Run reset in a temp cwd so local .opencode/agents is not the repo dir
    const tmpCwd = mkdtempSync(join(tmpdir(), "osm-reset-cwd-"));
    try {
      const localAgents = join(tmpCwd, ".opencode", "agents");
      mkdirSync(localAgents, { recursive: true });
      writeFileSync(join(localAgents, "developer.md"), "# developer\n");

      const r = run("reset.mjs", ["--confirm"], {}, tmpCwd);
      assert.strictEqual(r.status, 0, r.stderr);

      // Agent files removed from XDG config dir
      assert.ok(
        !existsSync(join(agentDir, "developer.md")),
        "XDG agent file must be removed"
      );
      assert.ok(
        !existsSync(join(agentDir, "architect.md")),
        "XDG architect.md must be removed"
      );

      // MCP entries removed from config
      const { data: configData } = readJsonc(configPath);
      assert.ok(!configData.mcp.servers.openspec, "openspec entry removed");
      assert.ok(!configData.mcp.servers.context7, "context7 entry removed");
      assert.ok(!configData.mcp.servers.engram, "engram entry removed");
      assert.ok(!configData.mcp.servers.codegraph, "codegraph entry removed");

      // Local .opencode/agents removed cleanly
      assert.ok(!existsSync(localAgents), "local .opencode/agents must be removed");
    } finally {
      rmSync(tmpCwd, { recursive: true, force: true });
    }
  });
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
// 11. designGate / validateProposalSections (orchestrate.mjs)
// ---------------------------------------------------------------------------

const DG_CHANGES_DIR = join(process.cwd(), "openspec", "changes");
const DG_CHANGE_NAME = "dg-test-change";

function makeDgChange(extraFiles = {}, configOverride = null) {
  const changeDir = join(DG_CHANGES_DIR, DG_CHANGE_NAME);
  rmSync(changeDir, { recursive: true, force: true });
  mkdirSync(changeDir, { recursive: true });

  writeFileSync(join(changeDir, "proposal.md"), `# Proposal\n\n## Intent\n## Why\n## What Changes\n`);
  writeFileSync(
    join(changeDir, "design.md"),
    `# Design\n\n## status\n## executive_summary\n## artifacts\n## risks\n## next_recommended\n`
  );
  writeFileSync(join(changeDir, "tasks.md"), `# Tasks\n\n- [ ] do it\n`);

  for (const [fileName, content] of Object.entries(extraFiles)) {
    const filePath = join(changeDir, fileName);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  }

  if (configOverride !== null) {
    writeFileSync(join(changeDir, ".openspec.yaml"), configOverride);
  } else {
    writeFileSync(join(changeDir, ".openspec.yaml"), "schema: spec-driven\n");
  }

  return changeDir;
}

function cleanupDgChange() {
  rmSync(join(DG_CHANGES_DIR, DG_CHANGE_NAME), { recursive: true, force: true });
}

test("designGate: blocks when change directory does not exist", () => {
  cleanupDgChange();
  assert.throws(
    () => designGate(DG_CHANGE_NAME),
    /Design gate failed: change directory.*does not exist/
  );
});

test("designGate: blocks when proposal.md is missing", () => {
  const changeDir = makeDgChange();
  try {
    rmSync(join(changeDir, "proposal.md"), { force: true });
    assert.throws(
      () => designGate(DG_CHANGE_NAME),
      /Design gate failed: required file.*proposal.md.*is missing/
    );
  } finally {
    cleanupDgChange();
  }
});

test("designGate: blocks when design.md is missing", () => {
  const changeDir = makeDgChange();
  try {
    rmSync(join(changeDir, "design.md"), { force: true });
    assert.throws(
      () => designGate(DG_CHANGE_NAME),
      /Design gate failed: required file.*design.md.*is missing/
    );
  } finally {
    cleanupDgChange();
  }
});

test("designGate: blocks when tasks.md is missing", () => {
  const changeDir = makeDgChange();
  try {
    rmSync(join(changeDir, "tasks.md"), { force: true });
    assert.throws(
      () => designGate(DG_CHANGE_NAME),
      /Design gate failed: required file.*tasks.md.*is missing/
    );
  } finally {
    cleanupDgChange();
  }
});

test("designGate: blocks when no spec files exist (skip_specs not set)", () => {
  const changeDir = makeDgChange();
  try {
    assert.throws(
      () => designGate(DG_CHANGE_NAME),
      /Design gate failed: no spec files found/
    );
  } finally {
    cleanupDgChange();
  }
});

test("designGate: bypasses spec check when skip_specs: true", () => {
  const changeDir = makeDgChange(
    {},
    "schema: spec-driven\nskip_specs: true\n"
  );
  try {
    assert.doesNotThrow(() => designGate(DG_CHANGE_NAME));
  } finally {
    cleanupDgChange();
  }
});

test("designGate: blocks when design.md missing required field", () => {
  const changeDir = makeDgChange(
    { "specs/foo/spec.md": "# Spec\n" }
  );
  try {
    writeFileSync(
      join(changeDir, "design.md"),
      `# Design\n\n## status\n## executive_summary\n## artifacts\n## risks\n`
    );
    assert.throws(
      () => designGate(DG_CHANGE_NAME),
      /Design gate failed: design.md is missing required field "## next_recommended"/
    );
  } finally {
    cleanupDgChange();
  }
});

test("designGate: blocks when proposal.md missing required section", () => {
  const changeDir = makeDgChange(
    { "specs/foo/spec.md": "# Spec\n" }
  );
  try {
    writeFileSync(
      join(changeDir, "proposal.md"),
      `# Proposal\n\n## Intent\n## Why\n`
    );
    assert.throws(
      () => designGate(DG_CHANGE_NAME),
      /Design gate failed: proposal.md is missing required section "## What Changes"/
    );
  } finally {
    cleanupDgChange();
  }
});

function writeMissingIntentProposal(changeDir) {
  writeFileSync(
    join(changeDir, "proposal.md"),
    `# Proposal\n\n## Why\n## What Changes\n`
  );
}

function assertIntentFailureStopsDeveloper() {
  const orchestration = run("orchestrate.mjs", [DG_CHANGE_NAME]);
  assert.notStrictEqual(orchestration.status, 0);
  assert.match(
    orchestration.stderr,
    /proposal\.md is missing required section "## Intent"/
  );
  assert.ok(!orchestration.stdout.includes("=== Running developer"));
}

function assertResumeFlagRejected(args) {
  const orchestration = run("orchestrate.mjs", args);
  assert.notStrictEqual(orchestration.status, 0);
  assert.match(orchestration.stderr, /--from has been removed/);
  assert.ok(!orchestration.stdout.includes("=== Running"));
  assert.ok(!orchestration.stdout.includes("openspec archive"));
}

test("orchestrate: dry-run shows sequential tests before parallel reviews", () => {
  makeDgChange({ "specs/foo/spec.md": "# Spec\n" });
  try {
    const orchestration = run("orchestrate.mjs", [DG_CHANGE_NAME, "--dry-run"]);
    assert.strictEqual(orchestration.status, 0, orchestration.stderr);
    assertPhaseOrder(orchestration.stdout);
  } finally {
    cleanupDgChange();
  }
});

function assertPhaseOrder(plan) {
  const phases = ["1. developer", "2. test-engineer", "3. code-reviewer + security-reviewer", "4. verifier", "5. openspec validate", "6. openspec archive"];
  const positions = phases.map((phase) => plan.indexOf(phase));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepStrictEqual(positions, [...positions].sort((left, right) => left - right));
}

const FAKE_NPX_SCRIPT = `const { appendFileSync, existsSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const args = process.argv.slice(2);
const eventDir = process.env.ORCHESTRATION_EVENTS;
const record = (event) => appendFileSync(join(eventDir, "events.log"), event + "\\n");
if (args[0] === "opencode") {
  const phase = args[args.indexOf("-a") + 1];
  record(phase + ":start");
  if (["code-reviewer", "security-reviewer"].includes(phase)) {
    writeFileSync(join(eventDir, phase + ".started"), "started");
    const markerPaths = ["code-reviewer", "security-reviewer"].map((name) => join(eventDir, name + ".started"));
    const deadline = Date.now() + 5000;
    while (!markerPaths.every(existsSync) && Date.now() < deadline) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }
    if (!markerPaths.every(existsSync)) process.exit(8);
  }
  const exitCode = process.env.FAIL_STAGE === phase ? 1 : 0;
  record(phase + ":end:" + exitCode);
  process.exit(exitCode);
}
const phase = args[0] === "openspec" ? args[1] : "unknown";
record(phase + ":start");
record(phase + ":end:0");
`;

function writeFakeNpx(binaryDirectory) {
  const scriptPath = join(binaryDirectory, "fake-npx.cjs");
  const shimPath = join(binaryDirectory, process.platform === "win32" ? "npx.cmd" : "npx");
  writeFileSync(scriptPath, FAKE_NPX_SCRIPT);
  writePlatformNpxShim(shimPath);
}

function writePlatformNpxShim(shimPath) {
  const windowsShim = `@echo off\r\nnode "%~dp0fake-npx.cjs" %*\r\nexit /b %errorlevel%\r\n`;
  const posixShim = `#!/usr/bin/env node\n${FAKE_NPX_SCRIPT}`;
  writeFileSync(shimPath, process.platform === "win32" ? windowsShim : posixShim);
  if (process.platform !== "win32") {
    chmodSync(shimPath, 0o755);
  }
}

function createIsolatedChange(root) {
  const changeDir = join(root, "openspec", "changes", "runtime-sequencing-test");
  mkdirSync(join(changeDir, "specs", "feature"), { recursive: true });
  writeFileSync(join(changeDir, "proposal.md"), "# Proposal\n\n## Intent\n## Why\n## What Changes\n");
  writeFileSync(join(changeDir, "design.md"), "# Design\n\n## status\n## executive_summary\n## artifacts\n## risks\n## next_recommended\n");
  writeFileSync(join(changeDir, "tasks.md"), "# Tasks\n\n- [ ] Test runtime sequence\n");
  writeFileSync(join(changeDir, ".openspec.yaml"), "schema: spec-driven\n");
  writeFileSync(join(changeDir, "specs", "feature", "spec.md"), "# Feature\n");
}

function initializeIsolatedGit(root) {
  const init = spawnSync("git", ["init"], { cwd: root, encoding: "utf8" });
  const stage = spawnSync("git", ["add", "."], { cwd: root, encoding: "utf8" });
  const commit = spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-m", "fixture"], { cwd: root, encoding: "utf8" });
  for (const gitCommand of [init, stage, commit]) assert.strictEqual(gitCommand.status, 0, gitCommand.stderr);
}

function createIsolatedOrchestrationRepo() {
  const root = mkdtempSync(join(tmpdir(), "osm-orchestrate-runtime-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "bin"), { recursive: true });
  copyFileSync(join(SCRIPTS, "orchestrate.mjs"), join(root, "scripts", "orchestrate.mjs"));
  copyFileSync(join(SCRIPTS, "rollback.mjs"), join(root, "scripts", "rollback.mjs"));
  createIsolatedChange(root);
  writeFakeNpx(join(root, "bin"));
  initializeIsolatedGit(root);
  return root;
}

function runIsolatedOrchestration(root, failureStage = "") {
  const env = {
    ...process.env,
    PATH: `${join(root, "bin")}${delimiter}${process.env.PATH}`,
    ORCHESTRATION_EVENTS: join(root, "events"),
    FAIL_STAGE: failureStage,
  };
  mkdirSync(env.ORCHESTRATION_EVENTS, { recursive: true });
  return spawnSync("node", [join(root, "scripts", "orchestrate.mjs"), "runtime-sequencing-test"], {
    cwd: root,
    env,
    encoding: "utf8",
  });
}

function readOrchestrationEvents(root) {
  return readFileSync(join(root, "events", "events.log"), "utf8").trim().split("\n");
}

function runtimeEventIndex(events, event) {
  const index = events.indexOf(event);
  assert.ok(index >= 0, `missing runtime event: ${event}`);
  return index;
}

function assertSequentialPhasesComplete(events) {
  assert.ok(runtimeEventIndex(events, "developer:start") < runtimeEventIndex(events, "developer:end:0"));
  assert.ok(runtimeEventIndex(events, "developer:end:0") < runtimeEventIndex(events, "test-engineer:start"));
  assert.ok(runtimeEventIndex(events, "test-engineer:start") < runtimeEventIndex(events, "test-engineer:end:0"));
}

function assertReviewersOverlap(events) {
  assert.ok(runtimeEventIndex(events, "test-engineer:end:0") < runtimeEventIndex(events, "code-reviewer:start"));
  assert.ok(runtimeEventIndex(events, "test-engineer:end:0") < runtimeEventIndex(events, "security-reviewer:start"));
  assert.ok(runtimeEventIndex(events, "code-reviewer:start") < runtimeEventIndex(events, "code-reviewer:end:0"));
  assert.ok(runtimeEventIndex(events, "security-reviewer:start") < runtimeEventIndex(events, "security-reviewer:end:0"));
  assert.ok(runtimeEventIndex(events, "code-reviewer:start") < runtimeEventIndex(events, "security-reviewer:end:0"));
  assert.ok(runtimeEventIndex(events, "security-reviewer:start") < runtimeEventIndex(events, "code-reviewer:end:0"));
}

function assertPostReviewGates(events) {
  assert.ok(runtimeEventIndex(events, "code-reviewer:end:0") < runtimeEventIndex(events, "verifier:start"));
  assert.ok(runtimeEventIndex(events, "security-reviewer:end:0") < runtimeEventIndex(events, "verifier:start"));
  assert.ok(runtimeEventIndex(events, "verifier:end:0") < runtimeEventIndex(events, "validate:start"));
  assert.ok(runtimeEventIndex(events, "validate:end:0") < runtimeEventIndex(events, "archive:start"));
  assert.ok(runtimeEventIndex(events, "archive:start") < runtimeEventIndex(events, "archive:end:0"));
}

function assertSuccessfulRuntimeSequence(events) {
  assertSequentialPhasesComplete(events);
  assertReviewersOverlap(events);
  assertPostReviewGates(events);
}

function assertTestEngineerFailureStopsPipeline(events) {
  assert.strictEqual(events.filter((event) => event === "test-engineer:end:1").length, 3);
  assert.ok(!events.some((event) => /^(code-reviewer|security-reviewer|verifier|validate|archive):/.test(event)));
}

integrationTest("orchestrate: runtime phases wait for completion and reviewers overlap", () => {
  const isolatedRoot = createIsolatedOrchestrationRepo();
  try {
    const orchestration = runIsolatedOrchestration(isolatedRoot);
    assert.strictEqual(orchestration.status, 0, orchestration.stderr);
    assertSuccessfulRuntimeSequence(readOrchestrationEvents(isolatedRoot));
  } finally {
    rmSync(isolatedRoot, { recursive: true, force: true });
  }
});

integrationTest("orchestrate: test-engineer failure blocks all later phases in an isolated git repo", () => {
  const isolatedRoot = createIsolatedOrchestrationRepo();
  try {
    const orchestration = runIsolatedOrchestration(isolatedRoot, "test-engineer");
    assert.notStrictEqual(orchestration.status, 0);
    assert.match(orchestration.stderr, /Restart the full pipeline with: node scripts\/orchestrate\.mjs runtime-sequencing-test/);
    assert.strictEqual(spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: isolatedRoot, encoding: "utf8" }).stdout.trim(), isolatedRoot);
    assertTestEngineerFailureStopsPipeline(readOrchestrationEvents(isolatedRoot));
  } finally {
    rmSync(isolatedRoot, { recursive: true, force: true });
  }
});

test("orchestrate: rejects separated --from before agents start", () => {
  makeDgChange({ "specs/foo/spec.md": "# Spec\n" });
  try { assertResumeFlagRejected([DG_CHANGE_NAME, "--from", "verifier"]); }
  finally { cleanupDgChange(); }
});

test("orchestrate: rejects equals --from before agents start", () => {
  makeDgChange({ "specs/foo/spec.md": "# Spec\n" });
  try { assertResumeFlagRejected([DG_CHANGE_NAME, "--from=verifier"]); }
  finally { cleanupDgChange(); }
});

test("orchestrate: rejects a proposal missing Intent before running agents", () => {
  const changeDir = makeDgChange({ "specs/foo/spec.md": "# Spec\n" });
  try {
    writeMissingIntentProposal(changeDir);
    assertIntentFailureStopsDeveloper();
  } finally {
    cleanupDgChange();
  }
});

test("designGate: passes for a complete change with skip_specs: true", () => {
  const changeDir = makeDgChange(
    { "specs/foo/spec.md": "# Spec\n" },
    "schema: spec-driven\nskip_specs: true\n"
  );
  try {
    assert.doesNotThrow(() => designGate(DG_CHANGE_NAME));
  } finally {
    cleanupDgChange();
  }
});

test("validateProposalSections: blocks when section missing", () => {
  const changeDir = makeDgChange();
  try {
    writeFileSync(
      join(changeDir, "proposal.md"),
      `# Proposal\n\n## Intent\n## Why\n`
    );
    assert.throws(
      () => validateProposalSections(changeDir),
      /proposal.md is missing required section "## What Changes"/
    );
  } finally {
    cleanupDgChange();
  }
});

test("validateProposalSections: passes when all sections present", () => {
  const changeDir = makeDgChange();
  try {
    assert.doesNotThrow(() => validateProposalSections(changeDir));
  } finally {
    cleanupDgChange();
  }
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
if (failed > 0) {
  process.exit(1);
}
