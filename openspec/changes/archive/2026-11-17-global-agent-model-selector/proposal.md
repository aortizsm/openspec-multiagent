# Proposal

## Intent

Install the `/agent-models` selector once for the current OpenCode user while keeping every model assignment in the project where the selector is invoked.

## Why

The current installer places the TUI plugin inside each target project's `.opencode/plugins/` directory, so the selector is unavailable in other projects until installed there too. OpenCode supports user-global plugin discovery, while its TUI provides the active project location needed to keep assignments project-specific.

## What Changes

- Install the TUI plugin under the user's OpenCode global plugin directory, honoring `XDG_CONFIG_HOME`; do not edit the global `opencode.json` or `cli.json`.
- Make project initialization and the standalone installer idempotently install or update the same global plugin rather than requiring a project-local plugin copy.
- On each invocation, keep reading the active project's available model catalog and update that project's effective recognized configuration; create a project configuration when none exists.
- Preserve unrelated settings and ensure assignments in one project do not change another project's configuration or the user's global model settings.
- Update tests and setup/use documentation, including migration guidance for projects with an older project-local plugin copy.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-model-routing`: make the interactive selector available through user-global plugin installation while keeping all model assignments scoped to the active project.

## Impact

- Installer and initialization: `scripts/install-agent-models.mjs`, `scripts/init.mjs`, and global config-directory helpers.
- Existing TUI plugin behavior continues to use the active project location and project configuration.
- Tests and documentation: `tests/`, `README.md`, `docs/guides/agent-workflow.md`, `docs/changes/`, and `docs/CHANGELOG.md`.
- No dependency changes and no writes to user-global `opencode.json` or project provider credentials.

This is a follow-up to the unarchived `project-agent-model-menu` change. That predecessor remains unchanged and unarchived; this change does not reset or bypass its review ledger.
