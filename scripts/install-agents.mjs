#!/usr/bin/env node
// install-agents.mjs - Copy the agent definitions into an OpenCode agents dir.
//
// Usage:
//   node scripts/install-agents.mjs             # user-level agents dir
//   node scripts/install-agents.mjs --project   # ./.opencode/agents in the cwd
//   node scripts/install-agents.mjs --dry-run   # show what would be copied
//   node scripts/install-agents.mjs --force     # overwrite existing agent files
//
// The target directory follows OpenCode conventions:
//   $XDG_CONFIG_HOME/opencode/agents  (when XDG_CONFIG_HOME is set)
//   %APPDATA%/opencode/agents         (Windows)
//   ~/.config/opencode/agents         (default on macOS/Linux)

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { AGENTS_SRC_DIR, agentsDir, parseArgs } from "./lib.mjs";

const { flags } = parseArgs(process.argv.slice(2));

if (flags.has("help")) {
  console.log(`install-agents.mjs - Copy the agent definitions into an OpenCode agents dir.

Options:
  --project   Install into ./.opencode/agents instead of the user-level directory
  --dry-run   Show what would be copied without writing anything
  --force     Overwrite existing agent files (default: skip if file exists)
  --help      Show this help`);
  process.exit(0);
}

const target = flags.has("project")
  ? join(process.cwd(), ".opencode", "agents")
  : agentsDir();

if (!existsSync(AGENTS_SRC_DIR)) {
  console.error(`ERROR: agent definitions not found at ${AGENTS_SRC_DIR}`);
  process.exit(1);
}

const files = readdirSync(AGENTS_SRC_DIR).filter((f) => f.endsWith(".md"));

if (files.length === 0) {
  console.error(`ERROR: no .md agent definitions found in ${AGENTS_SRC_DIR}`);
  process.exit(1);
}

if (flags.has("dry-run")) {
  console.log(`Would install ${files.length} agents to ${target}:`);
  for (const f of files) console.log(`  ${f}`);
  process.exit(0);
}

mkdirSync(target, { recursive: true });

const force = flags.has("force");
let installed = 0;
let skipped = 0;

for (const f of files) {
  const dest = join(target, f);
  if (existsSync(dest) && !force) {
    skipped += 1;
    continue;
  }
  copyFileSync(join(AGENTS_SRC_DIR, f), dest);
  installed += 1;
}

const summary = [];
if (installed > 0) summary.push(`${installed} installed`);
if (skipped > 0) summary.push(`${skipped} skipped (use --force to overwrite)`);
console.log(`Installed ${files.length} agent definitions to ${target}`);
if (summary.length > 0) console.log(summary.join(", ") + ".");
console.log("Restart OpenCode (or start a new session) to pick them up.");
