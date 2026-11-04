#!/usr/bin/env node
// reinstall.mjs - Reinstall agents and reconfigure MCP servers.
//
// Removes existing agent files and MCP entries, then reinstalls everything
// fresh. Does NOT touch OpenSpec setup (openspec init, project config).
//
// Usage:
//   node scripts/reinstall.mjs              # reinstall everything
//   node scripts/reinstall.mjs --dry-run    # show what would be done
//   node scripts/reinstall.mjs --help       # show this help

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  AGENTS_SRC_DIR,
  agentsDir,
  mcpConfigFile,
  opencodeConfigDir,
  parseArgs,
  readJsonc,
  removeAgentFiles,
  removeMcpEntries,
  writeConfig,
} from "./lib.mjs";

const { flags } = parseArgs(process.argv.slice(2));

if (flags.has("help")) {
  console.log(`reinstall.mjs - Reinstall agents and reconfigure MCP servers.

Removes existing agent files and MCP entries, then reinstalls everything fresh.
Does NOT touch OpenSpec setup.

Options:
  --dry-run   Show what would be done without making changes
  --help      Show this help`);
  process.exit(0);
}

const DRY_RUN = flags.has("dry-run");
const DRY_RUN_LABEL = DRY_RUN ? "[dry-run] " : "";

// --- Step 1: Remove existing agent files ---------------------------------------
const agentDir = agentsDir();
const removedAgents = removeAgentFiles(agentDir, { dryRun: DRY_RUN });

// --- Step 2: Remove existing MCP entries ---------------------------------------
const mcpNames = ["openspec", "context7", "engram", "codegraph"];
const configPath = mcpConfigFile();
const removedMcp = removeMcpEntries(configPath, mcpNames, { dryRun: DRY_RUN });

// --- Step 3: Reinstall agents --------------------------------------------------
if (!existsSync(AGENTS_SRC_DIR)) {
  console.error(`ERROR: agent definitions not found at ${AGENTS_SRC_DIR}`);
  process.exit(1);
}

const agentFiles = readdirSync(AGENTS_SRC_DIR).filter((f) => f.endsWith(".md"));
console.log(`${DRY_RUN_LABEL}Installing ${agentFiles.length} agent definitions to ${agentDir}`);

if (!DRY_RUN) {
  mkdirSync(agentDir, { recursive: true });
  for (const f of agentFiles) {
    copyFileSync(join(AGENTS_SRC_DIR, f), join(agentDir, f));
  }
}

// --- Step 4: Reconfigure MCP servers -------------------------------------------
const mcpEntries = {
  openspec: {
    type: "local",
    command: ["npx", "-y", "openspec-mcp"],
  },
  context7: {
    type: "remote",
    url: "https://mcp.context7.com/mcp",
  },
  engram: {
    type: "local",
    command: ["engram", "mcp"],
  },
  codegraph: {
    type: "local",
    command: ["npx", "-y", "@colbymchenry/codegraph", "mcp"],
  },
};

console.log(`${DRY_RUN_LABEL}Configuring MCP servers`);
for (const [name, entry] of Object.entries(mcpEntries)) {
  console.log(`${DRY_RUN_LABEL}  ${name}: ${entry.type === "remote" ? entry.url : entry.command.join(" ")}`);
}

if (!DRY_RUN) {
  const configDir = opencodeConfigDir();
  mkdirSync(configDir, { recursive: true });

  let configData = {};
  if (existsSync(configPath)) {
    configData = readJsonc(configPath).data;
  }

  configData.mcp ??= {};
  configData.mcp.servers ??= {};

  for (const [name, entry] of Object.entries(mcpEntries)) {
    configData.mcp.servers[name] = entry;
  }

  writeConfig(configPath, configData);
}

// --- Summary -------------------------------------------------------------------
console.log("");
console.log("=== Reinstall Summary ===");
console.log(`Agents removed:  ${removedAgents}`);
console.log(`Agents installed: ${agentFiles.length}`);
console.log(`MCP entries removed: ${removedMcp}`);
console.log(`MCP entries configured: ${mcpNames.length}`);
console.log("");
console.log("Restart OpenCode (or start a new session) to pick up the changes.");
