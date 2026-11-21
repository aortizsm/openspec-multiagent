// lib.mjs - Shared helpers for the multi-agent setup scripts.
//
// Everything here is plain Node (>= 20.19.0), no third-party dependencies, and
// no shell-specific code, so the scripts behave the same on Windows, macOS and
// Linux.

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { request as httpsRequest } from "node:https";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

// --- versions required by the workflow -----------------------------------------
export const MIN_NODE = [20, 19, 0];
export const MIN_OPENSPEC = [1, 14, 0];

export const EXPECTED_SKILLS = [
  "openspec-explore",
  "openspec-propose",
  "openspec-apply-change",
  "openspec-archive-change",
];

// --- paths ---------------------------------------------------------------------
export const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_DIR = resolve(SCRIPT_DIR, "..");

/** Directory holding the agent definitions inside the repository. */
export const AGENTS_SRC_DIR = join(REPO_DIR, "opencode", "agents");

/**
 * User-level OpenCode configuration directory, following OpenCode conventions:
 *   $XDG_CONFIG_HOME/opencode  (when XDG_CONFIG_HOME is set)
 *   %APPDATA%/opencode         (Windows)
 *   ~/.config/opencode         (default on macOS/Linux)
 */
export function opencodeConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return join(process.env.XDG_CONFIG_HOME, "opencode");
  }
  if (process.platform === "win32" && process.env.APPDATA) {
    return join(process.env.APPDATA, "opencode");
  }
  return join(homedir(), ".config", "opencode");
}

/** Default user-level agents directory. */
export function agentsDir() {
  return join(opencodeConfigDir(), "agents");
}

