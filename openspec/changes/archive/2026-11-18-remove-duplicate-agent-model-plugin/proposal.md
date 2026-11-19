# Proposal

## Intent

Remove the repository's stale project-local `/agent-models` plugin copy so this checkout uses the already-installed user-global plugin only.

## Why

The same plugin is currently discovered from both `.opencode/plugins/agent-models/` and the user's global plugin directory. The repository-local copy is tracked, byte-for-byte identical to the canonical source and global installation, and contradicts the existing requirement that the selector be available globally without a project-local copy.

## What Changes

- Delete the tracked `.opencode/plugins/agent-models/` duplicate while retaining `opencode/plugins/agent-models/` as the canonical packaged source.
- Clarify repository-specific cleanup in the agent-workflow guide and record the visible cleanup in the Spanish changelog and change notes.
- Do not alter the global plugin installation, user OpenCode configuration, installer cleanup behavior, or project-local plugin copies in other projects.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The existing `agent-model-routing` requirement already specifies global selector availability without a project-local plugin copy; this change removes only the stale copy checked into this repository.

## Impact

- Removes eight tracked files from `.opencode/plugins/agent-models/`.
- Updates `docs/guides/agent-workflow.md`, `docs/CHANGELOG.md`, and adds a Spanish entry under `docs/changes/`.
- Leaves canonical plugin source, installation scripts, user-global plugin files, and user configuration unchanged.
