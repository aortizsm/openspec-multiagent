#!/usr/bin/env node
// setup.mjs - Install/verify the prerequisites for the multi-agent workflow.
//
//   1. Checks Node.js >= 20.19.0
//   2. Installs/upgrades the OpenSpec CLI (@fission-ai/openspec >= 1.14.0)
//   3. Configures the Context7 MCP server for library documentation
//   4. Copies the agent definitions into the OpenCode agents directory
//   5. Runs the preflight check
//
// Usage:
//   node scripts/setup.mjs                       # project-local openspec, remote context7
//   node scripts/setup.mjs --global              # install the openspec CLI globally
//   node scripts/setup.mjs --context7 local      # use the local Context7 stdio server
//   node scripts/setup.mjs --no-agents           # skip copying the agent definitions
//   node scripts/setup.mjs --no-context7         # skip configuring Context7
//   node scripts/setup.mjs --dry-run             # check + report, install nothing

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  MIN_NODE,
  MIN_OPENSPEC,
  REPO_DIR,
  SCRIPT_DIR,
  askYesNo,
  askText,
  closePrompts,
  commandVersion,
  formatVersion,
  hasMcpEntry,
  parseArgs,
  writeMcpEntry,
  which,
} from "./lib.mjs";

const { flags, values } = parseArgs(process.argv.slice(2));

if (flags.has("help")) {
  console.log(`setup.mjs - Install/verify the multi-agent workflow prerequisites.

Options:
  --global              Install the openspec CLI globally (npm i -g) instead of locally
  --context7 <remote|local>   How to wire Context7 (default: remote)
  --no-context7         Skip configuring Context7
  --dry-run             Report what is missing without installing anything
  --help                Show this help`);
  process.exit(0);
}

const GLOBAL = flags.has("global");
const CONFIGURE_CONTEXT7 = !flags.has("no-context7");
const DRY_RUN = flags.has("dry-run");
const context7Mode = values.get("context7") ?? (flags.has("local") ? "local" : "remote");

if (context7Mode !== "remote" && context7Mode !== "local") {
  console.error(`ERROR: --context7 must be 'remote' or 'local' (got '${context7Mode}')`);
  process.exit(2);
}

const npm = which(process.platform === "win32" ? "npm.cmd" : "npm");

