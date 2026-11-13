#!/usr/bin/env node
// tests/lib.test.mjs - Tests for interactive input helpers in scripts/lib.mjs
//   node tests/lib.test.mjs

import assert from "node:assert";
import { EventEmitter } from "node:events";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";

import {
  ask,
  askText,
  askYesNo,
  closePrompts,
  isInteractive,
  readInput,
  removeAgentFiles,
  removeMcpEntries,
  readJsonc,
} from "../scripts/lib.mjs";

import { contextBundle } from "../scripts/context-bundle.mjs";

const MIMO_MODEL_ID = "opencode-go/mimo-v2.6-flash";
const GLM_MODEL_ID = "opencode-go/glm-5.3-flash";
const EXPECTED_AGENT_MODELS = {
  developer: MIMO_MODEL_ID,
  "test-engineer": MIMO_MODEL_ID,
  verifier: MIMO_MODEL_ID,
  "ux-designer": MIMO_MODEL_ID,
  "repo-scout": MIMO_MODEL_ID,
  "diff-summarizer": MIMO_MODEL_ID,
  "code-reviewer": GLM_MODEL_ID,
  "security-reviewer": GLM_MODEL_ID,
};

let passed = 0;
let failed = 0;

async function tick() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function testAsync(name, fn) {
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

function writeContextBundleFixture(fixtureDir) {
  const specsDir = join(fixtureDir, "specs");
  mkdirSync(specsDir);
  writeFileSync(join(fixtureDir, "proposal.md"), "# Proposal Fixture\nproposal marker\n");
  writeFileSync(join(fixtureDir, "design.md"), "# Design Fixture\ndesign marker\n");
  writeFileSync(join(fixtureDir, "tasks.md"), "# Tasks Fixture\ntasks marker\n");
  writeFileSync(join(specsDir, "spec.md"), "# Spec Fixture\nspec marker\n");
}

function assertContextBundleFixture(bundle) {
  assert.strictEqual(typeof bundle, "string");
  assert.ok(bundle.length > 0, "bundle is empty");
  for (const section of ["## Proposal", "## Design", "## Tasks", "## Spec", "## Git Diff"]) {
    assert.ok(bundle.includes(section), `missing section: ${section}`);
  }
  for (const marker of ["proposal marker", "design marker", "tasks marker", "spec marker"]) {
    assert.ok(bundle.includes(marker), `bundle missing fixture content: ${marker}`);
  }
}

// Mock stdin: an EventEmitter that emits "data" when push() is called and
// exposes the TTY / end-of-stream flags the prompts read.
class MockStdin extends EventEmitter {
  constructor({ tty = false, ended = false } = {}) {
    super();
    this.isTTY = tty;
    this.rawMode = false;
    this.readableEnded = ended;
  }
  setRawMode(mode) {
    this.rawMode = mode;
    return true;
  }
  push(chunk) {
    this.emit("data", chunk);
  }
}

// Mock stdout: a minimal write collector that records what prompts printed.
class MockStdout {
  constructor({ tty = false } = {}) {
    this.isTTY = tty;
    this.written = "";
  }
  write(chunk) {
    this.written += String(chunk);
    return true;
  }
  output() {
    return this.written;
  }
}

function stdinStream({ tty = false, ended = false } = {}) {
  return new MockStdin({ tty, ended });
}

function stdoutStream({ tty = false } = {}) {
  return new MockStdout({ tty });
}

function assertModelRoutingConfig(modelConfig) {
  assert.strictEqual(modelConfig.model, MIMO_MODEL_ID);
  assert.deepStrictEqual(Object.keys(modelConfig).sort(), ["agents", "model"]);
  assertAgentModelAssignments(modelConfig.agents);
}

function assertAgentModelAssignments(agentModels) {
  assert.deepStrictEqual(Object.keys(agentModels).sort(), Object.keys(EXPECTED_AGENT_MODELS).sort());
  for (const [agentId, modelId] of Object.entries(EXPECTED_AGENT_MODELS)) {
    assert.deepStrictEqual(agentModels[agentId], { model: modelId });
  }
}

(async () => {
  await testAsync("model-routing example maps all bundled roles without credentials", () => {
    const { data: modelConfig } = readJsonc(join(process.cwd(), "opencode.models.example.jsonc"));
    assertModelRoutingConfig(modelConfig);
  });

  // ------------------------------------------------------------------
  // isInteractive
  // ------------------------------------------------------------------
  await testAsync("isInteractive is false when stdin is not a TTY", async () => {
    assert.strictEqual(
      isInteractive(stdinStream({ tty: false }), stdoutStream({ tty: false })),
      false,
    );
  });

  await testAsync("isInteractive is true when both are TTYs", async () => {
    assert.strictEqual(
      isInteractive(stdinStream({ tty: true }), stdoutStream({ tty: true })),
      true,
    );
  });

  // ------------------------------------------------------------------
  // askYesNo — non-interactive (no stdin read)
  // ------------------------------------------------------------------
  await testAsync("askYesNo returns defaultYes when non-interactive", async () => {
    assert.strictEqual(
      await askYesNo("Keep going?", { stdin: stdinStream(), stdout: stdoutStream() }),
      true,
    );
  });

  await testAsync("askYesNo returns false when non-interactive and defaultYes=false", async () => {
    assert.strictEqual(
      await askYesNo("Keep going?", { defaultYes: false, stdin: stdinStream(), stdout: stdoutStream() }),
      false,
    );
  });

  // ------------------------------------------------------------------
  // askYesNo — interactive (reads stdin via ask / readInput)
  // ------------------------------------------------------------------
  await testAsync("askYesNo 'y' returns true", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("y\n");
    assert.strictEqual(await promise, true);
  });

  await testAsync("askYesNo 'yes' returns true", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("yes\n");
    assert.strictEqual(await promise, true);
  });

  await testAsync("askYesNo 'Y' returns true (case-insensitive)", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("Y\n");
    assert.strictEqual(await promise, true);
  });

  await testAsync("askYesNo 'n' returns false", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("n\n");
    assert.strictEqual(await promise, false);
  });

  await testAsync("askYesNo 'no' returns false", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("no\n");
    assert.strictEqual(await promise, false);
  });

  await testAsync("askYesNo empty answer returns defaultYes", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("\n");
    assert.strictEqual(await promise, true);
  });

  await testAsync("askYesNo empty answer returns defaultYes=false", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { defaultYes: false, stdin: input, stdout: output });
    await tick();
    input.push("\n");
    assert.strictEqual(await promise, false);
  });

  await testAsync("askYesNo EOF returns defaultYes", async () => {
    assert.strictEqual(
      await askYesNo("Agree?", {
        stdin: stdinStream({ tty: true, ended: true }),
        stdout: stdoutStream({ tty: true }),
      }),
      true,
    );
  });

  // ------------------------------------------------------------------
  // askText
  // ------------------------------------------------------------------
  await testAsync("askText returns typed value", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askText("Name?", { stdin: input, stdout: output });
    await tick();
    input.push("Ada\n");
    assert.strictEqual(await promise, "Ada");
  });

  await testAsync("askText returns fallback on empty answer", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askText("Name?", { fallback: "guest", stdin: input, stdout: output });
    await tick();
    input.push("\n");
    assert.strictEqual(await promise, "guest");
  });

  await testAsync("askText returns fallback on EOF (null)", async () => {
    assert.strictEqual(
      await askText("Name?", {
        fallback: "guest",
        stdin: stdinStream({ tty: true, ended: true }),
        stdout: stdoutStream({ tty: true }),
      }),
      "guest",
    );
  });

  await testAsync("askText default fallback is empty string", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askText("Name?", { stdin: input, stdout: output });
    await tick();
    input.push("\n");
    assert.strictEqual(await promise, "");
  });

  // ------------------------------------------------------------------
  // ask
  // ------------------------------------------------------------------
  await testAsync("ask returns typed value", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = ask("Say something: ", input, output);
    await tick();
    input.push("hello\n");
    assert.strictEqual(await promise, "hello");
  });

  await testAsync("ask returns null on EOF", async () => {
    assert.strictEqual(
      await ask("Say something: ", stdinStream({ tty: true, ended: true }), stdoutStream({ tty: true })),
      null,
    );
  });

  // ------------------------------------------------------------------
  // readInput — TTY input
  // ------------------------------------------------------------------
  await testAsync("readInput TTY returns trimmed value without EOF", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = readInput("q: ", {
      stdin: input,
      stdout: output,
      timeout: 5000,
      fallback: "",
    });
    await tick();
    input.push("  trimmed  \n");
    const outcome = await promise;
    assert.strictEqual(outcome.value, "trimmed");
    assert.strictEqual(outcome.eof, false);
  });

  // ------------------------------------------------------------------
  // readInput — piped input (not a TTY, data arrives)
  // ------------------------------------------------------------------
  await testAsync("readInput piped input returns value without EOF", async () => {
    const input = stdinStream({ tty: false });
    const output = stdoutStream({ tty: false });
    const promise = readInput("q: ", {
      stdin: input,
      stdout: output,
      timeout: 5000,
      fallback: "",
    });
    await tick();
    input.push("piped-data\n");
    const outcome = await promise;
    assert.strictEqual(outcome.value, "piped-data");
    assert.strictEqual(outcome.eof, false);
  });

  // ------------------------------------------------------------------
  // readInput — EOF
  // ------------------------------------------------------------------
  await testAsync("readInput returns EOF when readableEnded is true", async () => {
    const outcome = await readInput("q: ", {
      stdin: stdinStream({ tty: true, ended: true }),
      stdout: stdoutStream({ tty: true }),
      timeout: 5000,
      fallback: "",
    });
    assert.strictEqual(outcome.value, null);
    assert.strictEqual(outcome.eof, true);
  });

  await testAsync("readInput returns EOF on 'end' event", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = readInput("q: ", {
      stdin: input,
      stdout: output,
      timeout: 5000,
      fallback: "",
    });
    await tick();
    input.emit("end");
    const outcome = await promise;
    assert.strictEqual(outcome.value, null);
    assert.strictEqual(outcome.eof, true);
  });

  // ------------------------------------------------------------------
  // readInput — timeout
  // ------------------------------------------------------------------
  await testAsync("readInput returns fallback on timeout without EOF", async () => {
    const outcome = await readInput("q: ", {
      stdin: stdinStream({ tty: true }),
      stdout: stdoutStream({ tty: true }),
      timeout: 30,
      fallback: "fb",
    });
    assert.strictEqual(outcome.value, "fb");
    assert.strictEqual(outcome.eof, false);
  });

  await testAsync("readInput default fallback is empty string on timeout", async () => {
    const outcome = await readInput("q: ", {
      stdin: stdinStream({ tty: true }),
      stdout: stdoutStream({ tty: true }),
      timeout: 30,
    });
    assert.strictEqual(outcome.value, "");
    assert.strictEqual(outcome.eof, false);
  });

  await testAsync("closePrompts does not throw", () => {
    closePrompts();
  });

  // ------------------------------------------------------------------
  // removeAgentFiles (lib.mjs)
  // ------------------------------------------------------------------
  await testAsync("removeAgentFiles removes .md files and returns the count", async () => {
    const dir = mkdtempSync(join(tmpdir(), "osm-agents-"));
    writeFileSync(join(dir, "developer.md"), "# developer");
    writeFileSync(join(dir, "architect.md"), "# architect");
    try {
      const removed = removeAgentFiles(dir);
      assert.strictEqual(removed, 2, "should remove exactly the .md files");
      assert.ok(!existsSync(dir), "agent directory must be removed entirely");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await testAsync("removeAgentFiles dry-run does not delete files", async () => {
    const dir = mkdtempSync(join(tmpdir(), "osm-agents-dry-"));
    writeFileSync(join(dir, "developer.md"), "# developer");
    try {
      const removed = removeAgentFiles(dir, { dryRun: true });
      assert.strictEqual(removed, 1, "dry-run reports the would-be count");
      assert.ok(existsSync(join(dir, "developer.md")), "dry-run must not delete");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await testAsync("removeAgentFiles returns 0 for missing dir", async () => {
    const missing = join(tmpdir(), "osm-agents-missing-" + Date.now());
    const removed = removeAgentFiles(missing);
    assert.strictEqual(removed, 0, "missing dir returns 0");
  });

  // ------------------------------------------------------------------
  // removeMcpEntries (lib.mjs)
  // ------------------------------------------------------------------
  await testAsync("removeMcpEntries removes listed MCP entries and returns count", async () => {
    const home = mkdtempSync(join(tmpdir(), "osm-mcp-home-"));
    const prev = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = home;
    try {
      const configPath = join(home, "opencode.json");
      writeFileSync(
        configPath,
        JSON.stringify({
          mcp: {
            servers: {
              openspec: { type: "local", command: ["openspec-mcp"] },
              context7: { type: "remote", url: "https://mcp.context7.com/mcp" },
              engram: { type: "local", command: ["engram", "mcp"] },
              other: { type: "local", command: ["other"] },
            },
          },
        }, null, 2),
      );
      const removed = removeMcpEntries(configPath, ["openspec", "engram"]);
      assert.strictEqual(removed, 2, "should remove the two listed entries");
      const { data: configData } = readJsonc(configPath);
      assert.ok(!configData.mcp.servers.openspec, "openspec entry removed");
      assert.ok(!configData.mcp.servers.engram, "engram entry removed");
      assert.ok(configData.mcp.servers.context7, "context7 entry kept");
      assert.ok(configData.mcp.servers.other, "other entry kept");
    } finally {
      process.env.XDG_CONFIG_HOME = prev;
      rmSync(home, { recursive: true, force: true });
    }
  });

  await testAsync("removeMcpEntries dry-run does not write the config", async () => {
    const home = mkdtempSync(join(tmpdir(), "osm-mcp-dry-"));
    const prev = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = home;
    try {
      const configPath = join(home, "opencode.json");
      const original = JSON.stringify({
        mcp: { servers: { openspec: { type: "local", command: ["openspec-mcp"] } } },
      });
      writeFileSync(configPath, original);
      const removed = removeMcpEntries(configPath, ["openspec"], { dryRun: true });
      assert.strictEqual(removed, 1, "dry-run reports the would-be count");
      const current = readFileSync(configPath, "utf8");
      assert.strictEqual(current, original, "dry-run must not modify the file");
    } finally {
      process.env.XDG_CONFIG_HOME = prev;
      rmSync(home, { recursive: true, force: true });
    }
  });

  await testAsync("removeMcpEntries returns 0 for missing config", async () => {
    const missing = join(tmpdir(), "osm-mcp-missing-" + Date.now(), "opencode.json");
    const removed = removeMcpEntries(missing, ["openspec"]);
    assert.strictEqual(removed, 0, "missing config returns 0");
  });

  await testAsync("removeMcpEntries exits 1 on JSONC config", async () => {
    const home = mkdtempSync(join(tmpdir(), "osm-mcp-jsonc-"));
    const prev = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = home;
    const originalExit = process.exit;
    let exited = false;
    process.exit = (code) => {
      exited = true;
      throw new Error(`process.exit(${code})`);
    };
    try {
      const configPath = join(home, "opencode.jsonc");
      writeFileSync(configPath, "// comment\n{}\n");
      let threw = false;
      try {
        removeMcpEntries(configPath, ["openspec"]);
      } catch {
        threw = true;
      }
      assert.strictEqual(threw, true, "removeMcpEntries did not throw on JSONC");
      assert.strictEqual(exited, true, "process.exit was called");
    } finally {
      process.exit = originalExit;
      process.env.XDG_CONFIG_HOME = prev;
      rmSync(home, { recursive: true, force: true });
    }
  });

  // ------------------------------------------------------------------
  // contextBundle
  // ------------------------------------------------------------------
  await testAsync("contextBundle includes artifacts from a temporary OpenSpec change", async () => {
    const fixtureDir = mkdtempSync(join(process.cwd(), "openspec", "changes", "context-bundle-test-"));
    try {
      writeContextBundleFixture(fixtureDir);
      assertContextBundleFixture(await contextBundle(basename(fixtureDir)));
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  await testAsync("contextBundle exits with error for nonexistent change", async () => {
    const originalExit = process.exit;
    const originalError = console.error;
    let exited = false;
    process.exit = (code) => {
      exited = true;
      throw new Error(`process.exit(${code})`);
    };
    console.error = () => {};
    try {
      let threw = false;
      try {
        contextBundle(`missing-context-bundle-${process.pid}-${Date.now()}`);
      } catch (err) {
        threw = true;
      }
      assert.strictEqual(threw, true, "contextBundle did not throw");
      assert.strictEqual(exited, true, "process.exit was not called");
    } finally {
      process.exit = originalExit;
      console.error = originalError;
    }
  });

  // ------------------------------------------------------------------
  // saveCheckpoint / rollbackToCheckpoint
  // ------------------------------------------------------------------
  const { register } = await import("node:module");
  const loaderUrl = new URL("./mock-loader.mjs", import.meta.url).href;
  await register(loaderUrl, () => {});
  const { saveCheckpoint, rollbackToCheckpoint } = await import("../scripts/rollback.mjs");
  const { calls } = await import("./mock-child-process.mjs");

  await testAsync("saveCheckpoint validates phase name (rejects spaces)", async () => {
    let threw = false;
    try {
      saveCheckpoint("bad phase");
    } catch (err) {
      threw = true;
    }
    assert.strictEqual(threw, true, "expected saveCheckpoint to throw for invalid phase name");
  });

  await testAsync("saveCheckpoint accepts valid phase name", async () => {
    let threw = false;
    try {
      saveCheckpoint("desarrollador");
    } catch (err) {
      threw = true;
    }
    assert.strictEqual(threw, false, "valid phase name should not throw");
  });

  await testAsync("saveCheckpoint builds checkpoint message with phase", () => {
    calls.length = 0;
    const hash = saveCheckpoint("desarrollador");
    const last = calls[calls.length - 1];
    assert.ok(last, "execFileSync should have been called");
    assert.strictEqual(last.kind, "execFileSync", "should use execFileSync, not execSync");
    assert.deepStrictEqual(last.file, "git");
    assert.ok(
      last.args.includes("rollback: checkpoint before desarrollador"),
      "checkpoint message should contain phase name"
    );
    assert.ok(last.args.includes("--allow-empty"));
    assert.strictEqual(hash, "deadbeef99");
  });

  await testAsync("rollbackToCheckpoint calls git reset --hard with checkpoint hash", () => {
    calls.length = 0;
    rollbackToCheckpoint();
    const last = calls[calls.length - 1];
    assert.ok(last, "execSync should have been called");
    assert.strictEqual(last.kind, "execSync");
    assert.ok(last.command.includes("git reset --hard"), "rollback should run git reset --hard");
    assert.ok(last.command.includes("deadbeef99"), "rollback should target the checkpoint hash");
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
