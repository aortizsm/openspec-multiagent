# Design

## status

proposed

## executive_summary

Bring the user's two OpenCode configuration files into the repository: the global provider/model/MCP config as a sanitized project `opencode.json`, and the per-agent routing as a versioned `.opencode/opencode.jsonc`.

## artifacts

- `opencode.json` — sanitized project config derived from `~/.config/opencode/opencode.json`.
- `.opencode/opencode.jsonc` — per-agent model routing, un-ignored and committed.
- `.gitignore` — drops the ignore rule for `.opencode/opencode.jsonc` only; `.opencode/run/` and `.opencode/cache/` stay ignored because they hold regenerated orchestrator runtime artifacts that should not be published (security review RF-002).
- `AGENTS.md` — routing guidance updated.
- `docs/changes/2026-11-25-version-opencode-configs.md` and `docs/CHANGELOG.md` — user documentation.

## risks

- **Committed credential**: mitigated by replacing the literal GitHub token with `{env:GITHUB_TOKEN}` and verifying the absence of the literal value before committing. The user must rotate the previously exposed token.
- **Machine-specific values**: `mcp.servers.filesystem` uses an absolute path and `providers.llamacpp` points at a local endpoint; these stay as-is and are documented as needing adjustment elsewhere.
- **Config precedence**: a repository-root `opencode.json` plus `.opencode/opencode.jsonc` both apply in this project; `.opencode` configs win on conflicts, which is the intended layering (base config plus routing).
- **Scope creep**: the global file is user-level; versioning it as a project config narrows it to this project. Accepted by the user.

## next_recommended

Delegate the file changes to `@developer`, verify that no credential literal is committed, then review, verify and archive.
