# Design

## Result Contract

- **status**: Revised standard-workflow-only scope approved; implementation may continue.
- **executive_summary**: Align specs and guidance with the existing full architect workflow, including the local proposal gate and three-agent parallel quality phase. Remove the fast-architect path and retire the obsolete per-change execution-mode model; leave the orchestrator sequence unchanged in this change.
- **artifacts**: `proposal.md`; deltas for `multiagent-workflow`, `parallel-reviews`, and retired `change-execution-mode`; this `design.md`; `tasks.md`; updates to README, AGENTS, architect guidance, verifier guide, docs changelog, and a Spanish change note; delete `opencode/agents/fast-architect.md`.
- **risks**: Existing OpenCode installations may retain a copied `fast-architect.md`; document manual removal rather than deleting user files automatically. Keep the historical 2026-11-09 note unchanged.
- **next_recommended**: Remove the fast path, run tests and strict OpenSpec validation, then archive this alignment change before starting the separate change for test-engineer sequencing and `--from` gate hardening.

## Context

See `proposal.md` for the motivation. `scripts/orchestrate.mjs` launches `test-engineer`, `code-reviewer`, and `security-reviewer` as one parallel group, and its design gate requires `Intent`, `Why`, and `What Changes` in `proposal.md`. The main specs do not capture all of these contracts. `AGENTS.md` describes the full loop, but the README, verifier guide, and architect prompt contain older or incomplete workflow instructions. A separate fast-architect agent is no longer part of the intended workflow.

The workspace also contains an unrelated uncommitted fix in `tests/lib.test.mjs` and pre-existing untracked archive directories. Preserve them; do not include them in this change's implementation.

## Goals / Non-Goals

**Goals:**
- Make the OpenSpec requirements accurately describe the implemented proposal gate and parallel quality phase.
- Make human- and agent-facing instructions consistently describe the current one-time approval followed by automatic execution.
- Preserve the `## Intent` requirement as a repository-specific extension of the generic OpenSpec proposal template.
- Remove the `@fast-architect` route entirely so every new change uses the same full quality gates.
- Document manual removal of existing installed copies; never automatically delete a user's agent file.
- Record the clarification in the Spanish documentation changelog and change history.

**Non-Goals:**
- Change orchestrator execution, retries, rollback, or any runtime behavior.
- Rewrite historical change notes to retroactively alter what they documented at the time.
- Broaden this into a general cleanup of duplicated architect prompt content.

## Decisions

- Add requirements to the existing `multiagent-workflow` and `parallel-reviews` capabilities rather than creating new capability paths.
- Retire the obsolete `change-execution-mode` capability and record replacement workflow contracts under `multiagent-workflow`.
- Keep the current `Intent` gate. Add repository-specific authoring guidance so the architect includes `## Intent` even when the generic OpenSpec template omits it; `Why` and `What Changes` remain required.
- Document the actual parallel group as `@test-engineer`, `@code-reviewer`, and `@security-reviewer` running concurrently after `@developer`; `@verifier` starts only after all three succeed.
- Remove all fast-architect references and its source agent file; advise users to manually delete an already-installed copy from the global or project agent directory.
- Update README, independent-verification guide, the pre-archive checklist, and the standard architect prompt. Correct the README's @architect shell permission description, `AGENTS.md`'s duplicated preflight description, and the verifier guide's failure retry sequence.
- Preserve the current implementation sequence in this change; create a separate follow-up to move `@test-engineer` before parallel code/security reviews and harden `--from` resume gates after this change is archived.
- Leave the 2026-11-09 entry intact as a historical snapshot. Add a new 2026-11-12 docs change entry describing the standard workflow and fast-agent removal.

Alternative considered: remove `Intent` from the design gate to match the generic OpenSpec template. Rejected for this change because the repository's existing approved design and implementation explicitly require it; documenting the local extension preserves that contract without changing code.

## Risks / Trade-offs

- **[Risk] Some documents may retain an older sequence or approval mode** → Search all in-scope files for the stale flow and `execution-mode` guidance, and verify each against the agreed canonical sequence.
- **[Trade-off] The local `Intent` heading remains an extra authoring requirement beyond generic OpenSpec** → State this explicitly in architect guidance and the workflow specification so generated proposals are completed before the design gate.
- **[Risk] Existing installations keep an obsolete copied fast-architect file** → Document manual removal from the OpenCode global or project agent directory; avoid destructive automatic cleanup.
- **[Trade-off] Test-engineer sequencing remains unchanged here** → Handle that optimization in a separate change to keep spec deltas and review scope unambiguous.
- **[Risk] The current `--from` resume option can start after earlier quality agents** → Keep this change's spec scoped to the standard run and include resume-gate hardening in the approved follow-up.
- **[Risk] Historical changelog details could be mistaken for current behavior** → Keep old entries unchanged and add a newer dated entry that states the current flow.

## Migration Plan

No runtime migration is required. Existing changes are unaffected. Users and agents should follow the updated proposal-section and workflow guidance for new changes.
