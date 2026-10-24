#!/usr/bin/env node
// install-engram.mjs - Wire up the Engram local MCP server for OpenCode.
//
// Engram is a persistent memory system for AI coding agents (Go binary, SQLite +
// FTS5). It works standalone as an MCP server over stdio:
//
//   Agent (OpenCode) ← stdio MCP → Engram (Go binary) → SQLite (~/.engram/engram.db)
//
// OpenCode V2 reads servers from `mcp.servers.<name>`. This script writes the
// config entry and, when `engram` is not already installed, downloads and
// installs the Linux binary from GitHub releases into ~/.local/bin/engram.
//
// Usage:
//   node scripts/install-engram.mjs                    # write to user config
//   node scripts/install-engram.mjs --project          # write to ./opencode.json
//   node scripts/install-engram.mjs --print            # print the JSON block only
//   node scripts/install-engram.mjs --remove           # remove the entry
//   node scripts/install-engram.mjs --help             # show this help

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  downloadEngram,
  engramBinDir,
  engramBinPath,
  findConfigWithMcpServer,
  isEngramInstalled,
  opencodeConfigDir,
  parseArgs,
  readJsonc,
  which,
  writeConfig,
} from "./lib.mjs";

const { flags, values } = parseArgs(process.argv.slice(2));

if (flags.has("help")) {
  console.log(`install-engram.mjs - Configure the Engram local MCP server for OpenCode.

Options:
  --project          Write to ./opencode.json in the current directory (default: user config)
  --print            Print the JSON snippet and exit without touching any file
  --remove           Remove the engram MCP entry
  --help             Show this help`);
  process.exit(0);
}

const projectLocal = flags.has("project");

// The Engram binary must already be installed on PATH. If the user set
// ENGRAM_BIN we honour it, otherwise we call `engram` directly.
let engramBin = process.env.ENGRAM_BIN || "engram";

function buildEntry() {
  return {
    type: "local",
    command: [engramBin, "mcp"],
  };
}

if (flags.has("print")) {
  console.log(JSON.stringify({ mcp: { servers: { engram: buildEntry() } } }, null, 2));
  process.exit(0);
}

// --- pick the target config ----------------------------------------------------
function existingIn(dir) {
  const json = join(dir, "opencode.json");
  const jsonc = join(dir, "opencode.jsonc");
  if (existsSync(json)) return json;
  if (existsSync(jsonc)) return jsonc;
  return null;
}

let target;
if (projectLocal) {
  target = existingIn(process.cwd()) ?? join(process.cwd(), "opencode.json");
} else {
  target = existingIn(opencodeConfigDir()) ?? join(opencodeConfigDir(), "opencode.json");
}

if (flags.has("remove")) {
  const found = findConfigWithMcpServer("engram");
  if (!found) {
    console.log("No 'engram' MCP entry found in any config location.");
    process.exit(0);
  }
  const { data } = found;
  if (data.mcp.servers?.engram) delete data.mcp.servers.engram;
  if (data.mcp.servers && Object.keys(data.mcp.servers).length === 0) delete data.mcp.servers;
  if (Object.keys(data.mcp).length === 0) delete data.mcp;
  assertWritable(found.file, found.jsonc);
  writeConfig(found.file, data);
  console.log(`Removed the 'engram' MCP entry from ${found.file}`);
  process.exit(0);
}

// --- write ---------------------------------------------------------------------
let data = {};
let jsonc = false;
let existed = false;
if (existsSync(target)) {
  existed = true;
  ({ data, jsonc } = readJsonc(target));
  assertWritable(target, jsonc);
}

data.mcp ??= {};
data.mcp.servers ??= {};

// Resolve the Engram binary to reference in the MCP entry. Prefer an explicit
// ENGRAM_BIN, then a binary on PATH, then the default install location; when
// none is available, download and install Engram first.
let installed = false;
if (!isEngramInstalled()) {
  const destDir = engramBinDir();
  engramBin = await downloadEngram(undefined, destDir);
  installed = true;
} else if (process.env.ENGRAM_BIN) {
  engramBin = process.env.ENGRAM_BIN;
} else if (which("engram")) {
  engramBin = "engram";
} else {
  engramBin = engramBinPath();
}

if (!installed) {
  console.log(`Engram ya está instalado en ${engramBin}.`);
}

data.mcp.servers.engram = buildEntry();
writeConfig(target, data);

console.log(`${existed ? "Updated" : "Wrote"} ${target}`);
console.log(`  engram: local, binary ${engramBin}`);
if (installed) {
  console.log(`  (installed at ${engramBin})`);
}
console.log("");
console.log("Next:");
console.log("  1. Make sure the `engram` binary is on your PATH (or set ENGRAM_BIN).");
console.log("  2. Restart OpenCode or run /mcps to connect the server.");
console.log("  3. Verify: npx openspec-multiagent check");

/**
 * Comment loss is a real risk: OpenCode reads .jsonc files, and rewriting one
 * with JSON.stringify would silently delete the user's comments. Refuse instead
 * of destroying them, and print the block so they can paste it by hand.
 */
function assertWritable(file, isJsonc) {
  if (isJsonc) {
    console.error(
      `ERROR: ${file} contains JSON comments (JSONC).\n` +
        "       Rewriting it would delete them. Either remove the comments, or add this block by hand:\n\n" +
        JSON.stringify({ mcp: { servers: { engram: buildEntry() } } }, null, 2),
    );
    process.exit(1);
  }
}