/** Every config location OpenCode reads, lowest to highest precedence. */
export function configCandidates(cwd = process.cwd()) {
  const user = opencodeConfigDir();
  const out = [
    join(user, "opencode.json"),
    join(user, "opencode.jsonc"),
  ];
  const dirs = [];
  let dir = resolve(cwd);
  while (true) {
    dirs.push(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Farthest directory first, then closest, matching OpenCode's merge order.
  for (const d of dirs.reverse()) {
    out.push(join(d, "opencode.json"));
    out.push(join(d, "opencode.jsonc"));
  }
  for (const d of dirs) {
    out.push(join(d, ".opencode", "opencode.json"));
    out.push(join(d, ".opencode", "opencode.jsonc"));
  }
  return out;
}

// --- version helpers -----------------------------------------------------------
/** Parse "1.14.3" / "v20.19.0" into [major, minor, patch]; null when unparseable. */
export function parseVersion(raw) {
  if (typeof raw !== "string") return null;
  const match = raw.trim().replace(/^v/i, "").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

/** True when `have` >= `want`, comparing [major, minor, patch] arrays. */
export function versionAtLeast(have, want) {
  const a = parseVersion(Array.isArray(have) ? have.join(".") : have);
  if (!a) return false;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > want[i]) return true;
    if (a[i] < want[i]) return false;
  }
  return true;
}

export const formatVersion = (v) => v.join(".");

// --- process helpers -----------------------------------------------------------
/** Locate an executable on PATH (cross-platform). */
export function which(command, env = process.env) {
  const exts = process.platform === "win32" ? (env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of (env.PATH ?? "").split(process.platform === "win32" ? ";" : ":")) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = join(dir, command + ext);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** Run a command and capture stdout, returning null when it fails. */
export function run(command, args, options = {}) {
  const spawnResult = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  if (spawnResult.error || spawnResult.status !== 0) return null;
  return (spawnResult.stdout ?? "").trim();
}

export function commandVersion(command, args = ["--version"]) {
  const out = run(command, args);
  const parsed = parseVersion(out ?? "");
  return parsed ? formatVersion(parsed) : null;
}

// --- argument parsing ----------------------------------------------------------
/**
 * Minimal CLI parser: returns the set of boolean flags and a map of --key value
 * pairs. Supports `--key=value`, `--key value`, and repeated flags.
 */
export function parseArgs(argv) {
  const flags = new Set();
  const values = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const body = arg.slice(2);
    const eq = body.indexOf("=");
    if (eq !== -1) {
      values.set(body.slice(0, eq), body.slice(eq + 1));
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      values.set(body, next);
      i += 1;
    } else {
      flags.add(body);
    }
  }
  return { flags, values };
}

// --- interactive prompts -------------------------------------------------------
/**
 * Whether we can ask the user questions: stdin must be a real terminal. When it
 * is not (CI, a pipe, `npx` with redirected input, non-interactive automation)
 * every prompt falls back to its default instead of hanging forever.
 */
export function isInteractive(stdin = process.stdin, stdout = process.stdout) {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

/**
 * Shared readline interface. One per process: creating a fresh interface on the
 * same stdin for every question loses buffered input and makes EOF handling
 * unreliable. Lazily created so non-interactive runs never touch stdin.
 */
let readline = null;
/**
 * Lazily create (and cache) the shared readline interface on stdin/stdout.
 *
 * Kept for backward compatibility: `readInput` no longer uses `io()` (it
 * manages raw mode directly on the passed stream), but `io()` and the exported
 * `closePrompts()` are preserved so external callers can still manage the
 * shared interface.
 */
function io() {
  if (!readline) {
    readline = createInterface({ input: process.stdin, output: process.stdout });
    readline.on("close", () => {
      readline = null;
    });
  }
  return readline;
}

/**
 * Read one line from stdin. Returns `{ value, eof }`: `value` is null on EOF;
 * `eof` is true when stdin ends without data. Handles TTY (raw mode), piped
 * input, closed stdin, and a timeout that returns `fallback` instead of
 * hanging.
 */
export async function readInput(question, { timeout = Infinity, fallback = "", stdin = process.stdin, stdout = process.stdout } = {}) {
  return new Promise((resolve) => {
    const stream = stdin;
    if (stream.readableEnded) return resolve({ value: null, eof: true });
    stdout.write(question);
    let buffer = "", rawModeEnabled = false, timer = null;
    const cleanup = () => {
      if (rawModeEnabled) { try { stream.setRawMode(false); } catch { /* ignored: setRawMode can throw on a closed or detached stream; cleanup runs after end/close/timeout, so the error is safe to swallow */ } }
      if (timer) clearTimeout(timer);
      stream.off("data", onData).off("end", onEnd).off("close", onClose);
    };
    const onData = (chunk) => {
      buffer += chunk.toString();
      if (buffer.includes("\n") || buffer.includes("\r")) {
        cleanup(); resolve({ value: buffer.trim(), eof: false });
      }
    };
    const onEnd = () => { cleanup(); resolve({ value: null, eof: true }); };
    const onClose = () => { cleanup(); resolve({ value: null, eof: true }); };
    const onTimeout = () => { cleanup(); resolve({ value: fallback, eof: false }); };
    try {
      if (stream.isTTY) { stream.setRawMode(true); rawModeEnabled = true; }
      stream.on("data", onData);
      stream.on("end", onEnd);
      stream.on("close", onClose);
      timer = setTimeout(onTimeout, timeout);
    } catch { cleanup(); resolve({ value: fallback, eof: false }); }
  });
}

/**
 * Ask one question and return the trimmed answer, or `null` when stdin ends
 * (Ctrl+D) or the session goes away. Delegates to readInput() for the stdin
 * mechanics (TTY raw mode, piped input, EOF handling).
 *
 * readInput() applies a timeout by default (Infinity = wait forever); ask() uses
 * a large finite value so a prompt never blocks the event loop indefinitely.
 */
export async function ask(question, stdin = process.stdin, stdout = process.stdout) {
  // 2147483647 ms (~24.8 days) is the largest delay Node accepts without
  // clamping to 1 ms; effectively "wait forever" for an interactive prompt.
  return readInput(question, { timeout: 2147483647, fallback: null, stdin, stdout }).then(
    ({ value }) => value,
  );
}

/**
 * Close the shared readline interface. An open readline on stdin keeps the Node
 * event loop alive, which would stop an otherwise-finished script from exiting.
 * Call this once the last prompt has been answered.
 */
export function closePrompts() {
  if (readline) {
    readline.close();
    readline = null;
  }
}

/**
 * Ask a yes/no question. Returns `defaultYes` when the answer is empty, when the
 * session is non-interactive, or on EOF.
 */
export async function askYesNo(question, { defaultYes = true, stdin = process.stdin, stdout = process.stdout } = {}) {
  if (!isInteractive(stdin, stdout)) return defaultYes;
  const hint = defaultYes ? "Y/n" : "y/N";
  const answer = await ask(`${question} [${hint}] `, stdin, stdout);
  if (answer === null || answer === "") return defaultYes;
  const normalized = answer.toLowerCase();
  return normalized === "y" || normalized === "yes";
}

/** Ask for a free-text value. Returns `fallback` when the answer is empty. */
export async function askText(question, { fallback = "", stdin = process.stdin, stdout = process.stdout } = {}) {
  // Always try to read via ask() first (handles both TTY and piped input)
  const answer = await ask(`${question} `, stdin, stdout);
  if (answer === null || answer === "") return fallback;
  return answer;
}

/**
 * Ask the user to pick one option by number. `options` is a list of
 * `{ value, label, hint }`. Returns the default option's value when the answer
 * is empty or out of range, when the session is non-interactive, or on EOF.
 */
export async function askChoice(question, options, { defaultIndex = 0 } = {}) {
  const fallback = options[defaultIndex].value;
  if (!isInteractive()) return fallback;
  console.log(question);
  options.forEach((opt, i) => {
    const hint = opt.hint ? ` (${opt.hint})` : "";
    const marker = i === defaultIndex ? " [default]" : "";
    console.log(`  ${i + 1}) ${opt.label}${hint}${marker}`);
  });
  const prompt = `Select an option (1-${options.length}): `;
  const answer = await ask(prompt);
  if (answer === null || answer === "") return fallback;
  const picked = Number.parseInt(answer, 10);
  if (Number.isInteger(picked) && picked >= 1 && picked <= options.length) {
    return options[picked - 1].value;
  }
  return fallback;
}

// --- reporting -----------------------------------------------------------------
export const report = {
  ok: (name, detail) => console.log(`${name}: ok (${detail})`),
  warn: (name, detail) => console.log(`${name}: ${detail}`),
  missing: (name) => console.log(`${name}: missing`),
  tooOld: (name, detail) => console.log(`${name}: too-old (${detail})`),
};

export function divider() {
  console.log("---");
}

// --- config file handling ------------------------------------------------------
/**
 * Strip // and /* *\/ comments plus trailing commas so a JSONC config can be
 * parsed safely. String contents are preserved, including escapes.
 */
export function stripJsonComments(text) {
  let out = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inLine) {
      if (ch === "\n") {
        inLine = false;
        out += ch;
      }
      continue;
    }
    if (inBlock) {
      if (ch === "*" && next === "/") {
        inBlock = false;
        i += 1;
      }
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 1;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      inLine = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlock = true;
      i += 1;
      continue;
    }
    out += ch;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

export function readJsonc(file) {
  const raw = readFileSync(file, "utf8");
  // A URL like "https://..." contains "//" but not a comment. Detect comments by
  // scanning outside of strings, which is also what stripJsonComments does.
  const isJsonc = file.endsWith(".jsonc") || hasJsonComments(raw);
  if (isJsonc) return { data: JSON.parse(stripJsonComments(raw)), jsonc: true };
  return { data: JSON.parse(raw), jsonc: false };
}

/** True when the text contains a // or /* comment outside of a string literal. */
export function hasJsonComments(text) {
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      if (ch === "\\") i += 1;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "/" && (next === "/" || next === "*")) return true;
  }
  return false;
}

