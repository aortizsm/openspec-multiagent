#!/usr/bin/env node
// init.mjs - Wizard (TUI) to set up the OpenSpec multi-agent workflow.
//
// Designed to run inside the USER'S PROJECT, not this repository:
//
//   npx openspec-multiagent init
//
// Wizard steps (5):
//   1. OpenSpec project      — runs `openspec init --tools opencode`
//   2. Agent definitions     — copies .opencode/agents into the project
//   3. Context7 MCP server   — optional, remote/local, with/without API key
//   4. Engram MCP server     — optional, local binary on PATH (ENGRAM_BIN)
//   5. Verification          — runs check.mjs and prints status: READY
//
// It never runs `npm install` inside your project: OpenSpec is fetched through
// npx, so no node_modules is created. Use --global-agents to install the agents
// once for every project instead of the current one.
//
// Usage:
//   npx openspec-multiagent init              # full TUI wizard in a terminal
//   npx openspec-multiagent init --global-agents
//   npx openspec-multiagent init --context7 remote --api-key KEY
//   npx openspec-multiagent init --engram local
//   npx openspec-multiagent init --skip-openspec-init
//   npx openspec-multiagent init --dry-run
//   npx openspec-multiagent init --no-prompt  # defaults only (CI-safe)
//
// When stdin is a terminal it shows a TUI menu for Context7 and Engram.
// Any of the flags answers for you, which is what you want in scripts and CI.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  MIN_OPENSPEC,
  SCRIPT_DIR,
  isOpenspecProject,
  parseArgs,
  resolveOpenspec,
  runOpenspec,
  which,
} from "./lib.mjs";
import { confirm, inputText, selectMenu } from "./tui.mjs";
import { isInteractive as libIsInteractive } from "./lib.mjs";

const { flags, values } = parseArgs(process.argv.slice(2));

if (flags.has("help")) {
  console.log(`openspec-multiagent init - Set up the multi-agent workflow in a project.

Options:
  --global-agents        Install the agents for every project instead of this one
  --context7 <mode>      How to wire Context7: 'remote' (default), 'local', or 'none'
  --api-key <KEY>        Include a Context7 API key for higher rate limits
  --no-api-key           Configure Context7 without an API key (the default)
  --skip-context7        Do not touch the Context7 MCP configuration
  --engram <mode>        Wire up the Engram local MCP server: 'local' or 'none'
  --skip-openspec-init   Do not run 'openspec init' (assume it is done)
  --no-prompt            Never ask questions; use the defaults (for scripts/CI)
  --dry-run              Show what would happen without changing anything
  --help                 Show this help

Run it inside the project you want to use the workflow in.`);

  process.exit(0);
}

const projectDir = process.cwd();
const GLOBAL_AGENTS = flags.has("global-agents");
const SKIP_OPENSPEC_INIT = flags.has("skip-openspec-init");
const DRY_RUN = flags.has("dry-run");
const NO_PROMPT = flags.has("no-prompt") || !libIsInteractive();

// --- flags that answer wizard questions ---------------------------------------
const context7Flag = values.get("context7");
const apiKeyFlag = values.get("api-key");
const skipContext7Flag = flags.has("skip-context7");
const noApiKeyFlag = flags.has("no-api-key");
const engramFlag = values.get("engram");

if (context7Flag && !["remote", "local", "none"].includes(context7Flag)) {
  console.error(`ERROR: --context7 must be 'remote', 'local' or 'none' (got '${context7Flag}')`);
  process.exit(2);
}
if (engramFlag && !["local", "none"].includes(engramFlag)) {
  console.error(`ERROR: --engram must be 'local' or 'none' (got '${engramFlag}')`);
  process.exit(2);
}

const context7AnsweredByFlags =
  Boolean(context7Flag) || skipContext7Flag || Boolean(apiKeyFlag) || noApiKeyFlag;

let context7Enabled = true;
let context7Mode = context7Flag === "local" ? "local" : "remote";
let context7ApiKey = apiKeyFlag ?? "";

let engramEnabled = false;
let engramMode = "none";

if (skipContext7Flag || context7Flag === "none") context7Enabled = false;
if (engramFlag === "local") engramEnabled = true;
if (engramFlag === "none") engramEnabled = false;

