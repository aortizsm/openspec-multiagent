# OpenCode OpenSpec Multi-Agent

A multi-agent orchestrated development workflow that uses [OpenSpec](https://openspec.dev) as the source of truth for product and architecture requirements. Agents collaborate in a structured loop — from specification through implementation to review — keeping every change grounded in a written spec before the implementation starts.

## Agents

| Agent | Mode | Role |
|---|---|---|
| [@architect](opencode/agents/architect.md) | primary | Drives the full delivery loop: clarifies requirements, creates OpenSpec specifications, delegates implementation, and evaluates review output. Never writes code itself, and is the only agent that closes/archives a spec. |
| [@developer](opencode/agents/developer.md) | subagent | Implements the spec assigned by `@architect` using the `openspec-apply-change` skill. Runs all checks before reporting completion. |
| [@code-reviewer](opencode/agents/code-reviewer.md) | subagent | Reviews every change against the OpenSpec change definition. Issues actionable change requests or approves; cannot modify code and does not close specs. |
| [@repo-scout](opencode/agents/repo-scout.md) | subagent | Scans the repository read-only and reports detected stack, conventions, linting/test commands, and structural hotspots directly in its response. |
| [@diff-summarizer](opencode/agents/diff-summarizer.md) | subagent | Produces a terse, high-signal summary of git diffs, flagging risk hotspots so `@architect` and `@code-reviewer` can orient quickly. |

## Requirements

The workflow depends on the OpenSpec CLI and its generated skills:

| Component | Minimum version | Why |
|---|---|---|
| Node.js | `>= 20.19.0` | Required by the OpenSpec CLI, and runs the setup scripts. |
| [`@fission-ai/openspec`](https://www.npmjs.com/package/@fission-ai/openspec) | `>= 1.14.0` | Installs the `openspec-*` skills the agents load. Older versions use different skill names and the workflow breaks. |
| [`openspec-mcp`](https://www.npmjs.com/package/openspec-mcp) | any | MCP server exposing OpenSpec operations to the agents. |
| [Context7](https://context7.com) | any | Up-to-date library/framework docs. A `context7` entry under `mcp.servers`, or the `ctx7` CLI. |
| [OpenCode](https://opencode.ai) | V2 | Agent definitions use the V2 `mode` / `permissions` frontmatter, and config uses `mcp.servers`. |

These are declared in [`package.json`](package.json) and enforced by `scripts/check.mjs`, so a fresh clone cannot silently run against an incompatible OpenSpec or a dead Context7 entry.

## Workflow

```
User ──► @architect
             │
             ├─ preflight: verify openspec CLI/skills (>= 1.14.0) and context7
             │
             ├─ calls @repo-scout (first run or on repo change)
             │
             ├─ guides user through openspec-explore / openspec-propose
             │   to build the OpenSpec specification
             │
             │  [on explicit user approval]
             │
             ├─► @developer  (openspec-apply-change)
             │       │
             │       └─► reports completion
             │
             ├─► @code-reviewer
             │       │
             │       ├─ change requests ──► @developer (loop)
             │       │
             │       └─ approved ──► @architect
             │
             └─► @architect closes the spec (openspec-archive-change)
```

1. **Preflight** — `@architect` verifies the OpenSpec CLI and skills are present and at the required version, and stops with install instructions otherwise.
2. **Discovery** — `@architect` inspects the repo (via `@repo-scout` if needed) and collaborates with the user to define an OpenSpec specification using the `openspec-explore` and `openspec-propose` skills.
3. **Approval gate** — implementation only starts after the user explicitly approves.
4. **Implementation** — `@developer` applies the spec (`openspec-apply-change`), follows existing repo conventions, adds tests, and validates with linters/type-checkers before reporting back.
5. **Review** — `@code-reviewer` reads the OpenSpec change, runs `git diff`, checks correctness, security, and test coverage, and either requests changes or approves.
6. **Loop** — steps 4–5 repeat until `@code-reviewer` approves and `@architect` is satisfied.
7. **Close** — `@architect` archives the change with `openspec-archive-change`, syncing the requirements into `openspec/specs/`. Only `@architect` closes a spec.

`@architect` may additionally dispatch `@diff-summarizer` at any point to get a terse, risk-flagged overview of a large diff before diving deeper.

## How to Use

### One command

Run it inside the project you want to use the workflow in:

```bash
npx openspec-multiagent init
```

It runs a short wizard, one step at a time, and is safe to re-run:

1. **OpenSpec project** — runs `openspec init --tools opencode` (skipped if already set up)
2. **Agent definitions** — copies the 5 agents into `.opencode/agents`
3. **Context7 MCP server** — optional, remote or local, with or without an API key
4. **Engram MCP server** — optional, local persistent memory (binary on PATH)
5. **Verification** — runs `check.mjs` and prints `status: READY` / `status: NOT_READY`

It never runs `npm install` in your project, so no `node_modules` is created.

In a terminal it asks about Context7 and Engram step by step. In scripts and CI it skips
the questions and uses the defaults; pass flags to choose explicitly:

```bash
npx openspec-multiagent init --context7 local          # local Context7 stdio server
npx openspec-multiagent init --context7 none           # do not configure Context7
npx openspec-multiagent init --api-key ctx7sk-...      # include a key for higher limits
npx openspec-multiagent init --engram local            # wire up local Engram memory
npx openspec-multiagent init --global-agents           # install agents for every project
npx openspec-multiagent init --dry-run                 # show the plan, change nothing
npx openspec-multiagent init --no-prompt               # never ask (CI-safe defaults)
```

### From a clone (recommended, verified)

Run the setup script with Node. It checks Node.js, installs/upgrades the OpenSpec CLI, configures the Context7 MCP server, copies the agent definitions, and runs a preflight check:

```bash
git clone https://github.com/aortizsm/openspec-multiagent.git
cd openspec-multiagent
node scripts/setup.mjs                    # project-local OpenSpec, remote Context7
node scripts/setup.mjs --global           # install the openspec CLI globally instead
node scripts/setup.mjs --context7 local   # use the local Context7 stdio server
```

The scripts are plain Node (>= 20.19.0) with no dependencies, so they behave the same on Windows, macOS, and Linux.

Prefer npm? The same steps are exposed as scripts:

```bash
npm run setup            # = node scripts/setup.mjs
npm run check            # = node scripts/check.mjs (preflight only)
npm run install-agents   # copy agents without touching OpenSpec
npm run install-context7 # configure only Context7
```

### Context7 credentials (optional)

Context7 works **without an API key** (lower rate limits), so a plain install never asks for credentials. When you run the installer in a terminal it asks how to wire it up:

```
Context7 gives agents up-to-date library documentation.
It works without an API key (lower rate limits) or with a free key.

Enable Context7? [Y/n]
How should Context7 be connected?
  1) remote (hosted server, nothing to install) [default]
  2) local (runs @upstash/context7-mcp on your machine)
Use a Context7 API key for higher rate limits? [y/N]
```

Answer `n` to the key question to stay anonymous, or `y` and paste a free key from <https://context7.com/dashboard> for higher limits. Any of `--context7 <remote|local|none>`, `--skip-context7`, `--api-key <KEY>` or `--no-api-key` answers the questions for you, which is what you want in scripts and CI. When stdin is not a terminal, the installer skips the questions and uses the defaults (remote, no key).

### Verify the environment

```bash
node scripts/check.mjs          # human-readable
node scripts/check.mjs --json   # machine-readable, for CI
```

It prints a `status: READY` / `status: NOT_READY` line plus a per-component report. Use it in CI or before starting a session. It fails clearly when:

- OpenSpec is missing or older than `1.14.0`;
- Node is too old;
- the project has not been `openspec init`-ed yet;
- Context7 is missing, or configured with the **V1** shape (`mcp.context7`), which OpenCode V2 ignores.

### Manual setup

If you prefer to do it by hand:

**1. Install/upgrade OpenSpec**

```bash
npm i -g @fission-ai/openspec@latest   # must be >= 1.14.0
```

**2. Copy the agent definitions**

macOS / Linux:
```bash
mkdir -p ~/.config/opencode/agents
cp opencode/agents/*.md ~/.config/opencode/agents/
```

Windows:
```powershell
Copy-Item opencode\agents\* "$env:APPDATA\opencode\agents\"
```

Or install them project-locally with `node scripts/install-agents.mjs --project`.

**3. Enable the MCP servers** in your OpenCode config (`~/.config/opencode/opencode.json`).

OpenCode V2 reads servers from `mcp.servers.<name>`. It does **not** accept a server name directly under `mcp`, and it has **no `enabled` field** (use `disabled: true` to keep a server configured without connecting it):

```json
{
  "mcp": {
    "servers": {
      "openspec": {
        "type": "local",
        "command": ["npx", "-y", "openspec-mcp"]
      },
      "context7": {
        "type": "remote",
        "url": "https://mcp.context7.com/mcp"
      },
      "engram": {
        "type": "local",
        "command": ["engram", "mcp"]
      }
    }
  }
}
```

`node scripts/install-context7.mjs` writes the Context7 entry for you. **No credentials are required** — Context7 works anonymously, so the default install adds no `Authorization` header at all.

Context7 offers higher rate limits with a free API key from <https://context7.com/dashboard>. Add one only if you need it:

```bash
npx openspec-multiagent init --context7 remote --api-key ctx7sk-...
```

`node scripts/install-engram.mjs` writes the Engram entry for you. It requires the `engram` binary to be on your PATH (or set `ENGRAM_BIN`). Engram is local-only — there is no cloud option in this installer:

```bash
ENGRAM_BIN=/path/to/engram npx openspec-multiagent init --engram local
```

### Start

If it is a new project that has not used OpenSpec yet, run `openspec init --tools opencode` to set it up before launching OpenCode. Then open a new OpenCode session in your project directory and describe the change you want to make to `@architect`.

OpenSpec's own workflow commands are also available directly: `/opsx-explore`, `/opsx-propose`, `/opsx-apply`, `/opsx-archive` (installed into `.opencode/commands/` by `openspec init`). The `@architect` workflow drives the same steps through the `openspec-*` skills.

## Repository layout

```
opencode/agents/           Agent definitions copied into the OpenCode agents directory
scripts/
  lib.mjs                  Shared helpers (versions, config paths, JSONC reading)
  init.mjs                 One-command installer for a user's project
  setup.mjs                Install/verify Node, OpenSpec CLI, Context7, and agents
  check.mjs                Preflight check (usable standalone and from agents/CI)
  install-agents.mjs       Copy agent definitions (global or project-local)
  install-context7.mjs     Write the Context7 MCP entry (V2 shape) and migrate V1
  install-engram.mjs       Write the Engram local MCP entry (binary on PATH)
package.json               Declares OpenSpec/Context7 and pins the Node engine
```

## Troubleshooting

**`openspec init` seems to hang.** Under a real terminal, the OpenSpec CLI's
setup spinner does not finish (reproduced with versions 1.14.0 and 1.14.3). The
installer works around it by running `openspec init` with its output piped, which
completes in under a second. If you run `openspec init` yourself and it stalls at
`Setting up OpenCode...`, add `< /dev/null` or pipe it through another command:

```bash
openspec init --tools opencode --no-animation < /dev/null
```

## Credits

This agent setup is based on the workflow described in [How I Write Software With LLMs](https://www.stavros.io/posts/how-i-write-software-with-llms/) by Stavros Korokithakis.
