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
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  if (result.error || result.status !== 0) return null;
  return (result.stdout ?? "").trim();
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
export function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/**
 * Shared readline interface. One per process: creating a fresh interface on the
 * same stdin for every question loses buffered input and makes EOF handling
 * unreliable. Lazily created so non-interactive runs never touch stdin.
 */
let readline = null;
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
 * Ask one question and return the trimmed answer, or `null` when stdin ends
 * (Ctrl+D) or the session goes away.
 *
 * Uses raw mode + event loop instead of readline.question() because readline
 * doesn't reliably wait for input in all TTY environments.
 */
function ask(question) {
  return new Promise((resolve) => {
    const stream = process.stdin;
    if (stream.readableEnded) {
      resolve(null);
      return;
    }

    // Write the question prompt
    process.stdout.write(question);

    let rawModeEnabled = false;

    const cleanup = () => {
      if (rawModeEnabled) {
        try {
          stream.setRawMode(false);
        } catch {
          // Ignore errors when disabling raw mode
        }
      }
      stream.off("data", onData);
      stream.off("end", onEnd);
      stream.off("close", onClose);
    };

    const onData = (chunk) => {
      const str = chunk.toString();
      if (str.includes("\n") || str.includes("\r")) {
        cleanup();
        resolve(str.trim());
      }
    };

    const onEnd = () => { cleanup(); resolve(null); };
    const onClose = () => { cleanup(); resolve(null); };

    try {
      stream.setRawMode(true);
      rawModeEnabled = true;
      stream.on("data", onData);
      stream.on("end", onEnd);
      stream.on("close", onClose);
    } catch {
      // If raw mode fails, fall back to readline
      try {
        stream.setRawMode(false);
      } catch {
        // Ignore
      }
      io()
        .question(question)
        .then((answer) => resolve(answer.trim()))
        .catch(() => resolve(null));
    }
  });
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
export async function askYesNo(question, { defaultYes = true } = {}) {
  if (!isInteractive()) return defaultYes;
  const hint = defaultYes ? "Y/n" : "y/N";
  const answer = await ask(`${question} [${hint}] `);
  if (answer === null || answer === "") return defaultYes;
  const normalized = answer.toLowerCase();
  return normalized === "y" || normalized === "yes";
}

/** Ask for a free-text value. Returns `fallback` when the answer is empty. */
export async function askText(question, { fallback = "" } = {}) {
  // Always try to read via ask() first (handles both TTY and piped input)
  const answer = await ask(`${question} `);
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
  const prompt = `Select model for ${agentName} (1-${options.length}, Enter=${recommendedId}): `;
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

// --- OpenCode Go (Zen) model selection -----------------------------------------

/**
 * Fallback provider mapping for models not found in the scraped endpoint table.
 * Grouped by AI SDK package. All remaining models default to @ai-sdk/openai-compatible.
 */
export const ZEN_PROVIDER_FALLBACK = {
  // @ai-sdk/openai
  "muse-spark-1.3-contributor": { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  "muse-spark-1.2-contributor": { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  "gpt-6-luna":                 { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  "gpt-5.6-luna":               { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  "grok-4.7":                   { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  // @ai-sdk/anthropic
  "claude-haiku-5-5":           { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  "minimax-m3":                 { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  "qwen3.8-max":                { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  "qwen3.8-flash":              { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  "qwen3.7-plus":               { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  // @ai-sdk/google
  "gemini-4-argon":             { sdk: "@ai-sdk/google", endpoint: "https://opencode.ai/inference/go/google/v1beta/models/gemini-4-argon" },
};

/**
 * Embedded pricing data for Go models (plan Go — $10/mo).
 * Prices per 1M tokens from opencode.ai/v2/docs/console/go/
 * Updated: 2026-10-26
 *
 * Monthly limits are for the Go ($10/mo) plan. Go Plus ($40/mo) limits
 * are higher per model — see the official pricing table for details.
 * Beam Free: null = unlimited.
 *
 * Models with context-length-dependent pricing (e.g. Grok 4.7 ≤200K vs >200K)
 * use the ≤ limit prices as the canonical entry.
 * DeepSeek V4.1 Flash / V4 Pro use off-peak pricing.
 */
export const ZEN_EMBEDDED_PRICING = [
  { modelId: "glm-5.3-flash", displayName: "GLM-5.3-Flash", inputPrice: 0.15, outputPrice: 0.50, monthlyLimit: 60 },
  { modelId: "glm-5.3", displayName: "GLM-5.3", inputPrice: 1.40, outputPrice: 4.40, monthlyLimit: 15 },
  { modelId: "glm-5.2", displayName: "GLM-5.2", inputPrice: 1.40, outputPrice: 4.40, monthlyLimit: 60 },
  { modelId: "kimi-k3.1-pro", displayName: "Kimi K3.1 Pro", inputPrice: 2.00, outputPrice: 10.00, monthlyLimit: 15 },
  { modelId: "kimi-k3", displayName: "Kimi K3", inputPrice: 3.00, outputPrice: 15.00, monthlyLimit: 15 },
  { modelId: "kimi-k2.7-code", displayName: "Kimi K2.7 Code", inputPrice: 0.95, outputPrice: 4.00, monthlyLimit: 60 },
  { modelId: "longcat-2.0", displayName: "LongCat-2.0", inputPrice: 0.30, outputPrice: 1.20, monthlyLimit: 60 },
  { modelId: "step-5-preview", displayName: "Step 5 Preview", inputPrice: 1.00, outputPrice: 2.70, monthlyLimit: 15 },
  { modelId: "beam-free", displayName: "Beam Free", inputPrice: 0, outputPrice: 0, monthlyLimit: null },
  { modelId: "mimo-v2.6-flash", displayName: "MiMo-V2.6-Flash", inputPrice: 0.14, outputPrice: 0.28, monthlyLimit: 60 },
  { modelId: "mimo-v2.6-pro", displayName: "MiMo-V2.6-Pro", inputPrice: 0.435, outputPrice: 0.87, monthlyLimit: 15 },
  { modelId: "mimo-v2.5", displayName: "MiMo-V2.5", inputPrice: 0.14, outputPrice: 0.28, monthlyLimit: 60 },
  { modelId: "mimo-v2.5-pro", displayName: "MiMo-V2.5-Pro", inputPrice: 0.435, outputPrice: 0.87, monthlyLimit: 15 },
  { modelId: "minimax-m3.1-flash", displayName: "MiniMax M3.1 Flash", inputPrice: 0.15, outputPrice: 0.60, monthlyLimit: 20 },
  { modelId: "minimax-m3", displayName: "MiniMax M3", inputPrice: 0.30, outputPrice: 1.20, monthlyLimit: 60 },
  { modelId: "muse-spark-1.3-contributor", displayName: "Muse Spark 1.3 Contributor", inputPrice: 0.10, outputPrice: 0.20, monthlyLimit: 60 },
  { modelId: "muse-spark-1.2-contributor", displayName: "Muse Spark 1.2 Contributor", inputPrice: 0.10, outputPrice: 0.20, monthlyLimit: 60 },
  { modelId: "qwen3.8-max", displayName: "Qwen3.8 Max", inputPrice: 2.00, outputPrice: 6.00, monthlyLimit: 15 },
  { modelId: "qwen3.8-flash", displayName: "Qwen3.8 Flash", inputPrice: 0.15, outputPrice: 0.47, monthlyLimit: 30 },
  { modelId: "qwen3.7-plus", displayName: "Qwen3.7 Plus", inputPrice: 0.40, outputPrice: 1.60, monthlyLimit: 60 },
  { modelId: "deepseek-v4.1-flash", displayName: "DeepSeek V4.1 Flash", inputPrice: 0.15, outputPrice: 0.60, monthlyLimit: 80 },
  { modelId: "deepseek-v4-pro", displayName: "DeepSeek V4 Pro", inputPrice: 0.66, outputPrice: 1.98, monthlyLimit: 15 },
  { modelId: "hy4-preview", displayName: "Hy4 preview", inputPrice: 0.834, outputPrice: 2.501, monthlyLimit: 30 },
  { modelId: "hy3", displayName: "Hy3", inputPrice: 0.14, outputPrice: 0.58, monthlyLimit: 60 },
  { modelId: "grok-4.7", displayName: "Grok 4.7", inputPrice: 2.00, outputPrice: 6.00, monthlyLimit: 15 },
  { modelId: "gpt-6-luna", displayName: "GPT 6 Luna", inputPrice: 0.10, outputPrice: 0.50, monthlyLimit: 15 },
  { modelId: "gpt-5.6-luna", displayName: "GPT 5.6 Luna", inputPrice: 0.20, outputPrice: 1.20, monthlyLimit: 15 },
  { modelId: "claude-haiku-5-5", displayName: "Claude Haiku 5.5", inputPrice: 0.10, outputPrice: 0.50, monthlyLimit: 15 },
  { modelId: "gemini-4-argon", displayName: "Gemini 4 Argon", inputPrice: 2.00, outputPrice: 10.00, monthlyLimit: 30 },
];

/**
 * Fetch an HTML page from the OpenCode Go docs endpoint.
 * Returns `{ status, data }` or null on network error.
 */
export async function fetchDocsPage() {
  const url = "https://opencode.ai/v2/docs/console/go/";
  try {
    const response = await new Promise((resolve, reject) => {
      const req = httpsRequest(url, {
        method: "GET",
        headers: { "User-Agent": "openspec-multiagent", Accept: "text/html" },
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => resolve({ status: res.statusCode, data }));
      });
      req.on("error", reject);
      req.end();
    });
    return response;
  } catch {
    // Network error or timeout — caller handles fallback
    return null;
  }
}

/**
 * Fetch HTML from the OpenCode Go docs page and extract the pricing table.
 * Returns an array of pricing entries or null on failure.
 */
export async function fetchZenPricing() {
  const page = await fetchDocsPage();
  if (!page) return null;
  if (page.status < 200 || page.status >= 300) return null;
  return parseZenPricingTable(page.data);
}

/**
 * Fetch the raw HTML from the OpenCode Go docs page.
 * Returns the HTML string or null on failure.
 */
export async function fetchZenHtml() {
  const page = await fetchDocsPage();
  if (!page) return null;
  if (page.status < 200 || page.status >= 300) return null;
  return page.data;
}

/** Fetch endpoint table from HTML and return embedded pricing with endpoint info merged. */
export async function fetchZenData() {
  const html = await fetchZenHtml();
  const endpointMap = html ? parseZenEndpointTable(html) : {};

  // Use embedded pricing as the primary source
  const pricing = ZEN_EMBEDDED_PRICING.map((p) => {
    const endpointInfo = Object.entries(endpointMap).find(
      ([name]) => name.toLowerCase() === p.displayName.toLowerCase(),
    );
    return {
      modelId: p.modelId,
      displayName: p.displayName,
      inputPrice: p.inputPrice,
      outputPrice: p.outputPrice,
      cachedReadPrice: p.inputPrice * 0.5,
      monthlyLimit: p.monthlyLimit,
      sdk: endpointInfo ? endpointInfo.sdk : null,
      endpoint: endpointInfo ? endpointInfo.endpoint : null,
    };
  });

  return { html, pricing };
}

/**
 * Extract pricing table from the `<div slot="go">` section of the HTML.
 * Parses markdown pipe-table rows into structured objects.
 */
export function parseZenPricingTable(html) {
  const goSection = extractGoSection(html);
  if (!goSection) return null;
  const tableBody = extractTableBody(goSection, /^\|\s*Model\s*\|/m);
  if (!tableBody) return null;
  const entries = parsePricingRows(tableBody);
  return deduplicatePricing(entries);
}

/** Extract the `<div slot="go">` section from HTML. */
function extractGoSection(html) {
  const slotStart = html.indexOf('slot="go"');
  if (slotStart === -1) return null;
  const slotEnd = html.indexOf('slot="go-plus"', slotStart);
  return slotEnd === -1 ? html.slice(slotStart) : html.slice(slotStart, slotEnd);
}

/** Extract the table body after the header row. */
function extractTableBody(section, headerPattern) {
  const match = section.match(headerPattern);
  if (!match) return null;
  const headerIdx = section.indexOf("|", match.index);
  const tableStart = section.indexOf("\n", headerIdx);
  if (tableStart === -1) return null;
  return section.slice(tableStart + 1);
}

/** Build a pricing entry from validated components. */
function makePricingEntry(displayName, inputPrice, cells) {
  return {
    modelId: displayName,
    displayName,
    inputPrice,
    outputPrice: parsePrice(cells[2]),
    cachedReadPrice: parsePrice(cells[3]),
    monthlyLimit: parseMonthlyLimit(cells[4]),
  };
}

/** Parse a single pricing table row into an entry object, or null. */
function parsePricingRow(trimmed) {
  const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
  if (cells.length < 5) return null;

  const displayName = stripModelSuffixes(cells[0]);
  const inputPrice = parsePrice(cells[1]);
  if (!displayName || inputPrice === null) return null;

  return makePricingEntry(displayName, inputPrice, cells);
}

/** Parse markdown pipe-table rows into pricing entry objects. */
function parsePricingRows(tableBody) {
  const rows = tableBody.split("\n");
  const entries = [];

  for (const rawRow of rows) {
    const trimmed = rawRow.trim();
    if (!trimmed.startsWith("|") || /^\|\s*[-:]+\s*\|/.test(trimmed)) continue;

    const entry = parsePricingRow(trimmed);
    if (entry) entries.push(entry);
  }

  return entries;
}

/**
 * Strip variant suffixes from model display names.
 * Removes `(≤ ... tokens)`, `(> ... tokens)`, `(Peak)`, `(Off-Peak)`, `(50% off)`.
 */
export function stripModelSuffixes(name) {
  return name
    .replace(/\s*\(≤\s*.*?tokens\)\s*/gi, "")
    .replace(/\s*\(>\s*.*?tokens\)\s*/gi, "")
    .replace(/\s*\(Peak\)\s*/gi, "")
    .replace(/\s*\(Off-Peak\)\s*/gi, "")
    .replace(/\s*\(50% off\)\s*/gi, "")
    .replace(/\s*—\s*.*$/, "")
    .trim();
}

/**
 * Parse a price string like "$0.15", "Free", or "~~$4.00~~ $2.00" into a number.
 * Returns null for unparseable values.
 */
export function parsePrice(text) {
  if (!text || text === "Free") return 0;
  // Handle strikethrough: ~~$4.00~~ $2.00 → use the non-strikethrough price
  const cleaned = text.replace(/~~[^~]*~~\s*/g, "");
  const match = cleaned.match(/\$([\d.]+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Parse monthly limit: "$60", "**Unlimited**" → number or null.
 */
export function parseMonthlyLimit(text) {
  if (!text) return null;
  const clean = text.replace(/\*\*/g, "").trim();
  if (clean.toLowerCase() === "unlimited") return null;
  const match = clean.match(/\$([\d.]+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Deduplicate pricing entries by base model name, keeping the cheapest variant.
 * Cheapest = lowest inputPrice, then lowest outputPrice.
 */
export function deduplicatePricing(entries) {
  const byName = new Map();
  for (const entry of entries) {
    const existing = byName.get(entry.modelId);
    if (!existing || isCheaper(entry, existing)) {
      byName.set(entry.modelId, entry);
    }
  }
  return Array.from(byName.values());
}

/** True when `candidate` is cheaper than `current`. */
export function isCheaper(candidate, current) {
  if (candidate.inputPrice < current.inputPrice) return true;
  if (candidate.inputPrice === current.inputPrice && candidate.outputPrice < current.outputPrice) return true;
  return false;
}

/**
 * Parse the endpoint table from the Go docs HTML.
 * Returns a map: { [modelName]: { modelId, endpoint, sdk } }.
 */
export function parseZenEndpointTable(html) {
  const goSection = extractGoSection(html);
  if (!goSection) return {};
  const tableBody = extractTableBody(goSection, /\|\s*Model\s*.*?\|\s*Model\s*ID\s*\|/m);
  if (!tableBody) return {};
  return parseEndpointRows(tableBody);
}

/** Parse a single endpoint table row into an entry object, or null. */
function parseEndpointRow(trimmed) {
  const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
  if (cells.length < 4) return null;

  const displayName = stripModelSuffixes(cells[0]);
  const modelId = cells[1];
  const endpoint = cells[2].replace(/`/g, "").trim();
  const sdk = cells[3].replace(/`/g, "").trim();

  if (!displayName || !modelId || !endpoint || !sdk) return null;
  return { modelId, endpoint, sdk };
}

/** Parse markdown pipe-table rows into endpoint entry objects. */
function parseEndpointRows(tableBody) {
  const rows = tableBody.split("\n");
  const map = {};

  for (const rawRow of rows) {
    const trimmed = rawRow.trim();
    if (!trimmed.startsWith("|") || /^\|\s*[-:]+\s*\|/.test(trimmed)) continue;

    const displayName = stripModelSuffixes(trimmed.split("|")[1].trim());
    const entry = parseEndpointRow(trimmed);
    if (entry) map[displayName] = entry;
  }

  return map;
}

/**
 * Fetch the model list from the OpenCode Go API.
 * Returns an array of model IDs, or null on failure.
 */
export async function fetchZenModels() {
  try {
    const response = await fetchJson("https://opencode.ai/inference/go/v1/models");
    if (Array.isArray(response?.data?.models)) {
      return response.data.models.map((m) => m.id);
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return null;
  } catch {
    // Network error or timeout — caller handles fallback
    return null;
  }
}

/**
 * Convert a model ID to a display name (e.g., "mimo-v2.6-flash" → "MiMo-V2.6-Flash").
 */
export function modelIdToDisplay(id) {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Look up endpoint info by display name, or null. */
function resolveEndpointInfo(displayName, endpointMap) {
  const found = Object.entries(endpointMap).find(
    ([name]) => name.toLowerCase() === displayName.toLowerCase(),
  );
  return found ? found[1] : null;
}

/** Calculate estimated cost per request from price entries. */
function calcEstimatedCost(inputPrice, outputPrice) {
  return (inputPrice / 1_000_000) * 2000 + (outputPrice / 1_000_000) * 500;
}

/** Build a single display object from a pricing entry. */
function buildDisplayEntry(entry, endpointMap) {
  const ep = resolveEndpointInfo(entry.displayName, endpointMap);

  return {
    modelId: entry.modelId,
    displayName: entry.displayName,
    inputPrice: entry.inputPrice,
    outputPrice: entry.outputPrice,
    monthlyLimit: entry.monthlyLimit,
    estCostPerRequest: calcEstimatedCost(entry.inputPrice, entry.outputPrice),
    hasPricing: true,
    sdk: ep ? ep.sdk : null,
    endpoint: ep ? ep.endpoint : null,
  };
}

/**
 * Build display objects from pricing entries and the endpoint table map.
 * Calculates estimated cost per request and sorts by cost (cheapest first).
 * Models without pricing are placed at the end.
 */
export function getZenModelDisplay(pricingEntries, endpointMap) {
  const displayList = pricingEntries.map((entry) =>
    buildDisplayEntry(entry, endpointMap),
  );

  displayList.sort((a, b) => {
    if (a.hasPricing && !b.hasPricing) return -1;
    if (!a.hasPricing && b.hasPricing) return 1;
    return a.estCostPerRequest - b.estCostPerRequest;
  });

  return displayList;
}

/**
 * Interactive prompt to select a model for a specific agent.
 * Returns the selected model ID (e.g., "mimo-v2.6-flash").
 * In non-interactive mode, returns the recommended model ID without prompting.
 */
export async function selectZenModelForAgent(agentName, models, recommendedId) {
  if (!isInteractive()) return recommendedId;

  const options = models.map((m) => ({
    value: m.modelId,
    label: formatModelOption(m),
    hint: m.hasPricing
      ? `$${m.inputPrice}/$${m.outputPrice} per M tokens`
      : "N/A",
  }));

  const defaultIndex = models.findIndex((m) => m.modelId === recommendedId);
  const fallback = models[defaultIndex >= 0 ? defaultIndex : 0].modelId;

  console.log(`\nSelect model for ${agentName}:`);
  console.log(`  ${"#".padEnd(3)}  ${"Model".padEnd(30)}  ${"Input".padEnd(10)}  ${"Output".padEnd(10)}  ${"Est.".padEnd(10)}  ${"Limit".padEnd(12)}`);
  console.log(`     ${"─".repeat(30)}  ${"─".repeat(10)}  ${"─".repeat(10)}  ${"─".repeat(10)}  ${"─".repeat(12)}`);

  for (let i = 0; i < models.length; i++) {
    const m = models[i];
    const marker = (m.modelId === recommendedId) ? " ★" : "";
    const num = String(i + 1).padStart(2);
    const name = m.displayName.padEnd(30);
    const inp = (m.inputPrice === null || m.inputPrice === undefined) ? "N/A" : `$${m.inputPrice}`.padEnd(10);
    const out = (m.outputPrice === null || m.outputPrice === undefined) ? "N/A" : `$${m.outputPrice}`.padEnd(10);
    const estVal = m.estCostPerRequest;
    const est = (estVal === null || estVal === undefined || !isFinite(estVal)) ? "N/A" : `$${estVal.toFixed(4)}`.padEnd(10);
    const lim = (m.monthlyLimit === null || m.monthlyLimit === undefined) ? "Plan-dependent" : `$${m.monthlyLimit}/mo`.padEnd(12);
    console.log(`  ${num}  ${name}  ${inp}  ${out}  ${est}  ${lim}${marker}`);
  }

  while (true) {
    const answer = await ask(`Choose 1-${options.length} (Enter=${recommendedId}): `);
    if (answer === null || answer === "") return fallback;

    const picked = Number.parseInt(answer, 10);
    if (Number.isInteger(picked) && picked >= 1 && picked <= options.length) {
      return models[picked - 1].modelId;
    }
    // Invalid input — loop to re-prompt
  }
}

/**
 * Interactive arrow-key model selector.
 * Shows the model table with a highlight indicator (▶) on the selected row.
 * Uses arrow keys (↑↓) to navigate, Enter to confirm, Esc/Ctrl+C to fallback.
 *
 * @param {Array} models - Array of model display objects (from getZenModelDisplay)
 * @param {string} recommendedId - The recommended model ID (used as fallback on cancel)
 * @param {string} [initialId] - Optional model ID to start highlighted (defaults to recommendedId)
 * @returns {Promise<string>} - Selected model ID, or recommendedId on cancel/EOF
 */
export async function selectModelFromList(models, recommendedId, initialId) {
  if (!isInteractive()) return recommendedId;
  if (models.length === 0) return recommendedId;

  const startId = initialId ?? recommendedId;
  const startIndex = models.findIndex((m) => m.modelId === startId);
  let selectedIndex = startIndex >= 0 ? startIndex : 0;

  function buildRow(m, index) {
    const num = String(index + 1).padStart(2);
    const name = m.displayName.padEnd(30);
    const inp = (m.inputPrice == null) ? "N/A" : `$${m.inputPrice}`.padEnd(10);
    const out = (m.outputPrice == null) ? "N/A" : `$${m.outputPrice}`.padEnd(10);
    const estVal = m.estCostPerRequest;
    const est = (estVal == null || !isFinite(estVal)) ? "N/A" : `$${estVal.toFixed(4)}`.padEnd(10);
    const lim = (m.monthlyLimit == null) ? "Plan-dependent" : `$${m.monthlyLimit}/mo`.padEnd(12);
    const marker = (m.modelId === recommendedId) ? " ★" : "";
    return `  ${num}  ${name}  ${inp}  ${out}  ${est}  ${lim}${marker}`;
  }

  function renderRow(m, index) {
    const prefix = index === selectedIndex ? "▶ " : "  ";
    process.stdout.write("\r" + prefix + buildRow(m, index).slice(2) + "\n");
  }

  // Initial render: table once, save cursor
  console.log(`\nSelect model:`);
  console.log(`  ${"#".padEnd(3)}  ${"Model".padEnd(30)}  ${"Input".padEnd(10)}  ${"Output".padEnd(10)}  ${"Est.".padEnd(10)}  ${"Limit".padEnd(12)}`);
  console.log(`     ${"─".repeat(30)}  ${"─".repeat(10)}  ${"─".repeat(10)}  ${"─".repeat(10)}  ${"─".repeat(12)}`);

  for (let i = 0; i < models.length; i++) {
    renderRow(models[i], i);
  }

  console.log(`  ↑↓ navigate  •  Enter confirm  •  Esc cancel`);
  process.stdout.write("\x1b[s"); // save cursor position

  const ESC = 0x1b;
  const LSQ = 0x5b;
  const ARROW_UP = 0x41;
  const ARROW_DOWN = 0x42;
  const LF = 0x0a;
  const CR = 0x0d;

  function isArrowUp(buf, pos) {
    return pos + 2 < buf.length && buf[pos] === ESC && buf[pos + 1] === LSQ && buf[pos + 2] === ARROW_UP;
  }

  function isArrowDown(buf, pos) {
    return pos + 2 < buf.length && buf[pos] === ESC && buf[pos + 1] === LSQ && buf[pos + 2] === ARROW_DOWN;
  }

  function isEnter(byte) {
    return byte === LF || byte === CR;
  }

  function isLoneEscape(buf, pos) {
    return buf[pos] === ESC && !(pos + 1 < buf.length && buf[pos + 1] === LSQ);
  }

  function isPartialEscape(buf, pos) {
    return buf[pos] === ESC && pos + 1 < buf.length && buf[pos + 1] === LSQ;
  }

  // Cursor-based row update — only touches 2 rows
  function updateHighlight(oldIdx, newIdx) {
    const n = models.length;
    // Restore to saved cursor (line after hint), move up to model[oldIdx]
    process.stdout.write("\x1b[u\x1b[" + (n - oldIdx + 1) + "A");
    // Clear old row and rewrite without marker
    process.stdout.write("\x1b[2K\r  " + buildRow(models[oldIdx], oldIdx).slice(2));
    // Move to newIdx row
    const delta = newIdx - oldIdx;
    if (delta > 0) process.stdout.write("\x1b[" + delta + "B");
    else if (delta < 0) process.stdout.write("\x1b[" + (-delta) + "A");
    // Clear new row and rewrite with marker
    process.stdout.write("\x1b[2K\r▶ " + buildRow(models[newIdx], newIdx).slice(2));
  }

  return new Promise((resolve) => {
    const stream = process.stdin;

    function cleanup() {
      stream.setRawMode(false);
      stream.off("data", onData);
      stream.off("end", onEnd);
      stream.off("close", onClose);
    }

    function finish(result) {
      cleanup();
      resolve(result);
    }

    function onData(chunk) {
      const buf = Buffer.from(chunk);
      let pos = 0;

      while (pos < buf.length) {
        if (isArrowUp(buf, pos)) {
          const oldIdx = selectedIndex;
          selectedIndex = selectedIndex === 0 ? models.length - 1 : selectedIndex - 1;
          updateHighlight(oldIdx, selectedIndex);
          pos += 3;
          continue;
        }

        if (isArrowDown(buf, pos)) {
          const oldIdx = selectedIndex;
          selectedIndex = selectedIndex === models.length - 1 ? 0 : selectedIndex + 1;
          updateHighlight(oldIdx, selectedIndex);
          pos += 3;
          continue;
        }

        if (isLoneEscape(buf, pos)) {
          const hintLine = models.length + 1;
          process.stdout.write("\x1b[u\x1b[" + hintLine + "B\n");
          finish(recommendedId);
          return;
        }

        if (isPartialEscape(buf, pos)) {
          pos++;
          continue;
        }

        if (isEnter(buf[pos])) {
          // Move cursor below the table before returning
          const hintLine = models.length + 1;
          process.stdout.write("\x1b[u\x1b[" + hintLine + "B\n");
          finish(models[selectedIndex].modelId);
          return;
        }

        pos++;
      }
    }

    function onEnd() { finish(recommendedId); }
    function onClose() { finish(recommendedId); }

    try {
      stream.setRawMode(true);
    } catch {
      return resolve(recommendedId);
    }

    stream.on("data", onData);
    stream.on("end", onEnd);
    stream.on("close", onClose);
  });
}

/** Format a model entry for display in the selection prompt. */
function formatModelOption(m) {
  const estPerRequest = m.hasPricing
    ? `$${m.estCostPerRequest.toFixed(4)}`
    : "N/A";
  const limit = m.monthlyLimit !== null ? `$${m.monthlyLimit}/mo` : "Plan-dependent";
  return `${m.displayName}  $${m.inputPrice}/$${m.outputPrice}  est. ${estPerRequest}  ${limit}`;
}

/** Read and parse the config file, or return empty object. */
function readProviderConfig() {
  const target = mcpConfigFile();
  if (!existsSync(target)) return { data: {}, jsonc: false, target };
  const result = readJsonc(target);
  return { ...result, target };
}

/** Check if opencode-go provider exists and return it, or null. */
function findExistingProvider(configData) {
  return configData?.providers?.["opencode-go"] ?? null;
}

/** Resolve the SDK package and endpoint for a model ID from the fallback map. */
function resolveModelConfig(modelId) {
  const fallback = ZEN_PROVIDER_FALLBACK[modelId];
  if (fallback) return fallback;
  return {
    sdk: "@ai-sdk/openai-compatible",
    endpoint: "https://opencode.ai/inference/go/openai/v1/chat/completions",
  };
}

/** Build a new opencode-go provider entry. */
function buildNewProviderEntry(cheapestModel, apiKey) {
  const config = resolveModelConfig(cheapestModel);
  const entry = {
    name: "OpenCode Go (Zen)",
    package: config.sdk,
    model: `opencode-go/${cheapestModel}`,
    settings: {
      baseURL: config.endpoint,
    },
  };
  if (apiKey) entry.apiKey = apiKey;
  return entry;
}

/** Build the JSONC error snippet for manual provider config. */
function buildProviderConfigSnippet() {
  return JSON.stringify({
    providers: {
      "opencode-go": {
        name: "OpenCode Go (Zen)",
        package: "@ai-sdk/openai-compatible",
        settings: {
          baseURL: "https://opencode.ai/inference/go/openai/v1/chat/completions",
        },
      },
    },
  }, null, 2);
}

/** Validate that the config file is not JSONC (which would be destroyed by rewrite). */
function validateConfigFormat(jsonc, target) {
  if (!jsonc) return;
  const snippet = buildProviderConfigSnippet();
  throw new Error(
    `${target} contains JSON comments (JSONC). Rewriting would destroy them.\n` +
    `       Add this block by hand:\n\n${snippet}`
  );
}

/** Update an existing provider's model and optionally its API key. */
function updateExistingProvider(existing, cheapestModel, apiKey) {
  existing.model = `opencode-go/${cheapestModel}`;
  if (apiKey) existing.apiKey = apiKey;
}

/**
 * Configure the opencode-go provider in the user's OpenCode config.
 * If the provider already exists, only updates the model field.
 * If it doesn't exist, writes a full provider entry.
 * Returns { model, providerConfigured }.
 */
export async function configureZenProvider(selectedDisplayObjects, apiKey) {
  const { data: configData, jsonc, target } = readProviderConfig();
  validateConfigFormat(jsonc, target);

  const cheapestModel = selectedDisplayObjects[0]?.modelId ?? "mimo-v2.6-flash";
  const existing = findExistingProvider(configData);

  configData.providers ??= {};

  if (existing) {
    updateExistingProvider(existing, cheapestModel, apiKey);
  } else {
    configData.providers["opencode-go"] = buildNewProviderEntry(cheapestModel, apiKey);
  }

  writeConfig(target, configData);
  return { model: `opencode-go/${cheapestModel}`, providerConfigured: true };
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
