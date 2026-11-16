# Design

## Result Contract

- **status**: Reconciled after the round-3 stop. The five findings that were still open (RF-001, RF-005, RF-006, RF-007, RF-009) are closed with verified evidence from the current worktree, and the contradictory `Automatic corrections preserve quality gates` requirement was removed from the delta in the same reconciliation, so the change now awaits its archive gate instead of a correction round. The reconciliation is user-authorized by `repair-workflow-integrity`, and no additional code correction was required: four findings were already fixed in the same worktree and the fifth is fixed by that change's task 2.2.
- **executive_summary**: Retain two-stage discovery and assisted/automatic handoffs, then make automatic orchestration consume validated per-agent outcomes. Consolidate reviewer/verifier findings through `@architect`, include conditional UX review, and fail closed on blockers, invalid outcomes, unresolved findings, or missing/unjustified verifier evidence; the correction limit itself now lives in the successor change's policy.
- **artifacts**: `proposal.md`; `specs/multiagent-workflow/spec.md`; this `design.md`; `tasks.md`; updates to `opencode/agents/architect.md`, `developer.md`, `test-engineer.md`, `code-reviewer.md`, `security-reviewer.md`, `verifier.md`, conditional `ux-designer.md`, `AGENTS.md`, `scripts/orchestrate.mjs`, `tests/run.mjs`, `docs/guides/agent-workflow.md`, a Spanish change note under `docs/changes/`, and `docs/CHANGELOG.md`.
- **risks**: Agent outcome blocks may be missing or malformed, and an automatic loop could skip review or verifier gates. Mitigate by validating role-specific statuses, failing closed, and testing correction and archive branches with mocked CLI output.
- **next_recommended**: Archive this change through its normal gates — strict validation, spec sync into `openspec/specs/multiagent-workflow/spec.md`, and a real `## Purpose` — as the first of the reconciled in-flight change set, before `stabilize-automatic-orchestration` and `repair-workflow-integrity`.

## Context

See `proposal.md` for motivation. The current orchestrator runs a fixed agent list as OpenCode CLI subprocesses, checks only process exit codes, and proceeds to validation/archive when all commands exit zero. It does not parse semantic reviewer or verifier outcomes and omits the conditional UX phase. OpenCode V2 `opencode run --format json` emits newline-delimited JSON events for script consumption. The existing workflow requires UX for UI changes, architect-consolidated findings, bounded rounds, and acceptable verifier results; automatic mode must enforce them rather than relying on exit codes alone.

## Goals / Non-Goals

**Goals:**
- Require an ambiguity-resolution pass followed by a scope/context/acceptance pass before proposal drafting.
- Ask automatic versus assisted mode at change start unless the user already selected it.
- In assisted mode, pause for clarification only at handoffs with material doubts; in automatic mode, do not interrupt at handoffs and stop only for an unresolvable material blocker.
- Have each automatically invoked agent emit a machine-readable terminal outcome with a role-valid status and required payload; fail closed if the outcome is missing or malformed.
- Automate the existing architect-consolidated correction loop up to three rounds and prevent archive unless reviewer, verifier, and validation gates pass.
- Preserve the conditional UX phase for UI changes in automatic mode.
- Keep the existing single approval before any agent execution and preserve the full quality and archive pipeline.

**Non-Goals:**
- Force answers when relevant details are already specified or discoverable.
- Use the `question` tool for discovery; it remains reserved for final design approval.
- Change the user-facing mode choice, quality criteria, agent permissions, or add dependencies.
- Add brittle tests that assert exact prompt or documentation wording.

## Decisions

- Perform two distinct discovery passes before drafting the proposal: first resolve material ambiguity; then confirm intent, scope, context, and acceptance. Each pass may conclude without questions when its details are already clear.
- Ask automatic versus assisted execution at the beginning unless already specified. Mode selection is not design approval. After the final design approval, automatic mode uses the existing orchestrator; assisted mode uses the architect-driven sequence.
- In assisted mode, at each agent handoff ask a natural-language clarification and wait only if a material doubt exists; otherwise proceed. In automatic mode, do not ask routine handoff questions; stop and report a blocker that cannot be resolved from approved artifacts or repository context.
- Continue discovery if new material ambiguity appears before approval. Use `question` only for the existing final design-approval gate; preserve every downstream quality and archive gate.
- Require exactly one terminal `<osm-workflow-result>` JSON block in every automated agent's final response. Expected statuses are: `developer: ready|blocked`, `test-engineer: complete|blocked`, `ux-designer: complete|blocked` when invoked, reviewers `approved|changes_requested|blocked`, correction architect `bundle_ready|continue|blocked`, and verifier per-scenario `pass|fail|unverifiable`. A blocked outcome includes a reason; reviewer findings and verifier scenario results include their structured evidence.
- Run `opencode run --format json`, consume its newline-delimited events, and parse the result block from final assistant text while preserving readable output. Fail closed on missing, duplicate, malformed, or role-invalid blocks; never advance later phases or archive.
- Add an optional `--ux` orchestrator flag. When the approved change has UI/UX requirements, `@architect` passes the flag and automatic mode runs `ux-designer` before developer; otherwise it skips that phase.
- On reviewer `changes_requested` or verifier `fail`, run `@architect` to consolidate feedback and update the findings ledger, then developer correction, test engineer, parallel reviewers, and verifier only after quality succeeds. Repeat the whole correction sequence for at most three rounds. After round three, stop rather than archive if required findings remain or verifier reports `fail`.
- For verifier `unverifiable`, invoke the architect coordinator to assess the documented justification; continue only if it returns `continue` with ledger evidence, otherwise stop before archive. Archive only after valid reviewer approvals, verifier scenarios are `pass` or explicitly justified, and strict validation passes.
- Update the architect and pipeline-agent prompts, root `AGENTS.md`, orchestrator integration and tests, workflow guide, and Spanish change note/changelog. Test status parsing and phase gating with black-box fixtures, not exact prompt wording.

## Risks / Trade-offs

- **[Risk] Two discovery passes feel repetitive for fully specified requests** → Treat them as reviews, not mandatory question lists; skip known facts and ask no more than two questions per turn.
- **[Risk] Assisted clarification is mistaken for an extra approval gate** → Ask only to resolve material uncertainty and retain the separate single design approval.
- **[Risk] Agent omits or malforms its outcome block** → Fail closed and report the agent; never advance or archive.
- **[Risk] Automatic correction skips a review or verifier gate** → Test the complete phase order, status handling, bounded rounds, and archive preconditions with mocked output.
- **[Risk] UI requirements bypass `ux-designer` in automatic mode** → Pass an explicit `--ux` flag from the approved design decision and test that the UX phase runs before developer only when selected.
- **[Risk] Different copies of architect guidance drift** → Update the root guidance and all applicable intake instructions in the architect prompt consistently; reviewers check both.
- **[Trade-off] More discovery can add a turn before proposal creation** → Ask only questions that can change scope, observable behavior, acceptance criteria, or a material trade-off.

## Migration Plan

No runtime or data migration is required. The updated instructions take effect for subsequent new changes. Rollback consists of reverting the architect/root guidance and documentation changes together with the OpenSpec change; no user configuration or existing change is rewritten.
