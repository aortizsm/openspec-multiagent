# Design

## status

Approved by the user for implementation.

## executive_summary

Remove the checked-in project-local plugin copy that duplicates the already-installed user-global `/agent-models` plugin in this repository. Keep the canonical package source and global installer unchanged, and make the cleanup visible in the human documentation.

## artifacts

- `proposal.md` — scope and motivation.
- `design.md` — cleanup decision and boundaries.
- `tasks.md` — file removal, documentation, and validation.
- `specs/` — deliberately skipped because existing requirements already specify global selector availability without a project-local plugin copy.

## Context

See `proposal.md` for the problem. OpenCode plugin source is maintained in `opencode/plugins/agent-models/`; this repository also tracks an identical runtime copy in `.opencode/plugins/agent-models/`. The user-global plugin is already installed and is also byte-for-byte identical. The archived `global-agent-model-selector` change explicitly leaves arbitrary project-local copies untouched so customized target-project plugins are not deleted.

## Goals / Non-Goals

**Goals:**

- Ensure this repository checkout no longer loads its tracked local duplicate alongside the global plugin.
- Keep the global plugin installation as the runtime source used from this checkout.
- Keep documentation accurate about this repository's cleanup and the installer's non-destructive policy for other projects.

**Non-Goals:**

- Removing local plugin copies from user target projects.
- Changing plugin IDs or removing the server/TUI package parts; their entries under separate OpenCode plugin surfaces are expected.
- Editing `~/.config/opencode/opencode.json`, `cli.json`, or the user-global plugin directory.
- Changing the standalone installer or initialization behavior.

## Decisions

1. **Delete only the tracked `.opencode/plugins/agent-models/` copy.** It is identical to both canonical source and the global installation, and the global-selector requirement already says this repository does not need a project-local plugin copy.
   - **Alternative considered:** Keep both copies and tell the user to disable one. Rejected because the duplicate is checked into this repository and reappears in every checkout.
   - **Alternative considered:** Make the installer remove project-local plugin directories. Rejected because it could delete customized copies in other projects and contradicts the archived migration decision.

2. **Retain `opencode/plugins/agent-models/` as the single canonical source.** The package and global installer depend on this directory; the local copy is redundant.
   - **Alternative considered:** Delete the canonical source and keep the local copy. Rejected because package files and installer tests use the canonical `opencode/plugins/` path.

3. **Update guide and change-history documentation, not runtime code.** Clarify that the toolkit checkout does not need a local copy while historical copies in target projects remain user-managed.
   - **Alternative considered:** Add a new capability requirement. Rejected because the existing `agent-model-routing` spec already requires global availability without a project-local copy; no behavior contract is being introduced.

## Risks / Trade-offs

- [Risk] A checkout without the user-global plugin will no longer expose `/agent-models` from its project-local directory → Point to the existing global install/init instructions; do not add a fallback local copy.
- [Risk] Readers may confuse the TUI and Server entries with duplicate installations → Document that those are distinct plugin parts; only the redundant local-vs-global installation is removed.
- [Trade-off] OpenCode users with customized local copies in other projects must continue managing them manually → Preserve the installer's existing non-destructive behavior.

## Migration Plan

Remove the eight tracked duplicate files from this repository and update the workflow guide and Spanish change documentation. The user-global plugin and all model assignments remain untouched. Reload OpenCode after applying the change; `/reload` is sufficient. Rollback, if needed, is restoring the deleted files from version control.

## next_recommended

Implement the approved cleanup, then complete the review, security, verification, validation, and archive gates.