const step = (n, total, msg) => console.log(`\n[${n}/${total}] ${msg}`);
const info = (msg) => console.log(`      ${msg}`);
const warn = (msg) => console.error(`      WARNING: ${msg}`);
const TOTAL_STEPS = 5;

console.log(`openspec-multiagent init`);
console.log(`  project: ${projectDir}`);
if (DRY_RUN) console.log(`  mode:    dry-run (nothing will be written)`);

// --- Step 3 & 4 preamble — Context7 & Engram ---------------------------------
// In a TTY we ask interactively; otherwise use flags/defaults.
if (!context7AnsweredByFlags && engramFlag === undefined && !NO_PROMPT) {
  console.log("");
  console.log("This wizard sets up OpenSpec, the agents, and two optional MCP servers.");
  console.log("");
}

// ---------------------------------------------------------------------------
// Step 1: OpenSpec project
// ---------------------------------------------------------------------------
step(1, TOTAL_STEPS, "OpenSpec project");

let openspec = null;
if (!SKIP_OPENSPEC_INIT) {
  openspec = resolveOpenspec();
  if (!openspec) {
    console.error("\nERROR: could not find or fetch the OpenSpec CLI.");
    console.error("       Install it with: npm i -g @fission-ai/openspec@latest");
    process.exit(1);
  }
  const [oMajor, oMinor] = openspec.version.split(".").map(Number);
  if (oMajor < MIN_OPENSPEC[0] || (oMajor === MIN_OPENSPEC[0] && oMinor < MIN_OPENSPEC[1])) {
    console.error(`\nERROR: OpenSpec ${openspec.version} is too old (need >= ${MIN_OPENSPEC.join(".")}).`);
    console.error("       Upgrade with: npm i -g @fission-ai/openspec@latest");
    process.exit(1);
  }
  info(`openspec ${openspec.version}${openspec.global ? " (global)" : " (via npx, nothing installed locally)"}`);

  if (isOpenspecProject(projectDir)) {
    info("project is already initialised; refreshing tool files");
  }

  if (DRY_RUN) {
    info("[dry-run] openspec init --tools opencode --no-animation");
  } else {
    // `openspec init` is idempotent and preserves existing files. Under a real TTY
    // its spinner hangs, so we pipe its output (see runOpenspec in lib.mjs).
    const result = runOpenspec(openspec, ["init", "--tools", "opencode", "--no-animation"], {
      cwd: projectDir,
      captureOutput: true,
    });
    if (result.status !== 0) {
      console.error("\nERROR: 'openspec init' failed. Fix the output above and re-run.");
      process.exit(1);
    }
    info("initialised .opencode/ (skills and commands)");
  }
} else {
  info("skipped (--skip-openspec-init)");
}

