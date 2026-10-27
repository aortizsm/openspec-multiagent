#!/usr/bin/env node
// setup.mjs - Simplified setup wizard for the multi-agent workflow.
//
// Flow:
//   1. Pre-flight: check what's already installed
//   2. Ask for GITHUB_TOKEN upfront (required for github MCP)
//   3. Execute steps with progress: Step X/N [OK]
//
// Usage:
//   node scripts/setup.mjs                       # full setup
//   node scripts/setup.mjs --global              # install the openspec CLI globally
//   node scripts/setup.mjs --context7 local      # use the local Context7 stdio server
//   node scripts/setup.mjs --dry-run             # check + report, install nothing
//
// Options:
//   --global              Install the openspec CLI globally (npm i -g) instead of locally
//   --context7 <remote|local>   How to wire Context7 (default: remote)
//   --dry-run             Report what is missing without installing anything
//   --help                Show this help

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  MIN_NODE,
  MIN_OPENSPEC,
  REPO_DIR,
  SCRIPT_DIR,
  askText,
  commandVersion,
  configCandidates,
  formatVersion,
  hasMcpEntry,
  parseArgs,
  readJsonc,
  writeMcpEntry,
  which,
} from "./lib.mjs";

const { flags, values } = parseArgs(process.argv.slice(2));

if (flags.has("help")) {
  console.log(`setup.mjs - Install/verify the multi-agent workflow prerequisites.

Options:
  --global              Install the openspec CLI globally (npm i -g) instead of locally
  --context7 <remote|local>   How to wire Context7 (default: remote)
  --dry-run             Report what is missing without installing anything
  --help                Show this help`);
  process.exit(0);
}

const GLOBAL = flags.has("global");
const DRY_RUN = flags.has("dry-run");
const context7Mode = values.get("context7") ?? (flags.has("local") ? "local" : "remote");

if (context7Mode !== "remote" && context7Mode !== "local") {
  console.error(`ERROR: --context7 must be 'remote' or 'local' (got '${context7Mode}')`);
  process.exit(2);
}

const npm = which(process.platform === "win32" ? "npm.cmd" : "npm");

// --- Helpers -------------------------------------------------------------------
const TOTAL_STEPS = 9;
let currentStep = 0;

function step(msg) {
  currentStep++;
  console.log(`\n==> Step ${currentStep}/${TOTAL_STEPS}: ${msg}`);
}
function ok(msg) {
  console.log(`    [OK] ${msg}`);
}
function info(msg) {
  console.log(`    ${msg}`);
}
function npmInstall(args) {
  if (DRY_RUN) {
    info(`[dry-run] npm ${args.join(" ")}`);
    return true;
  }
  const result = spawnSync(npm, args, { stdio: "inherit", cwd: REPO_DIR, shell: false });
  return result.status === 0;
}

// --- 0. Pre-flight check -------------------------------------------------------
console.log("\n==> Pre-flight check");
const checks = {
  node: false,
  npm: false,
  opencode: false,
  codegraph: false,
};

const nodeVersion = process.versions.node;
const [nMajor, nMinor, nPatch] = nodeVersion.split(".").map(Number);
checks.node =
  nMajor > MIN_NODE[0] || (nMajor === MIN_NODE[0] && (nMinor > MIN_NODE[1] || (nMinor === MIN_NODE[1] && nPatch >= MIN_NODE[2])));

checks.npm = !!npm;
checks.opencode = existsSync(join(process.env.HOME || process.env.USERPROFILE, ".config/opencode/opencode.json"));
checks.codegraph = !!which("codegraph");

// Report
for (const [name, ok] of Object.entries(checks)) {
  const version = name === "node" ? nodeVersion : name === "codegraph" ? commandVersion("codegraph") : "config";
  ok ? console.log(`  ✓ ${name} ${version}`) : console.log(`  ✗ ${name} not found`);
}

