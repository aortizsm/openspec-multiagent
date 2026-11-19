# Proposal

## Intent

Replace the architect's two contradictory editing rules with one: the architect edits the process record (OpenSpec artifacts, agent guidance, the local agent mirror, and human documentation) and delegates everything that changes verifiable behaviour to `@developer`.

## Why

The `architect-shell-editing` capability contradicts itself:

- The requirement "Nota de edición vía shell en architect.md" mandates that `architect.md` carry a note telling the architect to edit files outside its allowed paths with shell commands (`sed`, `echo`, redirection).
- The requirement "Frontera de edición del architect" and its scenario "Sin instrucción de edición por shell" forbid exactly that instruction.

The prompt satisfies the first and violates the second: it contains `## File Editing Permissions` ("The `edit` tool is restricted to `openspec/**`, `AGENTS.md`, and `opencode/agents/*`. To edit any other file in the project (e.g., `README.md`, `docs/changes/`, `scripts/`), use shell commands..."). In practice this gave the architect authority over any file, including `scripts/`, while the paragraph added by `architect-runs-project-commands` in the same prompt says its writable outputs are only three paths.

A second, unwritten gap: the `edit` allowlist permits `opencode/agents/*` but not `.opencode/agents/*`, which is the installed mirror this repository versions and which a regression test now requires to stay byte-identical to its source. There was no sanctioned way to sync it; the architect did it through shell.

The user decided the boundary: process record yes, behaviour no.

## What Changes

- Remove the shell-editing note from `opencode/agents/architect.md` (both occurrences) and remove the requirement that mandates it.
- State one writable-resource list in the prompt: `openspec/**`, `AGENTS.md`, `opencode/agents/*`, `.opencode/agents/*`, `README.md` and `docs/**`.
- Extend the prompt's `edit` allowlist to match that list, so editing uses the `edit` tool and shell is never presented as an editing route.
- State that tests, application source, and `scripts/**` are `@developer`'s work, delegated through a `tasks.md` row, because they change verifiable behaviour.
- Keep the execution mandate from `architect-runs-project-commands` unchanged: running the project's commands is not editing.
- Update the capability spec, the `README.md` permission table, the workflow guide, the change note, and add contract regressions over both prompt copies.

## Capabilities

### Modified Capabilities

- `architect-shell-editing`: removes the shell-editing note requirement, and rewrites the editing-boundary requirement around the declared writable resources plus the delegation rule for behaviour-changing files.

## Impact

- `opencode/agents/architect.md` — the `edit` allowlist, the `## File Editing Permissions` note (x2), and the writable-outputs paragraph (x2).
- `.opencode/agents/architect.md` — reconciled to the source, byte-identical.
- `openspec/specs/architect-shell-editing/spec.md` via the change delta.
- `README.md`, `docs/guides/agent-workflow.md`, `docs/changes/2026-11-19-architect-edit-boundary.md`, `docs/CHANGELOG.md`.
- `tests/run.mjs` — contract regressions over both prompt copies.
- No runtime code and no new dependency. This closes the finding carried open from `architect-runs-project-commands` and the user-level reinstall is what propagates it to other projects, exactly as in that change.
