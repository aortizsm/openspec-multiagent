# Tasks

## 1. User-global plugin installation

- [x] 1.1 Change the standalone installer to target `$XDG_CONFIG_HOME/opencode/plugins/agent-models`, falling back to the user's OpenCode config directory; preserve dry-run, idempotent existing-copy behavior, and explicit force updates. Add installer tests using an isolated XDG home that verify the global destination and confirm no global `opencode.json` or project-local plugin copy is written.
- [x] 1.2 Update `scripts/init.mjs` to install the selector globally instead of copying it into the initialized project's `.opencode/plugins/`; verify isolated initialization installs the global plugin idempotently while leaving the project's plugin directory and unrelated global integrations unchanged.

## 2. Project-scoped assignments

- [x] 2.1 Preserve active-project model catalog and configuration resolution; verify existing effective project configs are updated without losing unrelated JSONC settings, missing project config is created at the documented project-local default, and assignments remain independent across two projects with the user-global `opencode.json` unchanged.
- [x] 2.2 Verify safe installation and configuration failure behavior remains fail-closed for unsupported filesystem primitives, invalid project config, and unwritable global plugin destination; run focused plugin tests for each failure path.

## 3. Setup and migration documentation

- [x] 3.1 Update README and `docs/guides/agent-workflow.md` to explain one-time user-global plugin availability, project-local assignment persistence, dry-run/force behavior, and safe cleanup of older toolkit-managed project plugin copies; verify paths and commands against the installer.
- [x] 3.2 Add a Spanish change note and changelog entry describing the global plugin and project-local settings; verify all required documentation sections and links.

## 4. Integration validation

- [x] 4.1 Run `npm test`, `npm run check`, `openspec validate global-agent-model-selector --strict`, and `git diff --check`; verify all scenarios pass and unrelated changes in the shared worktree remain untouched. Evidence: developer reported `npm test` passed (66 + 39 + 47), `npm run check` READY, strict validation valid, and diff check clean. Architect supplied exact `npm run check` and strict-validation outputs to the reviewer when shell access was denied.

## Predecessor status

- The unarchived `project-agent-model-menu` change remains unchanged with its existing RF-013 and RF-014 warnings open after its three-round limit. This successor does not reset that ledger or archive the predecessor.

## Review Findings

Correction rounds used: 0 of 3 (the validation-evidence finding was closed by architect-run checks without a developer correction).

| ID | Source agent(s) | Severity | Acceptance criterion / scenario | File / location | Requested correction | Status | Closure evidence / rationale |
|---|---|---|---|---|---|---|---|
| RF-001 | code-reviewer | WARNING | Task 4.1 — integration validation; all five acceptance scenarios | `tasks.md:20` | Provide actual command output for `npm run check` and `openspec validate global-agent-model-selector --strict` because reviewer shell access was denied. | resolved | Architect ran `npm run check`: exit 0, Node 22.23.5, OpenSpec 1.14.3, skills 4 found, integrations configured, `status: READY`. `openspec validate global-agent-model-selector --strict`: exit 0, “Change 'global-agent-model-selector' is valid”. Reviewer confirmed this evidence closes the finding; no source change or correction round was needed. |
