# Proposal

## Intent

Let users choose and persist a model for each bundled OpenSpec Multi-Agent role through an interactive OpenCode TUI menu, with assignments scoped to the current project.

## Why

The existing model-routing example requires users to copy and edit configuration manually, while `/models` changes only the current session model. A project-local selector makes per-agent routing easier to manage and reuses the models OpenCode already exposes as available.

## What Changes

- Add a project-installed OpenCode TUI plugin with an `/agent-models` selection command.
- Populate model choices from OpenCode's available model catalog for the current project; do not hardcode provider or model IDs.
- Offer model variants for subagents when available; for `@architect`, offer only models because the project default does not retain a variant.
- Bound config and catalog processing; reject oversized inputs without changing configuration.
- Save assignments only in the current project's recognized OpenCode configuration. Never write the global OpenCode configuration.
- Set the project's default model for `@architect` and other primary agents; this applies to new sessions, while already-open sessions retain their selected model.
- Install the plugin alongside the bundled agents during target-project initialization and document its use.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-model-routing`: extend per-project routing from a static template to interactive, project-local selection.

## Impact

- OpenCode TUI plugin source and project initialization/packaging scripts.
- The target project's `.opencode` configuration and plugin directory.
- Tests and user documentation for setup and model routing.
- No provider credentials or model catalog are added to this repository.
