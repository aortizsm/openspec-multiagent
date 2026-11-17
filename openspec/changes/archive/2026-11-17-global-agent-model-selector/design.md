# Design

## Context

See `proposal.md` for the motivation. The existing selector already reads the active OpenCode location and writes model assignments to project configuration. The current installer places the TUI plugin under each project's `.opencode/plugins/`; OpenCode V2 also discovers plugins in the user's global plugin directory.

The existing project initialization integration must stop creating new project-local copies. The predecessor change `project-agent-model-menu` remains unarchived with its existing review ledger and is not reopened or reset by this change.

## Goals / Non-Goals

**Goals:**
- Install one user-global selector that OpenCode discovers across the user's projects.
- Keep model catalog lookup and assignment writes scoped to the active project.
- Update an existing effective project configuration, or create `.opencode/opencode.jsonc` when no recognized project configuration exists.
- Keep the user's global `opencode.json` and `cli.json` unchanged.
- Make installation idempotent and expose dry-run/force behavior.

**Non-Goals:**
- Add a machine-wide plugin for every operating-system user.
- Move model assignments into global configuration or synchronize assignments between projects.
- Remove arbitrary project plugin directories automatically.
- Change model catalog, variant, role, or per-project JSONC update semantics already implemented by the selector.

## Decisions

1. **Install through OpenCode's user-global plugin directory.** Resolve the directory from `XDG_CONFIG_HOME/opencode/plugins/agent-models`, falling back to `~/.config/opencode/plugins/agent-models`. OpenCode V2 discovers plugins there, so installation does not need to edit the global `opencode.json` or `cli.json`.
   - **Alternative considered:** Keep installing under every project's `.opencode/plugins/`. Rejected because it requires repeated installation and fails the user's global-availability requirement.
   - **Alternative considered:** Add the plugin path to global `opencode.json` or `cli.json`. Rejected because directory discovery suffices and the user explicitly wants no global JSON edit.

2. **Make initialization and the standalone installer target the same global plugin.** The existing `init` integration and standalone package command both use the idempotent global installer. Repeated initialization skips an existing copy; an explicit force option updates it, and dry-run previews the global destination.
   - **Alternative considered:** Require a separate global setup command unrelated to initialization. Rejected because the toolkit already installs the selector during initialization and one consistent destination is simpler.

3. **Keep all selection data in the active project's effective config.** Reuse current-location detection and existing configuration precedence logic. Update the effective recognized project config while preserving unrelated JSONC; when none exists, create `.opencode/opencode.jsonc`. The selector never writes a model assignment to user-global configuration.
   - **Alternative considered:** Write global model assignments and override them per project. Rejected because the user's requirement is for assignments to live only in the project where `/agent-models` was used.

4. **Do not silently delete previous project-local copies.** New installations stop creating them, and documentation explains how to remove a previous toolkit-managed `.opencode/plugins/agent-models` copy before relying on the global copy. The installer must not delete a local directory that may contain user customization.
   - **Alternative considered:** Recursively remove every project-local copy during global installation. Rejected because the installer cannot safely discover all projects or distinguish customized copies.

5. **Test global installation separately from project writes.** Installer tests use an isolated `XDG_CONFIG_HOME` and verify global destination, idempotence, force, and dry-run without changing a project plugin directory. Existing selector tests continue to verify project config precedence, create/update behavior, and isolation between projects.

## Risks / Trade-offs

- [Risk] A project may retain a previous local plugin copy alongside the global copy → Document a one-time cleanup for toolkit-managed local copies; never delete customized copies automatically.
- [Risk] Global-directory write permissions or unsupported secure filesystem primitives may prevent installation → Keep bounded, race-resistant installation and fail with a clear message without modifying configuration.
- [Risk] Repeated `init` calls may attempt installation again → Make the operation idempotent and report an existing global copy as skipped.
- [Trade-off] Installing the plugin becomes user-global, but assignments remain project-local; this adds one global plugin directory while avoiding any global settings or routing changes.

## Migration Plan

`npx openspec-multiagent init` and the standalone installer place the plugin in the user's global plugin directory. Existing project-local copies are not removed automatically; the updated guide explains how to remove a toolkit-managed copy from a project if both copies would otherwise load. Existing model assignments remain in their project configuration and require no migration.

## Result Contract

- **status**: Proposed; awaiting the user's approval of the revised design.
- **executive_summary**: Install the `/agent-models` TUI plugin once in the current user's global OpenCode plugin directory. Keep model catalog selection and every saved assignment scoped to the active project's effective configuration, creating `.opencode/opencode.jsonc` when no project config exists.
- **artifacts**:
  - `proposal.md`
  - `specs/agent-model-routing/spec.md`
  - `design.md`
  - `tasks.md`
- **risks**: Existing project-local plugin copies could be discovered alongside the global copy; document safe manual cleanup and avoid deleting user-owned files.
- **next_recommended**: Review and approve this design before delegating implementation.
