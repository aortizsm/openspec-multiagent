# Proposal

## Intent

Version the two OpenCode configuration files that define this user's models — the global `~/.config/opencode/opencode.json` and the project's `.opencode/opencode.jsonc` — inside this repository so they survive a machine change.

## Why

Both files live outside version control today: the global one is user-level and the project one is ignored by `.gitignore`. Changing PC loses the provider definitions, model routing and MCP setup, forcing manual reconstruction.

## What Changes

- Add the global configuration to the repository as a recognized project config (`opencode.json`), with the literal `mcp.servers.github.env.GITHUB_TOKEN` value replaced by the `{env:GITHUB_TOKEN}` substitution so no credential is committed.
- Stop ignoring `.opencode/opencode.jsonc` and commit it, so the per-agent model routing is versioned.
- Keep `.opencode/run/` and `.opencode/cache/` ignored: they hold regenerated orchestrator runtime artifacts that must not reach this public repository.
- Update the repository guidance that currently restricts model routing to inert examples.
- Document the change for users.

## Capabilities

No spec-level behaviour changes: this change versions configuration files and updates guidance only. `skip_specs: true` is set accordingly.

## Impact

- New versioned file: `opencode.json` (project config).
- `.gitignore`: `.opencode/opencode.jsonc` no longer ignored.
- `AGENTS.md` guidance about model routing.
- `docs/` entry and changelog.
- Machine-specific values remain in the config and must be adjusted on another machine (`mcp.servers.filesystem` absolute path, `providers.llamacpp.settings.baseURL`).