// ---------------------------------------------------------------------------
// Step 2: Agent definitions
// ---------------------------------------------------------------------------
step(2, TOTAL_STEPS, "Agent definitions");
const agentsArgs = [join(SCRIPT_DIR, "install-agents.mjs")];
if (!GLOBAL_AGENTS) agentsArgs.push("--project");
if (DRY_RUN) agentsArgs.push("--dry-run");
{
  const result = spawnSync(process.execPath, agentsArgs, {
    stdio: "inherit",
    cwd: projectDir,
    shell: false,
  });
  if (result.status !== 0) {
    console.error("\nERROR: could not install the agent definitions.");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Step 3: Context7 MCP server (interactive TUI)
// ---------------------------------------------------------------------------
step(3, TOTAL_STEPS, "Context7 MCP server");

async function askContext7() {
  if (!context7Enabled) {
    info(skipContext7Flag ? "skipped (--skip-context7)" : "skipped");
    return;
  }

  const wantsContext7 = await confirm("Enable Context7?", { defaultYes: true });
  if (!wantsContext7) {
    context7Enabled = false;
    info("skipped");
    return;
  }

  context7Mode = await selectMenu(
    "How should Context7 be connected?",
    [
      { value: "remote", label: "remote", hint: "hosted server, nothing to install" },
      { value: "local", label: "local", hint: "runs @upstash/context7-mcp on your machine" },
    ],
    { defaultIndex: 0 },
  );

  if (context7Mode === "remote") {
    const wantsKey = await confirm("Use a Context7 API key for higher rate limits?", { defaultYes: false });
    if (wantsKey) {
      console.log("      Get a free key at https://context7.com/dashboard");
      context7ApiKey = await inputText("Paste the API key (or press Enter to skip):");
      if (!context7ApiKey) {
        console.log("      No key entered; continuing without one.");
      }
    }
  }
}

if (!context7AnsweredByFlags && !NO_PROMPT) {
  await askContext7();
} else if (!context7Enabled) {
  info(skipContext7Flag ? "skipped (--skip-context7)" : "skipped");
} else if (DRY_RUN) {
  const parts = [context7Mode === "local" ? "--local" : "--remote"];
  if (context7ApiKey) parts.push(`--api-key ${context7ApiKey}`);
  info(`[dry-run] install-context7.mjs ${parts.join(" ")}`);
} else {
  const c7Args = [join(SCRIPT_DIR, "install-context7.mjs")];
  if (context7Mode === "local") c7Args.push("--local");
  if (context7ApiKey) c7Args.push("--api-key", context7ApiKey);
  const result = spawnSync(process.execPath, c7Args, {
    stdio: "inherit",
    cwd: projectDir,
    shell: false,
  });
  if (result.status !== 0) {
    warn("could not configure Context7 automatically; see the message above.");
  }
}

// ---------------------------------------------------------------------------
// Step 4: Engram MCP server (interactive TUI)
// ---------------------------------------------------------------------------
step(4, TOTAL_STEPS, "Engram MCP server");

async function askEngram() {
  const engramBin = process.env.ENGRAM_BIN || "engram";
  const engramPresent =
    engramBin.includes("/") || engramBin.includes("\\")
      ? existsSync(engramBin)
      : which(engramBin);

  if (!engramPresent) {
    warn(`The 'engram' binary is not on PATH (set ENGRAM_BIN or install it).`);
    info("Skipping Engram. You can add it later with: npx openspec-multiagent init --engram local");
    return;
  }

  const wantsEngram = await confirm("Enable Engram local memory?", { defaultYes: false });
  if (!wantsEngram) {
    info("skipped");
    return;
  }

  engramEnabled = true;
  engramMode = "local";
}

if (engramFlag === undefined && !NO_PROMPT) {
  await askEngram();
} else if (!engramEnabled) {
  info("skipped");
} else if (DRY_RUN) {
  info("[dry-run] install-engram.mjs");
} else {
  const engramBin = process.env.ENGRAM_BIN || "engram";
  if (!which(engramBin) && !existsSync(engramBin)) {
    warn(`The 'engram' binary is not on PATH; skipping Engram.`);
    warn(`      Install it (brew install gentleman-programming/tap/engram) or set ENGRAM_BIN.`);
  } else {
    const result = spawnSync(process.execPath, [join(SCRIPT_DIR, "install-engram.mjs")], {
      stdio: "inherit",
      cwd: projectDir,
      shell: false,
      env: { ...process.env, ENGRAM_BIN: engramBin },
    });
    if (result.status !== 0) {
      warn("could not configure Engram automatically; see the message above.");
    }
  }
}

// ---------------------------------------------------------------------------
// Step 5: Verification
// ---------------------------------------------------------------------------
step(5, TOTAL_STEPS, "Verification");
if (DRY_RUN) {
  info("[dry-run] check.mjs");
} else {
  const result = spawnSync(process.execPath, [join(SCRIPT_DIR, "check.mjs")], {
    stdio: "inherit",
    cwd: projectDir,
    shell: false,
  });
  if (result.status !== 0) {
    console.log("");
    console.log("Some checks failed. Fix them, then re-run: npx openspec-multiagent check");
  }
}

console.log("");
console.log("Done.");
console.log("");
console.log("Next:");
if (!GLOBAL_AGENTS) {
  console.log("  - The agents are installed in this project (.opencode/agents).");
  console.log("    OpenCode picks up project agents automatically when you start it here.");
} else {
  console.log("  - The agents are installed for every project (~/.config/opencode/agents).");
}
console.log("  - Start OpenCode in this directory and talk to @architect.");
console.log("  - Describe the change you want; @architect turns it into an OpenSpec spec.");

// Guard against the most common mistake: running this from the repository
// checkout instead of the user's project.
if (existsSync(join(projectDir, "opencode", "agents", "architect.md")) && !existsSync(join(projectDir, ".git"))) {
  console.log("");
  console.log("NOTE: this looks like the openspec-multiagent source tree. Run 'init' from");
  console.log("      your own project instead, so the workflow is installed where you work.");
}
