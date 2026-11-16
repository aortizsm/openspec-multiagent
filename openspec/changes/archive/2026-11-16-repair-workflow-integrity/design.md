# Design

## status

Draft design awaiting the single user approval; no agent has run.

## executive_summary

Repair the repository's own integrity in one change: remove the contradictory three-round requirement so a single correction policy remains, close the blocked predecessor's ledger with verified evidence and archive both in-flight changes, rebuild the architect prompt as one authoritative copy without bypass or change-specific text, gate agent-definition drift, and replace the hardcoded historical allowance with a declared per-change `correction_rounds`.

## artifacts

`proposal.md`; `specs/multiagent-workflow/spec.md`; `specs/architect-shell-editing/spec.md`; this `design.md`; `tasks.md`; edits inside `openspec/changes/improve-adaptive-change-intake/` and `openspec/changes/stabilize-automatic-orchestration/`; `opencode/agents/*.md`; `.opencode/agents/*.md`; `AGENTS.md`; `README.md`; `scripts/orchestrate.mjs`; `scripts/check.mjs`; `scripts/lib.mjs`; `tests/run.mjs`; `package.json`; `.gitignore`; `opencode.clinepass.example.jsonc`; `docs/guides/agent-workflow.md`; `docs/guides/independent-verification.md`; `docs/changes/2026-11-15-repair-workflow-integrity.md`; `docs/CHANGELOG.md`; the predecessor's and successor's Spanish notes.

## risks

(1) editing the predecessor after its stop rule could look like bypassing a gate — mitigated by recording the user's explicit instruction in its design status and ledger rationale, and by requiring verified evidence for every closed row; (2) removing the hardcoded allowance could weaken the in-progress successor — mitigated by declaring `correction_rounds: 3` in its `.openspec.yaml` and testing both the declared and default paths; (3) the prompt-integrity test could become brittle — mitigated by using targeted absence checks on exact literal instruction text rather than wording assertions; (4) the drift gate could break if installation ever transforms content — mitigated by asserting the installer stays a verbatim copy.

## next_recommended

Get the single user approval, then have `@developer` implement tasks 1–5, run the quality gates, and let `@architect` archive the predecessor, the successor, and this change in that order.

## Context

The repository is a multi-agent workflow tool (agents, orchestrator, specs, Spanish human docs). Two unarchived deltas disagree on the correction policy; the predecessor cannot pass its own archive gate; the committed installed agent copies are stale and the architect prompt is self-contradictory; the distributed orchestrator hardcodes one change name. Evidence is recorded in `proposal.md` and in the task rows of `tasks.md`.

## Goals / Non-Goals

**Goals:**

1. Exactly one correction policy across specs, prompts, and documentation.
2. Both in-flight changes reach the archive gate through their real gates, with no rewritten history and no deleted artifacts.
3. `opencode/agents/*` is the single source of truth, enforced by a gate instead of convention.
4. The distributed orchestrator carries no behaviour keyed to a historical change name.

**Non-Goals:**

- Splitting `tests/run.mjs` (2391 lines) or modularizing `scripts/orchestrate.mjs` (1341 lines). Both are real maintainability debts, but they are large refactors unrelated to integrity, and the clean-code criteria that matter now (≤15-line functions, ≤3 parameters) are already enforced inside them.
- Adding a "one active change per capability" gate. `multiagent-workflow` is a broad capability that most changes touch, so such a gate would block legitimate parallel work; the concrete contradiction is removed instead.
- Committing `package-lock.json` or changing the installer's dependency strategy.

## Decisions

