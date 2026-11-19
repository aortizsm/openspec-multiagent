# Design

## status

Approved for the final correction round after the user confirmed fail-closed safety limits for oversized inputs.

## executive_summary

Add a project-installed OpenCode TUI plugin that lets users select a model for each bundled agent role from the models available in the current project. It also lets users select available variants for subagents, but not for `@architect` because the project default model does not retain a variant. The plugin persists routing only in project configuration, bounds configuration and catalog processing, and leaves already-open primary sessions unchanged.

## artifacts

- `proposal.md` — intent, motivation, scope, and impact.
- `specs/agent-model-routing/spec.md` — behavioral delta for project-local interactive routing.
- `design.md` — implementation architecture, decisions, and risks.
- `tasks.md` — implementation and validation checklist.

## Context

The toolkit is JavaScript/ES modules and supports OpenCode V2. `scripts/init.mjs` initializes a target project and installs the bundled agents under `.opencode/agents`; `opencode.models.example.jsonc` is currently an inactive project-level routing template. The existing `agent-model-routing` capability covers that static template. See `proposal.md` for motivation.

OpenCode exposes TUI plugins, palette/slash commands, selection dialogs, and a location-scoped model catalog. Project configuration is separate from the user-level configuration. The repository's existing policy prohibits automated edits to `~/.config/opencode/opencode.json`; this change writes routing only inside the initialized target project.

## Goals / Non-Goals

**Goals:**

- Provide `/agent-models` in the OpenCode TUI for the bundled `@architect` and subagent roles.
- Populate choices from the current project's OpenCode model catalog; include available variants for subagents, but not for `@architect`.
- Persist each subagent selection in the target project's configuration and set the project default model when `@architect` is selected; that default applies to all primary agents in new sessions.
- Install the plugin into the target project as part of `npx openspec-multiagent init`.
- Preserve unrelated project configuration and leave user-level configuration untouched.
- Use native OpenCode dialogs with keyboard navigation, visible current selection, cancellation without writes, and textual success/error feedback.
- Bound project config parsing and catalog option construction; reject oversized inputs without writing.

**Non-Goals:**

- A global model-routing menu or edits to user-level OpenCode configuration.
- Connecting providers, adding credentials, or imposing spending limits.
- Changing the selected model of an already-open session when the `@architect` default is changed.
- Supporting arbitrary agents outside the toolkit's bundled roles in the first version.

## Decisions

1. **Ship as a project-local OpenCode plugin.** Keep plugin source in the toolkit package and install it under the target project's `.opencode/plugins/` from the existing project initialization flow. Use the OpenCode plugin package shape that exposes a TUI part while allowing automatic project loading; do not require a global plugin install or modify `cli.json`. Existing, unrelated global integration steps in `init` remain unchanged.
   - **Alternative considered:** a standalone external selector script. Rejected because it would not be an in-OpenCode selection menu.

2. **Use OpenCode's current-location model catalog.** The TUI plugin will obtain the project-scoped available models and variants from OpenCode, rather than maintaining provider/model IDs. Offer variants and a default/no-variant choice for subagents when available. Do not offer variants for `@architect`: the project-level `model` default does not retain `#variant`, so the menu could not persist that choice faithfully. Empty or unavailable catalog states are shown without writing configuration. Keep displaying a configured model even if it is no longer available, so the user can replace it.
   - **Alternative considered:** hardcode the template's current model IDs. Rejected because availability depends on the active project and providers.

3. **Store routing in recognized project configuration only.** Subagents use `agents.<id>.model`; selecting `@architect` sets the project's default `model`, which applies to all primary agents in new sessions. Update the current project's recognized configuration without replacing prompts, permissions, or unrelated settings. If the configuration cannot be parsed or safely updated, leave it unchanged and show an actionable error.
   - **Alternative considered:** write to the global OpenCode configuration. Rejected by the user's project-only scope and repository policy.

4. **Install idempotently.** Initialization installs the plugin alongside project agents and follows existing installer conventions: do not overwrite an existing user-owned plugin copy unless an explicit force path is used.
   - **Alternative considered:** copy plugin files on every initialization. Rejected because it could overwrite local user changes.

5. **Use native TUI selection and confirmation dialogs.** Preserve built-in keyboard navigation and visible selection. Before saving an `@architect` choice, require explicit confirmation that it changes the default for all primary agents in new sessions, but not open sessions. Cancellation at any step leaves configuration unchanged; show success only after a completed write and actionable text on failure.
   - **Alternative considered:** custom terminal rendering. Rejected because it duplicates OpenCode's existing dialog and accessibility behavior.

6. **Apply explicit resource bounds.** Accept project config up to 1 MiB and JSON nesting up to 64 levels; show at most 2,000 model choices and 256 variants for a selected model. Exceeding any limit produces a textual error and no config write.
   - **Alternative considered:** incremental model/variant menus without a fixed option cap. Rejected for this first version because it adds UI state and pagination complexity.

## Risks / Trade-offs

- **OpenCode plugin APIs may evolve** → Keep the plugin small, use documented V2 TUI APIs, and cover catalog/menu behavior with focused tests.
- **Project configuration may contain JSONC comments or malformed content** → Preserve unrelated content with a JSONC-aware update; refuse to write on parse or validation failure.
- **Node's portable filesystem APIs do not anchor child operations to directory descriptors** → Use Linux `/proc/self/fd` with `O_NOFOLLOW` for project-root-relative config and plugin writes; fail closed without changing files where those primitives are unavailable.
- **Models available in one project may not be available in another** → Query the active project location each time the menu opens; persist only the selected identifier in that project's config.
- **The project default applies to other primary agents as well as `@architect`** → Label this effect in the selector and document it before saving.
- **The primary project default does not retain model variants** → Offer variants only for subagent assignments and explain the difference in the menu and documentation.
- **Changing the primary default does not change an open session** → State this in the menu confirmation and project usage documentation.
- **Very large config/catalog inputs could exhaust resources** → Enforce the documented size, depth, and option limits and fail closed before writing.

## Migration Plan

No migration is needed. A fresh or repeated project initialization installs the plugin into the target project. Existing static model templates and unrelated global integration behavior remain unchanged; the interactive selector updates project-local routing only.

## next_recommended

Implement the approved resource bounds and close the remaining ledger findings in correction round 3, then run the final quality and verification gates; preserve unrelated pre-existing worktree changes.
