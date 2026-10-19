#!/usr/bin/env node
// check.mjs - Verify the environment required by the multi-agent workflow.
//
// Exits 0 when everything is present and compatible, non-zero otherwise.
// Prints one line per component, then a machine-readable `status:` line.
//
// Usage:
//   node scripts/check.mjs            # human-readable
//   node scripts/check.mjs --json     # machine-readable JSON
//
// Checks Node.js, the OpenSpec CLI, the openspec-* skills, Context7, and (when
// found) that the OpenCode MCP configuration uses the V2 `mcp.servers` shape.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  EXPECTED_SKILLS,
  MIN_NODE,
  MIN_OPENSPEC,
  commandVersion,
  configCandidates,
  divider,
  findExistingConfig,
  formatVersion,
  readJsonc,
  report,
  which,
} from "./lib.mjs";

const asJson = process.argv.includes("--json");
const cwd = process.cwd();

const problems = [];
const results = [];

function record(name, status, detail, fix) {
  results.push({ name, status, detail, fix });
  if (status !== "ok" && status !== "none") {
    problems.push({ name, detail, fix });
  }
}

// --- node ----------------------------------------------------------------------
const nodeVersion = process.versions.node;
if (nodeVersion) {
  const parsed = nodeVersion.split(".").map(Number);
  if (parsed[0] > MIN_NODE[0] || (parsed[0] === MIN_NODE[0] && (parsed[1] > MIN_NODE[1] || (parsed[1] === MIN_NODE[1] && parsed[2] >= MIN_NODE[2])))) {
    record("node", "ok", nodeVersion);
  } else {
    record("node", "too-old", nodeVersion, `need >= ${formatVersion(MIN_NODE)}; upgrade Node.js`);
  }
} else {
  record("node", "missing", null, `install Node.js >= ${formatVersion(MIN_NODE)}`);
}

// --- openspec cli --------------------------------------------------------------
let openspecVersion = commandVersion("openspec");
let openspecCommand = "openspec";
if (!openspecVersion) {
  // Fall back to a project-local install driven by npx.
  openspecVersion = commandVersion("npx", ["--no-install", "openspec", "--version"]);
  if (openspecVersion) openspecCommand = "npx --no-install openspec";
}

const minOpenspec = formatVersion(MIN_OPENSPEC);
if (openspecVersion) {
  const parsed = openspecVersion.split(".").map(Number);
  const ok =
    parsed[0] > MIN_OPENSPEC[0] ||
    (parsed[0] === MIN_OPENSPEC[0] && parsed[1] >= MIN_OPENSPEC[1]);
  if (ok) {
    record("openspec", "ok", openspecVersion);
  } else {
    record(
      "openspec",
      "too-old",
      openspecVersion,
      `need >= ${minOpenspec}; run 'npx openspec-multiagent init' or 'npm i -g @fission-ai/openspec@latest'`,
    );
  }
} else {
  record(
    "openspec",
    "missing",
    null,
    `install with 'npx openspec-multiagent init' or 'npm i -g @fission-ai/openspec@latest'`,
  );
}

// --- required skills -----------------------------------------------------------
const skillsDir = join(cwd, ".opencode", "skills");
if (existsSync(skillsDir)) {
  const present = new Set(readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name));
  const missing = EXPECTED_SKILLS.filter((s) => !present.has(s));
  if (missing.length === 0) {
    record("skills", "ok", `${EXPECTED_SKILLS.length} found`);
  } else {
    record(
      "skills",
      "incomplete",
      missing.join(", "),
      `run 'openspec init --tools opencode' in this project (missing: ${missing.join(", ")})`,
    );
  }
} else {
  // Not an error: the current directory may simply not be an OpenSpec project.
  record("skills", "none", "run 'openspec init' in a project");
}

// --- context7 ------------------------------------------------------------------
// Either the ctx7 CLI or an MCP entry satisfies the requirement. The MCP entry is
// preferred because it is what the agents actually call.
const contexts = [];
for (const file of configCandidates(cwd)) {
  if (!existsSync(file)) continue;
  try {
    const { data } = readJsonc(file);
    const servers = data?.mcp?.servers;
    if (servers?.context7) {
      const entry = servers.context7;
      const stale = "enabled" in entry;
      contexts.push({ file, entry, stale, legacy: false });
    }
    if (data?.mcp?.context7) {
      // V1 shape: OpenCode V2 does not read this, so it is dead config.
      contexts.push({ file, entry: data.mcp.context7, stale: false, legacy: true });
    }
  } catch {
    // Unparseable config; reported below.
  }
}

const hasCtx7Cli = Boolean(which("ctx7"));
const goodContext7 = contexts.find((c) => !c.legacy);

if (goodContext7) {
  const detail = `${goodContext7.file}${goodContext7.stale ? ", has stale 'enabled' field" : ""}`;
  record("context7", "ok", detail);
  if (goodContext7.stale) {
    record(
      "context7-shape",
      "warning",
      "'enabled' is not a V2 field",
      "remove 'enabled'; use 'disabled: true' to keep it configured but disconnected",
    );
  }
} else if (contexts.some((c) => c.legacy)) {
  const legacy = contexts.find((c) => c.legacy);
  record(
    "context7",
    "wrong-shape",
    `${legacy.file} uses 'mcp.context7'`,
    "OpenCode V2 reads 'mcp.servers.context7'; run 'npx openspec-multiagent init' to fix",
  );
} else if (hasCtx7Cli) {
  record("context7", "ok", "ctx7 CLI present (no MCP entry)");
} else {
  record(
    "context7",
    "missing",
    null,
    "install the CLI ('npm i -g ctx7') or add a 'context7' entry under mcp.servers (see README)",
  );
}

// --- output --------------------------------------------------------------------
if (asJson) {
  console.log(JSON.stringify({ status: problems.length === 0 ? "READY" : "NOT_READY", results, problems }, null, 2));
  process.exit(problems.length === 0 ? 0 : 1);
}

for (const r of results) {
  if (r.status === "ok") report.ok(r.name, r.detail);
  else if (r.status === "none") report.warn(r.name, r.detail);
  else if (r.status === "too-old") report.tooOld(r.name, r.detail);
  else report.warn(r.name, `${r.status}${r.detail ? ` (${r.detail})` : ""}`);
}

divider();
if (problems.length === 0) {
  console.log("status: READY");
  const cfg = findExistingConfig(cwd);
  if (cfg) console.log(`config: ${cfg}`);
  process.exit(0);
}

console.log("status: NOT_READY");
for (const p of problems) {
  console.log(`  - ${p.detail ? `${p.detail}; ` : ""}${p.fix}`);
}
process.exit(1);