export function writeConfig(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

/** First existing config file, or null. */
export function findExistingConfig(cwd = process.cwd()) {
  for (const file of configCandidates(cwd)) {
    if (existsSync(file)) return file;
  }
  return null;
}

/**
 * Locate the config that defines a given MCP server name, scanning from the
 * user config outwards so we never shadow an existing higher-precedence entry.
 */
export function findConfigWithMcpServer(serverName, cwd = process.cwd()) {
  for (const file of configCandidates(cwd)) {
    if (!existsSync(file)) continue;
    try {
      const { data, jsonc } = readJsonc(file);
      if (data?.mcp?.servers?.[serverName] || data?.mcp?.[serverName]) {
        return { file, data, jsonc };
      }
    } catch {
      // Ignore unreadable/invalid configs; the preflight reports them.
    }
  }
  return null;
}

// --- MCP server entries --------------------------------------------------------

/** Target config file: the user-level OpenCode config (~/.config/opencode/opencode.json). */
export function mcpConfigFile() {
  return join(opencodeConfigDir(), "opencode.json");
}

/** True when an MCP server entry already exists in any config location. */
export function hasMcpEntry(serverName) {
  return Boolean(findConfigWithMcpServer(serverName));
}

/**
 * Write (or update) an MCP server entry in the user OpenCode config under
 * `mcp.servers.<serverName>`, forma V2 (`type: local`, `command: [...]`).
 *
 * Respects JSONC: refuses to rewrite a .jsonc file because JSON.stringify
 * would silently destroy the user's comments. In that case it throws so the
 * caller can warn and show the JSON block to paste by hand.
 */
export function writeMcpEntry(serverName, entry) {
  const target = mcpConfigFile();
  let data = {};
  let jsonc = false;
  let existed = false;
  if (existsSync(target)) {
    existed = true;
    ({ data, jsonc } = readJsonc(target));
    if (jsonc) {
      const snippet = JSON.stringify(
        { mcp: { servers: { [serverName]: entry } } },
        null,
        2,
      );
      throw new Error(
        `${target} contains JSON comments (JSONC). Rewriting would destroy them.\n` +
        `       Add this block by hand:\n\n${snippet}`,
      );
    }
  }
  data.mcp ??= {};
  data.mcp.servers ??= {};
  data.mcp.servers[serverName] = entry;
  writeConfig(target, data);
  return { target, existed };
}

// --- removal helpers -----------------------------------------------------------

/**
 * Remove all agent files (`.md`) from `dir`. Returns the number removed.
 * Respects dry-run mode: only logs when `dryRun` is true, never deletes.
 */
export function removeAgentFiles(dir, { dryRun = false } = {}) {
  const label = dryRun ? "[dry-run] " : "";
  if (!existsSync(dir)) {
    console.log(`${label}No agent files in ${dir}`);
    return 0;
  }
  const agentFiles = readdirSync(dir).filter((f) => f.endsWith(".md"));
  console.log(`${label}Removing ${agentFiles.length} agent files from ${dir}`);
  if (!dryRun) {
    rmSync(dir, { recursive: true, force: true });
  }
  return agentFiles.length;
}

/**
 * Compare the source agent definitions (opencode/agents/*.md) against the
 * installed copies (.opencode/agents/*.md) and report drift.
 *
 * Returns an array of objects { kind: 'drifted' | 'orphan', name: string }
 *   - 'drifted': installed copy exists and differs from its source
 *   - 'orphan': installed copy exists but has no matching source file
 *
 * An empty array means all installed copies are byte-identical to their sources
 * and no installed copy lacks a source.
 */
export function findDriftedAgentDefinitions() {
  const srcDir = AGENTS_SRC_DIR;
  const instDir = agentsDir();

  let sourceNames = [];
  if (existsSync(srcDir)) {
    sourceNames = readdirSync(srcDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  }

  let installedNames = [];
  if (existsSync(instDir)) {
    installedNames = readdirSync(instDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  }

  const sourceSet = new Set(sourceNames);
  const findings = [];

  for (const name of sourceNames) {
    const srcPath = join(srcDir, `${name}.md`);
    const instPath = join(instDir, `${name}.md`);
    if (!existsSync(instPath)) continue;
    const srcContent = readFileSync(srcPath, 'utf8');
    const instContent = readFileSync(instPath, 'utf8');
    if (srcContent !== instContent) {
      findings.push({ kind: 'drifted', name });
    }
  }

  for (const name of installedNames) {
    if (!sourceSet.has(name)) {
      findings.push({ kind: 'orphan', name });
    }
  }

  return findings;
}

/**
 * Remove MCP server entries (`mcpNames`) from the config at `configPath`.
 * Returns the number removed. Exits with an error on JSONC configs.
 * Respects dry-run mode: only logs when `dryRun` is true, never writes.
 */
export function removeMcpEntries(configPath, mcpNames, { dryRun = false } = {}) {
  const label = dryRun ? "[dry-run] " : "";
  if (!existsSync(configPath)) {
    console.log(`${label}No MCP config at ${configPath}`);
    return 0;
  }
  const { data: configData, jsonc } = readJsonc(configPath);
  if (jsonc) {
    console.error(
      `ERROR: ${configPath} contains JSON comments. Cannot remove MCP entries automatically.\n` +
      `       Please remove the entries manually.`
    );
    process.exit(1);
  }

  let removed = 0;
  for (const mcpName of mcpNames) {
    if (configData.mcp?.servers?.[mcpName]) {
      delete configData.mcp.servers[mcpName];
      removed += 1;
      console.log(`${label}Removing MCP entry: ${mcpName}`);
    }
  }

  if (removed > 0 && !dryRun) {
    writeConfig(configPath, configData);
  }
  return removed;
}

// --- OpenSpec CLI resolution ---------------------------------------------------
/**
 * Resolve how to invoke the OpenSpec CLI.
 *
 * Prefers a globally installed `openspec`. Falls back to fetching it through
 * `npx`, which needs no install and leaves the user's project untouched.
 *
 * Returns { command, prefixArgs, version, global } or null when nothing works
 * (for example when npm is unavailable and no global CLI exists).
 */
export function resolveOpenspec() {
  const globalCommand = which("openspec");
  if (globalCommand) {
    const version = commandVersion("openspec");
    if (version) return { command: globalCommand, prefixArgs: [], version, global: true };
  }

  const npm = which(process.platform === "win32" ? "npm.cmd" : "npm");
  if (!npm) return null;

  // `npx -y` avoids the interactive install prompt.
  const version = run("npx", ["-y", "@fission-ai/openspec@latest", "--version"]);
  const parsed = parseVersion(version ?? "");
  if (!parsed) return null;
  return {
    command: "npx",
    prefixArgs: ["-y", "@fission-ai/openspec@latest"],
    version: formatVersion(parsed),
    global: false,
  };
}

/** True when the directory looks like an initialised OpenSpec project. */
export function isOpenspecProject(dir = process.cwd()) {
  return existsSync(join(dir, "openspec", "config.yaml")) || existsSync(join(dir, "openspec", "project.md"));
}

/**
 * Run the resolved OpenSpec CLI with the given arguments.
 *
 * By default stdio is inherited. `captureOutput` instead pipes stdout/stderr,
 * prints them afterwards, and detaches stdin.
 *
 * Both are required for `openspec init`: under a real TTY its spinner hangs
 * forever (reproduced with CLI 1.14.0 and 1.14.3), because the progress UI
 * detects a TTY on stdout and never finishes. With stdout piped it completes in
 * under a second. We always pass our own flags, so it never needs to prompt.
 */
export function runOpenspec(resolved, args, options = {}) {
  const { captureOutput = false, ...rest } = options;
  const command = resolved.command;
  const argv = [...resolved.prefixArgs, ...args];

  if (!captureOutput) {
    return spawnSync(command, argv, { stdio: "inherit", shell: false, ...rest });
  }

  const result = spawnSync(command, argv, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: false,
    ...rest,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

// --- Engram (optional local MCP server) -----------------------------------------
const ENGRAM_OWNER = "Gentleman-Programming";
const ENGRAM_REPO = "engram";

/** Default directory where the Engram binary is installed. */
export function engramBinDir() {
  return join(homedir(), ".local", "bin");
}

/** Default path of the Engram binary. */
export function engramBinPath() {
  return join(engramBinDir(), "engram");
}

/** Expected asset suffix for the current platform/arch, or null when unsupported.
 *  Real release assets are versioned, e.g. `engram_3.4.0_linux_amd64.tar.gz`,
 *  so we match by suffix rather than a fixed file name. */
export function engramAssetName() {
  if (process.platform !== "linux") return null;
  const arch = process.arch === "arm64" ? "arm64" : "amd64";
  return `_linux_${arch}.tar.gz`;
}

/**
 * True when `engram` is already usable: on PATH (or at ENGRAM_BIN) or at the
 * default install location (~/.local/bin/engram).
 */
export function isEngramInstalled() {
  const bin = process.env.ENGRAM_BIN || "engram";
  const onPath =
    bin.includes("/") || bin.includes("\\")
      ? existsSync(bin)
      : Boolean(which(bin));
  return onPath || existsSync(engramBinPath());
}

/**
 * Fetch JSON from a URL using Node's built-in `https`. GitHub requires a
 * User-Agent header, otherwise it rejects the request.
 */
async function fetchJson(url) {
  const response = await new Promise((resolve, reject) => {
    const req = httpsRequest(url, {
      method: "GET",
      headers: {
        "User-Agent": "openspec-multiagent",
        Accept: "application/vnd.github+json",
      },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.end();
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return JSON.parse(response.data);
}

/** Download binary content from a URL into a Buffer, following redirects. */
async function downloadBinary(url, maxRedirects = 10) {
  if (maxRedirects <= 0) {
    throw new Error(`Too many redirects following ${url}`);
  }
  const chunks = [];
  const response = await new Promise((resolve, reject) => {
    const req = httpsRequest(url, {
      method: "GET",
      headers: { "User-Agent": "openspec-multiagent" },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode ?? 0) && res.headers.location) {
        resolve({ redirect: res.headers.location });
        res.resume();
        return;
      }
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => resolve({ status: res.statusCode, chunks }));
    });
    req.on("error", reject);
    req.end();
  });
  if (response.redirect) {
    return downloadBinary(response.redirect, maxRedirects - 1);
  }
  if ((response.status ?? 0) < 200 || (response.status ?? 0) >= 300) {
    throw new Error(`HTTP ${response.status} downloading ${url}`);
  }
  return Buffer.concat(response.chunks);
}

/**
 * Find the `engram` binary inside an extracted tarball directory.
 */
function findEngramBinary(dir) {
  let found = null;
  const walk = (d) => {
    if (found) return;
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.name === "engram" && entry.isFile()) {
        found = full;
        return;
      }
      if (entry.isDirectory()) walk(full);
    }
  };
  walk(dir);
  return found;
}

/**
 * Download the Engram Linux binary from GitHub releases and install it into
 * `destDir`. Uses only Node built-ins (`https`, `fs`, `child_process` for
 * `tar`). Returns the path of the installed binary.
 */
export async function downloadEngram(version, destDir) {
  if (process.platform !== "linux") {
    throw new Error(`Engram solo se puede instalar en Linux (detectado: ${process.platform}).`);
  }

  const assetSuffix = engramAssetName();
  if (!assetSuffix) {
    throw new Error("No hay asset de Engram disponible para esta plataforma.");
  }

  const tag = version && version !== "latest" ? version : "latest";
  const releaseUrl = tag === "latest"
    ? `https://api.github.com/repos/${ENGRAM_OWNER}/${ENGRAM_REPO}/releases/latest`
    : `https://api.github.com/repos/${ENGRAM_OWNER}/${ENGRAM_REPO}/releases/tags/${tag}`;

  const release = await fetchJson(releaseUrl);
  const asset = Array.isArray(release.assets)
    ? release.assets.find((a) => a.name.endsWith(assetSuffix))
    : null;
  if (!asset || !asset.browser_download_url) {
    throw new Error(
      `No se encontró un asset de Engram que termine en '${assetSuffix}' en el release ${tag} de ${ENGRAM_OWNER}/${ENGRAM_REPO}.`
    );
  }

  const tarball = await downloadBinary(asset.browser_download_url);

  const tmpDir = mkdtempSync(join(tmpdir(), "engram-install-"));
  try {
    const tarballPath = join(tmpDir, `engram${assetSuffix}`);
    writeFileSync(tarballPath, tarball);

    const extractDir = join(tmpDir, "extract");
    mkdirSync(extractDir, { recursive: true });

    const tar = spawnSync("tar", ["-xzf", tarballPath, "-C", extractDir], {
      encoding: "utf8",
      shell: false,
    });
    if (tar.status !== 0) {
      throw new Error(`No se pudo extraer el paquete de Engram: ${tar.stderr}`);
    }

    const binary = findEngramBinary(extractDir);
    if (!binary) {
      throw new Error("No se encontró el binario 'engram' dentro del paquete descargado.");
    }

    mkdirSync(destDir, { recursive: true });
    const destination = join(destDir, "engram");
    copyFileSync(binary, destination);
    chmodSync(destination, 0o755);
    return destination;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// --- Telemetry & Gates (Change 1: harden-orchestrator-gates) -------------------

import { createHash } from "node:crypto";

/** Path to the change's telemetry file. */
export function runTelemetryPath(changeName) {
  const changeDir = join(REPO_DIR, "openspec", "changes", changeName);
  return join(changeDir, ".run.json");
}

/** Path to the change's gates file. */
export function gatesPath(changeName) {
  const changeDir = join(REPO_DIR, "openspec", "changes", changeName);
  return join(changeDir, ".gates.json");
}

/** Path to the change's diff artifact. */
export function changeDiffPath(changeName) {
  const runDir = join(REPO_DIR, ".opencode", "run", changeName);
  return join(runDir, "change.diff");
}

/** Path to the scout cache file. */
export function scoutCachePath(head) {
  const cacheDir = join(REPO_DIR, ".opencode", "cache");
  return join(cacheDir, `scout-${head}.md`);
}

/** Path to an agent's bundle file. */
export function agentBundlePath(changeName, agent) {
  const runDir = join(REPO_DIR, ".opencode", "run", changeName);
  return join(runDir, `${agent}-bundle.md`);
}

/** Path to an agent's verdict file. */
export function agentVerdictPath(changeName, agent) {
  const runDir = join(REPO_DIR, ".opencode", "run", changeName);
  return join(runDir, `${agent}-verdict.json`);
}

/** Path to an agent's findings file. */
export function agentFindingsPath(changeName, agent) {
  const runDir = join(REPO_DIR, ".opencode", "run", changeName);
  return join(runDir, `${agent}-findings.json`);
}

/** Append an invocation record to .run.json (creates if missing). */
export function appendRunTelemetry(changeName, record) {
  const path = runTelemetryPath(changeName);
  mkdirSync(dirname(path), { recursive: true });
  let data = { invocations: [] };
  if (existsSync(path)) {
    try {
      data = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      // corrupted file, start fresh
    }
  }
  data.invocations.push(record);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

/** Read the telemetry file. */
export function readRunTelemetry(changeName) {
  const path = runTelemetryPath(changeName);
  if (!existsSync(path)) return { invocations: [] };
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Capture token stats via `opencode stats`. Returns null on failure. */
export async function captureTokenStats(projectRoot = REPO_DIR) {
  try {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("opencode", ["stats", "--json", "--cost", "--project", ".", "--days", "0"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status !== 0 || !result.stdout) return null;
    const stats = JSON.parse(result.stdout);
    const model = stats.models?.[0]?.tokens;
    if (!model) return null;
    return {
      input: model.input ?? 0,
      output: model.output ?? 0,
      reasoning: model.reasoning ?? 0,
      cache_read: model.cache?.read ?? 0,
      cache_write: model.cache?.write ?? 0,
      cost: stats.cost ?? 0,
    };
  } catch {
    return null;
  }
}

/** Get current git HEAD. */
export async function getGitHead(projectRoot = REPO_DIR) {
  try {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status !== 0) return null;
    return result.stdout.trim();
  } catch {
    return null;
  }
}

/** Read base_ref from .gates.json. */
export function getBaseRef(changeName) {
  const path = gatesPath(changeName);
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    return data.base_ref ?? null;
  } catch {
    return null;
  }
}

/** Write base_ref to .gates.json. */
export function setBaseRef(changeName, ref) {
  const path = gatesPath(changeName);
  mkdirSync(dirname(path), { recursive: true });
  let data = {};
  if (existsSync(path)) {
    try {
      data = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      // ignore
    }
  }
  data.base_ref = ref;
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

/** Compute change diff: git diff <baseRef> + untracked files content. */
export async function computeChangeDiff(baseRef, projectRoot = REPO_DIR) {
  const { spawnSync } = await import("node:child_process");
  let diff = "";
  try {
    const result = spawnSync("git", ["diff", baseRef], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status === 0) diff = result.stdout;
  } catch {
    // ignore
  }
  // Add untracked files
  try {
    const result = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status === 0 && result.stdout.trim()) {
      const untracked = result.stdout.trim().split("\n");
      for (const file of untracked) {
        const filePath = join(projectRoot, file);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, "utf8");
          diff += `\n\n=== UNTRACKED: ${file} ===\n${content}`;
        }
      }
    }
  } catch {
    // ignore
  }
  return diff;
}

/** Persist change diff to artifact file. */
export function persistChangeDiff(changeName, diff) {
  const path = changeDiffPath(changeName);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, diff);
}

/** Compute SHA-256 fingerprint from concatenated inputs. */
export function computeFingerprint(inputs) {
  const hash = createHash("sha256");
  for (const input of inputs) {
    if (typeof input === "string") {
      hash.update(input);
    } else if (Buffer.isBuffer(input)) {
      hash.update(input);
    } else if (input != null) {
      hash.update(String(input));
    }
  }
  return hash.digest("hex");
}

/** Load gates from .gates.json. */
export function loadGates(changeName) {
  const path = gatesPath(changeName);
  if (!existsSync(path)) return { gates: {} };
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { gates: {} };
  }
}

/** Save a gate verdict with fingerprint. */
export function saveGate(changeName, gateName, verdict, fingerprint, evidencePath) {
  const path = gatesPath(changeName);
  mkdirSync(dirname(path), { recursive: true });
  let data = { gates: {} };
  if (existsSync(path)) {
    try {
      data = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      // ignore
    }
  }
  data.gates[gateName] = {
    verdict,
    fingerprint,
    timestamp: new Date().toISOString(),
    evidence_path: evidencePath,
  };
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

/** Validate all required gates have current PASS. */
export function validateAllGatesPass(changeName, requiredGates, currentFingerprints) {
  const { gates } = loadGates(changeName);
  for (const gate of requiredGates) {
    const g = gates[gate];
    if (!g || g.verdict !== "PASS") return { ok: false, missing: gate };
    if (currentFingerprints[gate] && g.fingerprint !== currentFingerprints[gate]) {
      return { ok: false, stale: gate };
    }
  }
  return { ok: true };
}

/** Read scout cache. */
export function readScoutCache(head) {
  const path = scoutCachePath(head);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

/** Write scout cache. */
export function writeScoutCache(head, content) {
  const path = scoutCachePath(head);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/** Summarize diff if it exceeds budget. */
export function summarizeDiff(diff, maxChars = 60000) {
  if (diff.length <= maxChars) return { summary: diff, truncated: false };
  const lines = diff.split("\n");
  const fileStats = {};
  let currentFile = null;
  for (const line of lines) {
    const match = line.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (match) {
      currentFile = match[1];
      fileStats[currentFile] = (fileStats[currentFile] || 0) + 1;
    } else if (currentFile) {
      fileStats[currentFile] = (fileStats[currentFile] || 0) + 1;
    }
  }
  const summary = [
    `=== DIFF SUMMARY (truncated, ${diff.length} chars) ===`,
    `Files changed: ${Object.keys(fileStats).length}`,
    "",
    ...Object.entries(fileStats).map(([file, lines]) => `  ${file}: ${lines} lines`),
    "",
    "=== FIRST 500 LINES ===",
    lines.slice(0, 500).join("\n"),
  ].join("\n");
  return { summary, truncated: true, fileList: Object.keys(fileStats) };
}

// --- Role-Scoped Context Bundles (Change 2) --------------------------------

/** Write role-specific bundle file. */
export function writeRoleBundle(changeName, agent, content) {
  const path = agentBundlePath(changeName, agent);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/** Read role-specific bundle file. */
export function readRoleBundle(changeName, agent) {
  const path = agentBundlePath(changeName, agent);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

/** Build developer bundle: tasks + specs + design decisions + scout cache + previous findings. */
export function buildDeveloperBundle(changeName, scoutCache, previousFindings) {
  const changeDir = join(REPO_DIR, "openspec", "changes", changeName);
  const parts = [];

  // Tasks
  const tasksPath = join(changeDir, "tasks.md");
  if (existsSync(tasksPath)) {
    parts.push(`### tasks.md\n${readFileSync(tasksPath, "utf8")}`);
  }

  // Specs
  const specsDir = join(changeDir, "specs");
  if (existsSync(specsDir)) {
    const specFiles = findSpecMarkdownFiles(specsDir);
    for (const specFile of specFiles) {
      parts.push(`### ${specFile}\n${readFileSync(specFile, "utf8")}`);
    }
  }

  // Design decisions only (executive_summary, artifacts, risks, next_recommended)
  const designPath = join(changeDir, "design.md");
  if (existsSync(designPath)) {
    const designContent = readFileSync(designPath, "utf8");
    const decisions = extractDesignDecisions(designContent);
    if (decisions) parts.push(`### design.md (decisions)\n${decisions}`);
  }

  // Scout cache
  if (scoutCache) parts.push(`### repo-scout cache\n${scoutCache}`);

  // Previous findings
  if (previousFindings && previousFindings.length > 0) {
    parts.push(`### previous findings\n${JSON.stringify(previousFindings, null, 2)}`);
  }

  return parts.join("\n\n");
}

/** Extract design decisions from design.md. */
function extractDesignDecisions(content) {
  const sections = ["executive_summary", "artifacts", "risks", "next_recommended"];
  let result = "";
  for (const section of sections) {
    const pattern = new RegExp(`## ${section}[\\s\\S]*?(?=## |$)`, "i");
    const match = content.match(pattern);
    if (match) result += match[0] + "\n\n";
  }
  return result.trim();
}

/** Build test-engineer bundle: scenarios + coverage map + test conventions. */
export function buildTestEngineerBundle(changeName, scoutCache) {
  const changeDir = join(REPO_DIR, "openspec", "changes", changeName);
  const parts = [];

  // Spec scenarios (extracted WHEN/THEN)
  const specsDir = join(changeDir, "specs");
  if (existsSync(specsDir)) {
    const specFiles = findSpecMarkdownFiles(specsDir);
    for (const specFile of specFiles) {
      const content = readFileSync(specFile, "utf8");
      const scenarios = extractScenarios(content);
      if (scenarios) parts.push(`### scenarios from ${specFile}\n${scenarios}`);
    }
  }

  // Coverage map from tasks.md
  const tasksPath = join(changeDir, "tasks.md");
  if (existsSync(tasksPath)) {
    const coverageMap = extractCoverageMap(readFileSync(tasksPath, "utf8"));
    if (coverageMap) parts.push(`### coverage map\n${coverageMap}`);
  }

  // Test conventions from scout cache
  if (scoutCache) parts.push(`### test conventions\n${scoutCache}`);

  return parts.join("\n\n");
}

/** Extract scenarios from spec content. */
function extractScenarios(content) {
  const lines = content.split("\n");
  const scenarios = [];
  let inScenario = false;
  let currentScenario = [];
  for (const line of lines) {
    if (line.match(/^#### Scenario:/)) {
      if (inScenario && currentScenario.length > 0) {
        scenarios.push(currentScenario.join("\n"));
      }
      inScenario = true;
      currentScenario = [line];
    } else if (inScenario) {
      if (line.match(/^####/)) {
        scenarios.push(currentScenario.join("\n"));
        inScenario = false;
        currentScenario = [];
      } else {
        currentScenario.push(line);
      }
    }
  }
  if (inScenario && currentScenario.length > 0) {
    scenarios.push(currentScenario.join("\n"));
  }
  return scenarios.length > 0 ? scenarios.join("\n\n") : null;
}

/** Build code-reviewer bundle: diff + scenarios + clean-code criteria. */
export function buildCodeReviewerBundle(changeName, diff, scenarios) {
  const parts = [];

  // Diff (or summary if large)
  const diffResult = summarizeDiff(diff, 40000);
  if (diffResult.truncated) {
    parts.push(`### diff (summary)\n${diffResult.summary}`);
    parts.push(`### diff full path: ${changeDiffPath(changeName)}`);
  } else {
    parts.push(`### diff\n${diff}`);
  }

  // Scenarios
  if (scenarios) parts.push(`### scenarios\n${scenarios}`);

  // Clean-code criteria (12 rules)
  parts.push(`### clean-code criteria (12 rules)\n${getCleanCodeCriteria()}`);

  return parts.join("\n\n");
}

/** Build security-reviewer bundle: diff + security criteria + relevant scenarios. */
export function buildSecurityReviewerBundle(changeName, diff, scenarios) {
  const parts = [];

  // Diff (or summary if large)
  const diffResult = summarizeDiff(diff, 40000);
  if (diffResult.truncated) {
    parts.push(`### diff (summary)\n${diffResult.summary}`);
    parts.push(`### diff full path: ${changeDiffPath(changeName)}`);
  } else {
    parts.push(`### diff\n${diff}`);
  }

  // Security criteria (12 rules)
  parts.push(`### security criteria (12 rules)\n${getSecurityCriteria()}`);

  // Relevant scenarios (auth, input handling, file ops, secrets)
  if (scenarios) {
    const securityScenarios = filterSecurityScenarios(scenarios);
    if (securityScenarios) parts.push(`### security-relevant scenarios\n${securityScenarios}`);
  }

  return parts.join("\n\n");
}

/** Filter scenarios relevant to security. */
function filterSecurityScenarios(scenarios) {
  const keywords = ["auth", "login", "password", "token", "secret", "input", "upload", "file", "path", "sql", "injection", "xss", "csrf", "session", "cookie", "header", "permission", "authorization", "encryption", "hash"];
  const lines = scenarios.split("\n");
  const relevant = lines.filter(line =>
    keywords.some(kw => line.toLowerCase().includes(kw))
  );
  return relevant.length > 0 ? relevant.join("\n") : null;
}

/** Build verifier bundle: scenarios + project commands + diff --stat. */
export function buildVerifierBundle(changeName, diff, scenarios, scoutCache) {
  const parts = [];

  // Scenarios
  if (scenarios) parts.push(`### scenarios\n${scenarios}`);

  // Project commands from scout cache
  if (scoutCache) {
    const commands = extractCommands(scoutCache);
    if (commands) parts.push(`### project commands\n${commands}`);
  }

  // Diff stat
  const stat = getDiffStat(diff);
  if (stat) parts.push(`### diff --stat\n${stat}`);

  return parts.join("\n\n");
}

/** Extract test commands from scout cache. */
function extractCommands(content) {
  const lines = content.split("\n");
  const commands = lines.filter(line =>
    line.includes("test") || line.includes("build") || line.includes("lint") || line.includes("typecheck")
  );
  return commands.length > 0 ? commands.join("\n") : null;
}

/** Get diff --stat output. */
function getDiffStat(diff) {
  const lines = diff.split("\n");
  const stats = lines.filter(line => line.match(/^\s+\d+\s+\d+\s+/));
  return stats.length > 0 ? stats.join("\n") : null;
}

/** Get clean-code criteria as markdown. */
function getCleanCodeCriteria() {
  return `| # | Criterion | Rule | Severity |
|---|-----------|------|----------|
| 1 | Prohibited names | Forbidden: data, info, result, temp, item, value, obj, val, res, arr, list, handle, process, util, helper, doSomething, thing, stuff. Valid name must contain a descriptive noun. | WARNING |
| 2 | Function length | Max 30 lines (excl. comments/blanks). If > 15 lines, must be split into helper functions of max 15 lines each. | WARNING |
| 3 | SRP | Function must not combine validation + transformation + persistence. | WARNING |
| 4 | DRY | If > 5 lines of same logic appear in 2+ files, extract to function. If a string/number/regex appears in 3+ sites, define a named constant. | WARNING / SUGGESTION |
| 5 | Error anti-patterns | Forbidden: catch {}, .catch() without arg, .catch(() => {}), return null without explanation, throw new Error() without message, throw new Exception("error"). | CRITICAL / WARNING |
| 6 | Comments | Forbidden redundant patterns: // incrementa, // decrementa, // asigna, // devuelve, // verifica, // procesa, // filtra, // mapea, // cuenta, // compara, // guarda, // carga. Comments must explain WHY, not WHAT. | SUGGESTION |
| 7 | One domain per file | A file must not contain logic from 2+ domains: auth, persistence, UI, business logic, formatting utils, config. | WARNING |
| 8 | One abstraction level | A function must not mix domain operations (getUser, saveOrder, sendEmail) with low-level calls (json.parse, JSON.stringify, fs.readFileSync, new Date, Math.floor, Array.prototype.*, Object.*, String.prototype.*). | WARNING |
| 9 | Max parameters | Max 3 parameters per function. If > 3, group into an object or DTO. | WARNING |
| 10 | No boolean flags | If a function has a boolean parameter that changes its behavior, split into two separate functions. | WARNING |
| 11 | Extract conditionals | If a boolean expression has more than 2 conditions in if/while/&&/||, extract to a named function. | WARNING |
| 12 | Positive boolean names | Forbidden negative prefixes: not, no, un, in, isNot, hasNo, doNot, dont. Must use positive prefix: is, has, can, should, was. | WARNING |`;
}

/** Get security criteria as markdown. */
function getSecurityCriteria() {
  return `| # | Criterion | Rule | Severity |
|---|-----------|------|----------|
| 1 | No hardcoded secrets | Forbidden: cloud provider key patterns (AKIA..., AIza..., 00...), generic API keys (sk-..., Bearer ...), hardcoded passwords (password = '...', secret = '...'). | CRITICAL |
| 2 | SQL injection prevention | Forbidden: SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP) combined with string concatenation (+, ., .) or interpolation (\${, %s, %d). All queries must use parameter binding (?, :name, $1) or ORM methods. | CRITICAL |
| 3 | XSS prevention | Forbidden: .innerHTML, .outerHTML, .insertAdjacentHTML, document.write with user-controlled data. Template variables in HTML context must pass through an escaping function (esc(), escape(), htmlEncode()). | CRITICAL |
| 4 | Input validation | Every route/controller/action that accepts user input (HTTP params, file uploads, headers, body) must have explicit validation rules (type, length, format, range). File uploads must validate type, size, and name. | WARNING |
| 5 | Auth checks on protected routes | Every POST/PUT/DELETE/PATCH route and every route accessing sensitive data must have an authentication guard/filter/middleware. Unauthenticated requests to protected routes must return 401 or 302. | CRITICAL |
| 6 | No unsafe execution functions | Forbidden: eval(, assert(, Function( (JS), exec(, system(, passthru(, shell_exec(, proc_open(, spawn(, execSync( with user-controlled input. | CRITICAL |
| 7 | Path traversal prevention | File operations (readFile, include, require, fopen, FileReader) using user-controlled input must validate paths: no .. sequences, or resolved against a base directory (realpath, path.resolve, normalize). Download endpoints must whitelist extensions and reject .. | WARNING |
| 8 | Secure error handling | Forbidden: var_dump(, print_r(, debug_print_backtrace(, console.log( with variable names containing password, secret, key, token, sql, query outside test files. Error responses must not include stack traces, file paths, or SQL queries. | WARNING |
| 9 | CSRF protection | Every POST/PUT/DELETE/PATCH route must have CSRF validation (token check, origin/referrer validation, or SameSite cookie attribute). GET routes must not modify server state. | WARNING |
| 10 | Secure password storage | Passwords must be hashed using a strong algorithm (password_hash, bcrypt.hash, argon2, scrypt, pbkdf2). Forbidden: plain-text storage, MD5/SHA1/SHA256 alone for password hashing. | CRITICAL |
| 11 | Secure session configuration | Session/cookie configuration must have HttpOnly = true, Secure = true (in production), SameSite = Lax or Strict. | WARNING |
| 12 | Security headers | HTTP responses must include at minimum X-Content-Type-Options: nosniff and X-Frame-Options: DENY or SAMEORIGIN. | SUGGESTION |`;
}

/** Verdict interface (JSDoc). */
/**
 * @typedef {Object} Verdict
 * @property {string} agent
 * @property {"PASS"|"FAIL"|"UNVERIFIABLE"} verdict
 * @property {Array<{id:string, severity:"CRITICAL"|"WARNING"|"SUGGESTION", status:"open"|"resolved", evidence:string, file?:string, line?:number}>} findings
 * @property {string} summary
 */

/** Write verdict JSON file. */
export function writeVerdict(changeName, agent, verdict) {
  const path = agentVerdictPath(changeName, agent);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(verdict, null, 2));
}

/** Read verdict JSON file. */
export function readVerdict(changeName, agent) {
  const path = agentVerdictPath(changeName, agent);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}