- **Keep both in-flight changes and close the predecessor (chosen).** Unlike retiring it, this preserves its four unique requirements (`two-stage discovery`, `mode-specific handoffs`, `structured outcomes`, `conditional UX review`) as spec coverage — the main spec contains none of them — and avoids re-opening a successor that is one task from done. Closing it is truthful because four of its five open findings are already fixed in the same worktree and the fifth is fixed by this change.
- **Rejected alternative: retire the predecessor.** It would require folding its five requirements into the successor's delta and re-authoring that change's proposal, design, and tasks, which is a larger, riskier rewrite, and it would leave its artifacts homeless inside `openspec/changes/`.
- **Remove the contradictory requirement instead of rewriting it.** `improve-adaptive-change-intake`'s "Automatic corrections preserve quality gates" is superseded by the successor's "Single correction attempt for future changes"; deleting the block is smaller than rewriting it and removes the contradiction at its root.
- **Data-driven allowance instead of deleting the exception.** The successor's spec scenario "Existing in-progress change retains its approved allowance" must stay implementable, so the allowance becomes a declared value with a default of one; no change name appears in the runtime.
- **Prompts are generated copies.** The installer stays a verbatim copy; drift is caught by a test and a check rather than by transforming content during installation.
- **The architect does not edit files outside its allowlist.** The bypass paragraph is replaced by the rule that such files are changed by `@developer` through a `tasks.md` row, keeping the permission model and its documentation consistent. The two main-spec requirements that mandated the old note are removed and replaced with one boundary requirement, because a MODIFIED block must reproduce the existing scenario names and would otherwise preserve the bypass wording.
- **Declared allowance spelling.** OpenSpec 1.14.3 treats a non-`x-` unknown top-level key in `.openspec.yaml` as unknown and fails `--strict` for the declaring change, so the runtime accepts both `correction_rounds` and `x-correction_rounds`, and the in-flight declaration uses the extension spelling. The alternative — the unprefixed key only — would make strict validation permanently red.
- **The main spec only changes at archive time.** Removing the continuing round-three wording from "Architect consolidates actionable findings" and replacing the shell-editing requirements happen through this change's delta; the spec files under `openspec/specs/` are touched by the architect during the archive sync, including the stale `## Purpose` of `architect-shell-editing`.

## Integration audit (orchestration-sensitive scenarios)

| Acceptance scenario | Code path | Agent outcome / state transition | Failure behaviour | Archive effect | Verification |
|---|---|---|---|---|---|
| Declared allowance is used | `scripts/orchestrate.mjs`: allowance resolution feeding the correction loop | architect `bundle_ready` → developer correction → quality rerun, repeated up to the declared count | none | archive still requires all gates | isolated change fixture declaring `correction_rounds: 2` reaches a second bundle |
| Change declares no allowance | same, default `1` | first bundle allowed, second blocked and reported | second bundle refused with the open findings | no archive | existing single-correction isolated tests re-pointed to the default path |
| Declared allowance is invalid | same, value validation before `designGate` | none; process exits | clear error, non-zero exit | no archive | isolated fixture declaring `0` and a non-numeric value |
| Installed copy drifts from its source | `scripts/check.mjs` report + `tests/run.mjs` byte comparison of `opencode/agents/*` vs `.opencode/agents/*` | none (developer-facing gate) | `npm run check`/`npm test` fails naming the drifted file | n/a | temp-fixture drift and failure-path test, plus an in-sync assertion |
| Installed copies match their source | same | passes | — | n/a | same test |
| Prompt instructs bypassing permissions | `tests/run.mjs` literal absence check over the distributed prompts | n/a | test fails if the instruction text returns | n/a | absence check on the exact removed instruction |
| Prompt embeds a change-specific directive | same, checking for change-name literals in prompts | n/a | test fails if a directive naming a single change returns | n/a | absence check over all nine prompts |

## Migration Plan

1. Reconcile the predecessor's delta, ledger, and design; complete the successor's remaining documentation task; synchronize and rebuild prompts; implement the drift gate and the declared allowance; do the housekeeping.
2. Run the quality sequence, then independent verification, on this change.
3. Archive `improve-adaptive-change-intake`, then `stabilize-automatic-orchestration`, then this change, syncing each delta into `openspec/specs/multiagent-workflow/spec.md` and writing a real `## Purpose` if a placeholder appears.

Rollback: all edits are in the working tree; `git diff` reverts them. Archiving is the only irreversible step and happens last, after every gate passes.
