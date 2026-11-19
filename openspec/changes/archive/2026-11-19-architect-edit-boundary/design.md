# Design

## status

Design ready for user approval.

## executive_summary

Replace the architect's two contradictory editing rules with one decided boundary: the architect edits the process record — OpenSpec artifacts, agent guidance, the local agent mirror, and human documentation — and everything that changes verifiable behaviour (tests, source, `scripts/**`) goes to `@developer` through a `tasks.md` row. Until now the prompt told the architect to edit any other file with shell commands while another paragraph restricted it to three paths, and the `edit` allowlist did not even cover the installed agent mirror that a regression test requires to stay byte-identical. No runtime code and no new dependency.

## artifacts

- `proposal.md` — intent, evidence, and scope.
- `specs/architect-shell-editing/spec.md` — delta removing the shell-editing note requirement and rewriting the editing boundary.
- `design.md` — the boundary rule, its rationale, and risks.
- `tasks.md` — implementation and validation checklist.

## Context

`architect.md` is duplicated in two blocks inside the same file, so each paragraph exists twice. Its frontmatter `edit` allowlist is the machine-checked half of the boundary, and it is what actually decides whether the `edit` tool works on a path; the prose note is guidance. Today the two disagree with each other and with a third statement added by `architect-runs-project-commands` ("Your writable outputs are OpenSpec specification files, `AGENTS.md` and `opencode/agents/*`").

The user chose the boundary explicitly, and the deciding principle is behaviour: a file that changes verifiable behaviour must pass through `@developer` and the reviewers, while a file that records the process does not.

## Goals / Non-Goals

**Goals:**

- One writable-resource list, stated in the prose *and* enforced by the `edit` allowlist.
- No instruction anywhere in the prompt that presents shell as an editing route.
- A sanctioned way to keep `.opencode/agents/<name>.md` in sync with `opencode/agents/<name>.md`, which a regression test now requires.
- Behaviour-changing files explicitly delegated to `@developer`.

**Non-Goals:**

- Change the execution mandate or the command permissions from `architect-runs-project-commands`.
- Let the architect edit tests, application source, or `scripts/**`.
- Re-baseline the phantom requirements of `multiagent-workflow`, which is the next change in this batch.
- De-duplicate the prompt's repeated blocks, which is pre-existing and out of scope.

## Decisions

1. **The boundary is behavioural, not by file type name.** The architect may edit the process record: `openspec/**`, `AGENTS.md`, `opencode/agents/*`, `.opencode/agents/*`, `README.md`, `docs/**`. It may not edit anything that changes verifiable behaviour: tests, application source, and `scripts/**`. This gives one rule instead of three, and the rule is checkable.
2. **Enforce the boundary in the `edit` allowlist, not only in prose.** The allowlist gains `.opencode/agents/*`, `README.md` and `docs/**`. A prose note that contradicts the allowlist is what produced this contradiction, and the allowlist is the half a test can verify.
3. **Delete the shell-editing note and the requirement that mandates it.** The note is the only place that presents shell as an editing route. Removing both the note and its requirement leaves the scenario "Sin instrucción de edición por shell" satisfied instead of violated, and it removes the reason the architect had to bypass the `edit` tool.
4. **Keep the execution mandate untouched.** Running the project's commands is not editing. The wording added by `architect-runs-project-commands` stays, including the non-mutating rule for the architect's own inspection and the anti-delegation rule.
5. **Align the writable-outputs paragraph with the same list.** Two paragraphs in the same file cannot state different resource lists; both carry the boundary, and the regression test asserts the list and the absence of the shell-editing instruction in both occurrences of both copies.
6. **This closes the finding carried open from the previous change.** `architect-runs-project-commands` recorded the contradiction as RF-007 and escalated it; this change is that escalation's resolution, so the re-baseline change can proceed without it.

## risks

- [Widening the allowlist to `docs/**` could let the architect overwrite a change's documentation that belongs to `@developer`] → The repository's documentation convention already assigns the change note to `@developer` as a task; the architect editing documentation is what the user chose, and the reviewers see every diff, so a miswritten note is caught by review rather than by permissions.
- [Removing the shell-editing note could leave the architect unable to fix a small documentation typo] → It can: `README.md` and `docs/**` are in the allowlist, so the `edit` tool covers the same work that shell used to do.
- [The two prompt blocks could drift apart again] → Both blocks are covered by the same contract test, which asserts the resource list, the delegation rule, and the absence of the shell-editing instruction in each occurrence and in both copies.
- [`.opencode/agents/*` in the allowlist could let the architect edit an installed agent without changing its source] → The byte-identity regression added in the previous change fails when the two diverge, so an edit to the mirror alone is caught rather than silently accepted.
- [Other projects keep the old note until the user-level agents are reinstalled] → Same migration step as the previous change; the change note restates it.

## Migration Plan

No data or runtime migration. The corrected prompt applies in this repository immediately, because OpenCode reads the project-local definition. Other projects pick it up when the user-level agents are reinstalled with `node scripts/install-agents.mjs --force` (the script skips existing files without `--force`).

## next_recommended

Obtain user approval, then update the prompt's allowlist and both prose statements, remove the shell-editing note, ship the capability delta, add the contract regressions, update the documentation, and run `npm test`, `npm run check`, and strict OpenSpec validation.
