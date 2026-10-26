#!/usr/bin/env node
// reset.mjs - Remove ALL multi-agent setup (destructive!).
//
// Removes agent files, MCP entries, and local agent directories.
// Requires --confirm to execute (safety).
//
// Usage:
//   node scripts/reset.mjs --confirm        # remove everything
//   node scripts/reset.mjs --dry-run        # show what would be removed
//   node scripts/reset.mjs --help           # show this help

import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  agentsDir,
  opencodeConfigDir,
  parseArgs,
  readJsonc,
  writeConfig,
} from "./lib.mjs";

const { flags } = parseArgs(process.argv.slice(2));

if (flags.has("help")) {
  console.log(`reset.mjs - Remove ALL multi-agent setup (destructive!).

WARNING: This permanently removes agent files, MCP entries, and local agent directories.

Options:
  --confirm     Actually execute the removal (required)
  --dry-run     Show what would be removed without executing
  --help        Show this help`);
  process.exit(0);
}

const DRY_RUN = flags.has("dry-run");
const CONFIRM = flags.has("confirm");

if (!CONFIRM && !DRY_RUN) {
  console.error("ERROR: This operation is destructive and requires --confirm.");
  console.error("       Use --dry-run to preview, or --confirm to execute.");
  process.exit(1);
}

const DRY_RUN_LABEL = DRY_RUN ? "[dry-run] " : "";
const removedItems = [];

// --- Step 1: Remove agent files from user-level directory ----------------------
const agentDir = agentsDir();

if (existsSync(agentDir)) {
  const agentFiles = readdirSync(agentDir).filter((f) => f.endsWith(".md"));
  removedItems.push(`${agentFiles.length} agent files from ${agentDir}`);
  console.log(`${DRY_RUN_LABEL}Removing ${agentFiles.length} agent files from ${agentDir}`);
  if (!DRY_RUN) {
    rmSync(agentDir, { recursive: true, force: true });
  }
} else {
  console.log(`${DRY_RUN_LABEL}No agent files in ${agentDir}`);
}

// --- Step 2: Remove MCP entries from user config --------------------------------
const configPath = join(opencodeConfigDir(), "opencode.json");
const mcpNames = ["openspec", "context7", "engram", "codegraph"];
let removedMcpCount = 0;

if (existsSync(configPath)) {
  const { data, jsonc } = readJsonc(configPath);
  if (jsonc) {
    console.error(
      `ERROR: ${configPath} contains JSON comments. Cannot remove MCP entries automatically.\n` +
      `       Please remove the entries manually.`
    );
    process.exit(1);
  }

  for (const mcpName of mcpNames) {
    if (data.mcp?.servers?.[mcpName]) {
      delete data.mcp.servers[mcpName];
      removedMcpCount += 1;
      removedItems.push(`MCP entry: ${mcpName}`);
      console.log(`${DRY_RUN_LABEL}Removing MCP entry: ${mcpName}`);
    }
  }

  if (removedMcpCount > 0 && !DRY_RUN) {
    writeConfig(configPath, data);
  }
} else {
  console.log(`${DRY_RUN_LABEL}No MCP config at ${configPath}`);
}

// --- Step 3: Remove .opencode/agents in current directory -----------------------
const localAgentDir = join(process.cwd(), ".opencode", "agents");

if (existsSync(localAgentDir)) {
  const localAgentFiles = readdirSync(localAgentDir).filter((f) => f.endsWith(".md"));
  removedItems.push(`${localAgentFiles.length} local agent files from ${localAgentDir}`);
  console.log(`${DRY_RUN_LABEL}Removing ${localAgentFiles.length} local agent files from ${localAgentDir}`);
  if (!DRY_RUN) {
    rmSync(localAgentDir, { recursive: true, force: true });
  }
} else {
  console.log(`${DRY_RUN_LABEL}No local agent files in ${localAgentDir}`);
}

// --- Summary -------------------------------------------------------------------
console.log("");
if (removedItems.length > 0) {
  console.log("=== Reset Summary ===");
  console.log(`Items removed:`);
  for (const item of removedItems) {
    console.log(`  - ${item}`);
  }
  console.log("");
  console.log("Multi-agent setup has been removed.");
  console.log("Re-run 'npm run setup' or 'node scripts/setup.mjs' to reinstall.");
} else {
  console.log("Nothing to remove. The multi-agent setup is already clean.");
}