function step(msg) {
  console.log(`==> ${msg}`);
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

// --- 1. node -------------------------------------------------------------------
step("Checking Node.js");
const nodeVersion = process.versions.node;
const [nMajor, nMinor, nPatch] = nodeVersion.split(".").map(Number);
const nodeOk =
  nMajor > MIN_NODE[0] || (nMajor === MIN_NODE[0] && (nMinor > MIN_NODE[1] || (nMinor === MIN_NODE[1] && nPatch >= MIN_NODE[2])));
if (!nodeOk) {
  console.error(`ERROR: node ${nodeVersion} is too old (need >= ${formatVersion(MIN_NODE)}).`);
  console.error("       Install a newer Node.js: https://nodejs.org");
  process.exit(1);
}
info(`node ${nodeVersion} OK`);

// --- 2. openspec cli -----------------------------------------------------------
step(GLOBAL ? "Installing the OpenSpec CLI globally" : "Installing the OpenSpec CLI (project-local)");
if (!npm) {
  console.error("ERROR: npm is required to install OpenSpec.");
  process.exit(1);
}

if (GLOBAL) {
  info("npm install -g @fission-ai/openspec@latest");
  if (!npmInstall(["install", "-g", "@fission-ai/openspec@latest"])) {
    console.error("ERROR: failed to install the OpenSpec CLI globally.");
    process.exit(1);
  }
} else {
  info("npm install (project-local dependencies)");
  if (!npmInstall(["install"])) {
    console.error("ERROR: npm install failed.");
    process.exit(1);
  }
}

step("Verifying the OpenSpec CLI");
let openspecVersion = GLOBAL ? commandVersion("openspec") : commandVersion("npx", ["--no-install", "openspec", "--version"]);
if (DRY_RUN && !openspecVersion) {
  openspecVersion = commandVersion("openspec");
}
if (openspecVersion) {
  const [oMajor, oMinor] = openspecVersion.split(".").map(Number);
  if (oMajor > MIN_OPENSPEC[0] || (oMajor === MIN_OPENSPEC[0] && oMinor >= MIN_OPENSPEC[1])) {
    info(`openspec ${openspecVersion} OK`);
  } else {
    console.error(`ERROR: openspec ${openspecVersion} is older than required >= ${formatVersion(MIN_OPENSPEC)}`);
    console.error("       Try: npm i -g @fission-ai/openspec@latest  (or re-run with --global)");
    process.exit(1);
  }
} else if (DRY_RUN) {
  info("[dry-run] the OpenSpec CLI is not installed yet");
} else {
  console.error("ERROR: could not run the openspec CLI after install.");
  process.exit(1);
}

// --- 3. context7 ---------------------------------------------------------------
if (CONFIGURE_CONTEXT7) {
  step(`Configuring Context7 (${context7Mode})`);
  if (DRY_RUN) {
    info(`[dry-run] node scripts/install-context7.mjs${context7Mode === "local" ? " --local" : ""}`);
  } else {
    const args = [join(SCRIPT_DIR, "install-context7.mjs")];
    if (context7Mode === "local") args.push("--local");
    const result = spawnSync(process.execPath, args, { stdio: "inherit", shell: false });
    if (result.status !== 0) {
      console.error("WARNING: could not configure Context7 automatically.");
      console.error("         Configure it by hand (see README) or run: node scripts/install-context7.mjs");
      console.error("         (from your project: npx openspec-multiagent init)");
    }
  }
}

// --- 4. agents -----------------------------------------------------------------
step("Installing the OpenCode agent definitions");
if (DRY_RUN) {
  info('[dry-run] would install agent definitions');
} else {
  const args = [join(SCRIPT_DIR, "install-agents.mjs")];
  if (DRY_RUN) args.push("--dry-run");
  const result = spawnSync(process.execPath, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error("ERROR: could not install the agent definitions.");
    process.exit(1);
  }
  info("Agent definitions installed");
}

// --- 5. codegraph (mandatory) --------------------------------------------------
step("Installing CodeGraph (semantic code graph)");
if (DRY_RUN) {
  info('[dry-run] would install CodeGraph');
} else {
  if (!npm) {
    console.error('ERROR: npm is required to install CodeGraph.');
    process.exit(1);
  }
  info('npm install (resolves @colbymchenry/codegraph)');
  if (!npmInstall(['install'])) {
    console.error('ERROR: npm install failed.');
    process.exit(1);
  }
  const codegraphOk = which('codegraph');
  if (!codegraphOk) {
    console.error('ERROR: codegraph CLI not found on PATH after install.');
    console.error('       Try: npm i -g @colbymchenry/codegraph');
    process.exit(1);
  }
  info('Wiring CodeGraph to OpenCode...');
  const result = spawnSync(
    codegraphOk,
    ['install', '--target=opencode', '--location=global', '--yes'],
    { stdio: 'inherit', shell: false },
  );
  if (result.status !== 0) {
    console.error('ERROR: could not wire CodeGraph to OpenCode.');
    console.error('       Run manually: codegraph install --target=opencode --location=global --yes');
    process.exit(1);
  }
  info('CodeGraph wired to OpenCode');
}

// --- 7. engram (mandatory, local memory) ---------------------------------------
step("Installing Engram (local memory)");
if (DRY_RUN) {
  info('[dry-run] would install Engram');
} else if (process.platform !== "linux") {
  console.error("ERROR: Engram requires Linux.");
  process.exit(1);
} else {
  const result = spawnSync(process.execPath, [join(SCRIPT_DIR, "install-engram.mjs")], {
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    console.error("ERROR: could not install Engram.");
    console.error("       Run manually: node scripts/install-engram.mjs");
    process.exit(1);
  }
  info("Engram installed");
}

// --- 8. MCP servers (mandatory) ------------------------------------------------
step("Configuring MCP servers");
if (DRY_RUN) {
  info('[dry-run] would configure filesystem and github MCP servers');
} else {
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
      info(`${server.name}: ya está configurado, sin cambios`);
      continue;
    }

    let entry = { type: "local", command: server.command() };
    if (server.name === "github") {
      const token = await askText("GITHUB_TOKEN (Personal Access Token): ");
      if (!token) {
        console.error("ERROR: GITHUB_TOKEN is required for the github MCP server.");
        process.exit(1);
      }
      entry.env = { GITHUB_TOKEN: token };
    }

    try {
      const { target, existed } = writeMcpEntry(server.name, entry);
      info(`${server.name}: escrito en ${target}${existed ? " (actualizado)" : ""}`);
    } catch (err) {
      console.error(`ERROR: no se pudo escribir '${server.name}': ${err.message}`);
      process.exit(1);
    }
  }
  closePrompts();
}

// --- 7. preflight --------------------------------------------------------------
step("Running the preflight check");
const checkScript = join(SCRIPT_DIR, "check.mjs");
if (existsSync(checkScript)) {
  const result = spawnSync(process.execPath, [checkScript], { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.log("");
    console.log("Preflight reported problems. Fix them, then re-run: node scripts/check.mjs");
  }
} else {
  info("check.mjs not found; skipping");
}

console.log("");
console.log("Setup complete.");
console.log("Next steps:");
console.log("  1. In a project that uses OpenSpec: run 'openspec init --tools opencode'");
console.log("     (skip this if the project already has an openspec/ directory)");
console.log("  2. Start OpenCode there and describe your change to @architect");