if (!checks.node) {
  console.error(`\nERROR: node >= ${formatVersion(MIN_NODE)} is required.`);
  console.error("       Install a newer Node.js: https://nodejs.org");
  process.exit(1);
}
if (!checks.npm) {
  console.error("\nERROR: npm is required.");
  process.exit(1);
}

// --- 1. GITHUB_TOKEN (ask upfront) ---------------------------------------------
(async () => {
if (DRY_RUN) {
  info("[dry-run] would ask for GITHUB_TOKEN");
} else {
  const token = await askText("GITHUB_TOKEN (required for github MCP): ");
  if (!token || !token.trim()) {
    console.error("\nERROR: GITHUB_TOKEN is required. Get one at https://github.com/settings/tokens");
    console.error("       You need at least 'repo' scope.");
    process.exit(1);
  }
  const GITHUB_TOKEN = token.trim();
  info("Token received (not stored)");

  // --- 2. Install dependencies -------------------------------------------------
  step("Installing dependencies");
  if (GLOBAL) {
    info("npm install -g @fission-ai/openspec@latest");
    if (!npmInstall(["install", "-g", "@fission-ai/openspec@latest"])) {
      console.error("\nERROR: failed to install the OpenSpec CLI globally.");
      process.exit(1);
    }
  } else {
    info("npm install (project-local dependencies)");
    if (!npmInstall(["install"])) {
      console.error("\nERROR: npm install failed.");
      process.exit(1);
    }
  }
  ok("Dependencies installed");

  // --- 3. Verify OpenSpec CLI --------------------------------------------------
  step("Verifying OpenSpec CLI");
  let openspecVersion = GLOBAL ? commandVersion("openspec") : commandVersion("npx", ["--no-install", "openspec", "--version"]);
  if (DRY_RUN && !openspecVersion) {
    openspecVersion = commandVersion("openspec");
  }
  if (openspecVersion) {
    const [oMajor, oMinor] = openspecVersion.split(".").map(Number);
    if (oMajor > MIN_OPENSPEC[0] || (oMajor === MIN_OPENSPEC[0] && oMinor >= MIN_OPENSPEC[1])) {
      ok(`openspec ${openspecVersion}`);
    } else {
      console.error(`\nERROR: openspec ${openspecVersion} is older than required >= ${formatVersion(MIN_OPENSPEC)}`);
      console.error("       Try: npm i -g @fission-ai/openspec@latest  (or re-run with --global)");
      process.exit(1);
    }
  } else if (DRY_RUN) {
    info("[dry-run] OpenSpec CLI not yet installed");
  } else {
    console.error("\nERROR: could not run the openspec CLI after install.");
    process.exit(1);
  }

  // --- 4. Context7 -------------------------------------------------------------
  step("Configuring Context7");
  if (DRY_RUN) {
    info(`[dry-run] node scripts/install-context7.mjs${context7Mode === "local" ? " --local" : ""}`);
  } else {
    const args = [join(SCRIPT_DIR, "install-context7.mjs")];
    if (context7Mode === "local") args.push("--local");
    const result = spawnSync(process.execPath, args, { stdio: "inherit", shell: false });
    if (result.status !== 0) {
      console.error("WARNING: could not configure Context7 automatically.");
      console.error("         Run manually: node scripts/install-context7.mjs");
    } else {
      ok("Context7 configured");
    }
  }

  // --- 5. Agent definitions ----------------------------------------------------
  step("Installing agent definitions");
  if (DRY_RUN) {
    info("[dry-run] would install agent definitions");
  } else {
    const result = spawnSync(process.execPath, [join(SCRIPT_DIR, "install-agents.mjs")], {
      stdio: "inherit",
      shell: false,
    });
    if (result.status !== 0) {
      console.error("\nERROR: could not install the agent definitions.");
      process.exit(1);
    }
    ok("Agent definitions installed");
  }

  // --- 6. CodeGraph ------------------------------------------------------------
  step("Installing CodeGraph");
  if (DRY_RUN) {
    info("[dry-run] would install CodeGraph");
  } else {
    // Check if already wired
    if (checks.codegraph && hasMcpEntry("codegraph")) {
      ok("CodeGraph already installed and wired (skipping)");
    } else {
      info("npm install (resolves @colbymchenry/codegraph)");
      if (!npmInstall(["install"])) {
        console.error("\nERROR: npm install failed.");
        process.exit(1);
      }
      const codegraphOk = which("codegraph");
      if (!codegraphOk) {
        console.error("\nERROR: codegraph CLI not found on PATH after install.");
        console.error("       Try: npm i -g @colbymchenry/codegraph");
        process.exit(1);
      }
      info("Wiring CodeGraph to OpenCode...");
      const result = spawnSync(
        codegraphOk,
        ["install", "--target=opencode", "--location=global", "--yes"],
        { stdio: "inherit", shell: false },
      );
      if (result.status !== 0) {
        console.error("\nERROR: could not wire CodeGraph to OpenCode.");
        console.error("       Run manually: codegraph install --target=opencode --location=global --yes");
        process.exit(1);
      }
      ok("CodeGraph wired to OpenCode");
    }
  }

  // --- 7. Engram ---------------------------------------------------------------
  step("Installing Engram");
  if (DRY_RUN) {
    info("[dry-run] would install Engram");
  } else if (process.platform !== "linux") {
    console.error("\nERROR: Engram requires Linux.");
    process.exit(1);
  } else {
    const result = spawnSync(process.execPath, [join(SCRIPT_DIR, "install-engram.mjs")], {
      stdio: "inherit",
      shell: false,
    });
    if (result.status !== 0) {
      console.error("\nERROR: could not install Engram.");
      console.error("       Run manually: node scripts/install-engram.mjs");
      process.exit(1);
    }
    ok("Engram installed");
  }

  // --- 8. MCP servers ----------------------------------------------------------
  step("Configuring MCP servers");
  const mcpServers = [
    {
      name: "filesystem",
      label: "lectura/escritura de archivos del proyecto",
      command: () => ["npx", "-y", "@modelcontextprotocol/server-filesystem", REPO_DIR],
    },
    {
      name: "github",
      label: "PRs, issues, releases",
      command: () => ["npx", "-y", "@modelcontextprotocol/server-github"],
    },
  ];

  for (const server of mcpServers) {
    if (hasMcpEntry(server.name)) {
      ok(`${server.name}: ya configurado`);
      continue;
    }

    let entry = { type: "local", command: server.command() };
    if (server.name === "github") {
      entry.env = { GITHUB_TOKEN };
    }

    try {
      const { target, existed } = writeMcpEntry(server.name, entry);
      ok(`${server.name}: escrito en ${target}${existed ? " (actualizado)" : ""}`);
    } catch (err) {
      console.error(`\nERROR: no se pudo escribir '${server.name}': ${err.message}`);
      process.exit(1);
    }
  }

  // --- 9. Preflight ------------------------------------------------------------
  step("Running preflight check");
  const checkScript = join(SCRIPT_DIR, "check.mjs");
  if (existsSync(checkScript)) {
    const result = spawnSync(process.execPath, [checkScript], { stdio: "inherit", shell: false });
    if (result.status !== 0) {
      console.log("");
      console.log("Preflight reported problems. Fix them, then re-run: node scripts/check.mjs");
    } else {
      ok("Preflight passed");
    }
  } else {
    info("check.mjs not found; skipping");
  }
}
})();



console.log("");
console.log("Setup complete.");
console.log("Next steps:");
console.log("  1. In a project that uses OpenSpec: run 'openspec init --tools opencode'");
console.log("     (skip this if the project already has an openspec/ directory)");
console.log("  2. Start OpenCode there and describe your change to @architect");
