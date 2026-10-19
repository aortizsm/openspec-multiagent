#!/usr/bin/env node
// install-context7.mjs - Configure the Context7 MCP server for OpenCode.
//
// Context7 serves up-to-date, version-specific documentation for thousands of
// libraries. It can be wired into OpenCode as:
//   * a remote MCP server (recommended: no local process to babysit), or
//   * a local stdio server via @upstash/context7-mcp.
//
// OpenCode V2 reads servers from `mcp.servers.<name>`. It does NOT read names
// directly under `mcp`, and it does NOT have an `enabled` field (use
// `disabled: true` to keep a server configured without connecting it).
//
// No credentials are required: Context7 works anonymously with lower rate
// limits, so the default install writes no Authorization header at all. Pass
// --api-key only when you want higher limits.
//
// Usage:
//   node scripts/install-context7.mjs                    # remote, no key
//   node scripts/install-context7.mjs --local            # local stdio server
//   node scripts/install-context7.mjs --project          # write to ./opencode.json
//   node scripts/install-context7.mjs --api-key KEY      # include an API key
//   node scripts/install-context7.mjs --print            # print the JSON block only
//   node scripts/install-context7.mjs --remove           # remove the entry

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  findConfigWithMcpServer,
  opencodeConfigDir,
  parseArgs,
  readJsonc,
  writeConfig,
} from "./lib.mjs";

const { flags, values } = parseArgs(process.argv.slice(2));

if (flags.has("help")) {
  console.log(`install-context7.mjs - Configure the Context7 MCP server for OpenCode.

Options:
  --remote           Use the remote hosted server (default)
  --local            Use the local stdio server (@upstash/context7-mcp) instead of remote
  --project          Write to ./opencode.json in the current directory (default: user config)
  --api-key <KEY>    Include an API key for higher rate limits (optional; Context7 works without one)
  --print            Print the JSON snippet and exit without touching any file
  --remove           Remove the context7 MCP entry
  --help             Show this help`);
  process.exit(0);
}

const mode = flags.has("local") ? "local" : "remote";
const apiKey = values.get("api-key") ?? "";
const projectLocal = flags.has("project");

function buildEntry() {
  if (mode === "local") {
    return {
      type: "local",
      command: ["npx", "-y", "@upstash/context7-mcp"],
    };
  }

  // Context7 works without an API key, with lower rate limits. Only add the
  // Authorization header when a key is actually provided, so a plain install
  // stays credential-free and never sends an empty "Bearer " value.
  const entry = {
    type: "remote",
    url: "https://mcp.context7.com/mcp",
  };
  if (apiKey) {
    entry.headers = { Authorization: `Bearer ${apiKey}` };
  }
  return entry;
}

if (flags.has("print")) {
  console.log(JSON.stringify({ mcp: { servers: { context7: buildEntry() } } }, null, 2));
  process.exit(0);
}

// --- pick the target config ----------------------------------------------------
// Prefer the file that already defines context7 (so we update in place and do
// not create a shadowing duplicate). Otherwise write to the user config, and
// when --project is set write to ./opencode.json.
//
// Note the .json/.jsonc pairing: OpenCode reads both, but writing to the wrong
// one of a pair creates a confusing second file. Always honour whichever already
// exists in the directory we picked.
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
  const found = findConfigWithMcpServer("context7");
  if (!found) {
    console.log("No 'context7' MCP entry found in any config location.");
    process.exit(0);
  }
  const { data } = found;
  if (data.mcp.servers?.context7) delete data.mcp.servers.context7;
  delete data.mcp.context7; // clean up the V1 shape too
  if (data.mcp.servers && Object.keys(data.mcp.servers).length === 0) delete data.mcp.servers;
  if (Object.keys(data.mcp).length === 0) delete data.mcp;
  assertWritable(found.file, found.jsonc);
  writeConfig(found.file, data);
  console.log(`Removed the 'context7' MCP entry from ${found.file}`);
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

// Migrate a leftover V1 `mcp.context7` entry so it does not linger as dead config.
let migrated = false;
if (data.mcp.context7) {
  delete data.mcp.context7;
  migrated = true;
}

data.mcp.servers.context7 = buildEntry();
writeConfig(target, data);

console.log(`${existed ? "Updated" : "Wrote"} ${target}`);
if (migrated) console.log("Migrated the legacy 'mcp.context7' entry to 'mcp.servers.context7'.");
console.log(`  context7: ${mode}${apiKey ? ", API key included" : ", no API key"}`);
console.log("");
console.log("Next:");
console.log("  1. Restart OpenCode or run /mcps to connect the server.");
console.log("  2. Verify: npx openspec-multiagent check");
if (!apiKey && mode === "remote") {
  console.log("");
  console.log("Context7 works without a key, with lower rate limits.");
  console.log("For higher limits, get one at https://context7.com/dashboard and re-run:");
  console.log("  npx openspec-multiagent init --context7 remote --api-key ctx7sk-...");
}

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
        JSON.stringify({ mcp: { servers: { context7: buildEntry() } } }, null, 2),
    );
    process.exit(1);
  }
}
