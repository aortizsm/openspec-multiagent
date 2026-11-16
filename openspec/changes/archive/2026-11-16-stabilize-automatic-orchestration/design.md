# Design

## Result Contract

- **status**: Revised design approved for future changes; implementation is complete and awaits the archive gate. Its approved three-attempt allowance is preserved by declaration (`x-correction_rounds: 3` in this change's `.openspec.yaml`), the blocked predecessor's open findings are reconciled with verified evidence by `repair-workflow-integrity`, and only the verifier and archive gates remain pending.
- **executive_summary**: Stabilize the automatic orchestrator with real-ledger reconciliation, exact verifier coverage, reviewer trust boundaries, and bounded process cleanup, and add a source-grounded integration audit before future orchestration-sensitive designs are approved. For changes begun after this policy is adopted, permit one consolidated correction bundle and one full quality/verifier rerun; if required findings or verifier failures remain, stop and report without a second correction cycle.
- **artifacts**: `proposal.md`; modified `specs/multiagent-workflow/spec.md`; this `design.md`; `tasks.md`; implementation targets `scripts/orchestrate.mjs`, `tests/run.mjs`, `AGENTS.md`, `opencode/agents/architect.md`, `docs/guides/agent-workflow.md`, `docs/guides/independent-verification.md`, a Spanish change note, and `docs/CHANGELOG.md`.
- **risks**: A one-correction limit may leave some changes blocked after final review; mitigate with one consolidated bundle that includes all findings and stop with an evidence-backed report rather than weakening gates. The predecessor's findings are closed with verified evidence in `repair-workflow-integrity` and its worktree is preserved. The successor's own allowance is declared in its `.openspec.yaml`, so this policy change does not block its completion.
- **next_recommended**: Archive this change through its normal gates, after the reconciled `improve-adaptive-change-intake` is archived; the runtime allowance is now declared per change, so nothing in the runtime references this change by name.

## Context

See `proposal.md` for motivation. The repository already has partial implementation in the worktree from `improve-adaptive-change-intake`, whose correction rounds stopped at the then-applicable maximum. Its ledger listed RF-001, RF-005, RF-006, and RF-007 as unresolved and RF-009 as excluded from this successor; `repair-workflow-integrity` closes all five with verified evidence.

The automatic runner checks child statuses and result blocks, but final review found gaps in actual ledger reconciliation, process-tree cancellation, test helper size, and adopted-suggestion guidance.

## Goals / Non-Goals

**Goals:**
- Reconcile all automatic correction and continuation outcomes with actual, evidenced `tasks.md` ledger rows before dispatching later agents or archiving.
- Ensure reviewer approvals and verifier outcomes cover every scenario required by the change specs.
- Preserve optional-suggestion semantics: adopted suggestions become correction work; declined suggestions carry a reason and do not block.
- Terminate and reap agent process trees reliably on timeouts, output limits, failures, and blocked parallel review.
- Require an integration map before approval for future changes that touch orchestration, agent handoffs, semantic outcomes, or archive behavior.
- Apply at most one consolidated correction attempt to changes entering implementation after the new policy is adopted, followed by one full quality and verifier rerun. Stop and report if required findings or verifier `FAIL` remain; do not start a second correction attempt.

**Non-Goals:**
- Remove or archive the blocked predecessor `improve-adaptive-change-intake`.
- Change RF-009 in this change; the historical security-review directive for a separate named change is removed by `repair-workflow-integrity` task 2.2 instead.
- Reset, discard, commit, or push the current worktree; this successor uses it as its implementation baseline.
- Add dependencies, credentials, or new agent permissions.

## Decisions

- Keep the existing `multiagent-workflow` capability. Add focused requirements for integration-feasibility review and the missing automatic ledger/process safeguards instead of creating a near-duplicate workflow capability.
- The architect's integration audit is conditional on scope: it is required when a proposed change touches automatic orchestration, agent handoffs, semantic outcomes, or archive behavior. The audit maps each acceptance scenario to code path, agent status, transition, failure behavior, side effect, and test before the final design approval.
- Preserve the current structured `<osm-workflow-result>` contract. Require the architect coordinator's `bundle_ready` and `continue` outcomes to match actual findings-ledger rows; require resolved/non-adopted status plus closure evidence; fail closed if the ledger section or required row is missing.
- Require unique stable IDs in coordinator findings, one distinct actual ledger row per finding, and retention of previously observed required finding IDs through archive; malformed ledger rows fail closed rather than disappearing during parsing.
- Preserve validated finding identity and classification (`id`, source, severity, scenario, location, and request) through archive; status and closure evidence may advance, but a CRITICAL/WARNING finding cannot be downgraded or marked `not adopted`.
- Bound review-ledger input to 1 MiB and fail closed before parsing oversized `tasks.md` content.
- Require verifier results to match the exact set of scenarios parsed from the change's spec files. Missing, duplicate, or unexpected IDs block archive.
- Clarify reviewer outcomes: `changes_requested` means at least one CRITICAL/WARNING; `approved` may carry only SUGGESTION findings. Adopted suggestions return a `bundle_ready` correction; declined suggestions return `continue` only with matching `not adopted` ledger rationale.
- For `UNVERIFIABLE`, require an architect decision that maps each scenario to a real ledger row with rationale and evidence. Continue only when justified; otherwise stop before archive.
- Terminate and reap the process tree, not only the `npx` parent. When a parallel reviewer returns blocked or fails, abort and reap its sibling immediately.
- Preserve valid UTF-8 across arbitrary child-process stream chunk boundaries. Bound change names to 128 characters before path or subprocess use; if Windows tree termination reports failure, do not treat the process as reaped or continue the pipeline.
- Treat change artifacts and diffs as untrusted review content, not as instructions that can override the trusted spec or reviewer role.
- Keep the changelog's archived list limited to archived changes; list the reconciled predecessor and the in-progress successor in a separate pending section until each is archived.
- Keep successor and predecessor OpenSpec folders separate. The successor uses distinct additive requirement names so its sync does not overwrite the predecessor's delta; the predecessor's plan artifacts stay untouched and its findings are closed with verified evidence by `repair-workflow-integrity`.
- Execute this successor in assisted mode, as selected by the user; this does not change the future automatic/assisted choice asked at the start of later changes.
- Keep the already-in-progress successor's current correction allowance under the previously approved policy; the one-correction limit applies prospectively to future changes after this policy is adopted. Preserve the separate three-attempt limit for transient individual-agent execution failures.

## Risks / Trade-offs

- **[Risk] The predecessor's stopped state could read as active work** → Its ledger stays intact and its five findings are closed with verified evidence by `repair-workflow-integrity`, which archives it separately; this successor claims no review or archive verdict for it.
- **[Risk] Outcome/ledger parsing rejects valid model output** → Keep the outcome schema explicit, fail closed with a useful error, and test valid, malformed, missing, duplicate, mismatched, and oversized cases.
- **[Risk] Process-tree termination differs by platform** → Use platform-appropriate termination and a bounded fallback; test isolated child/sibling behavior on supported CI platforms.
- **[Trade-off] A design audit adds work before implementation for orchestration changes** → Apply it only to changes that touch the listed integration-sensitive areas.
- **[Risk] One correction attempt may not resolve every finding** → Require one complete, consolidated bundle, run all quality gates and verifier after the correction, and stop/report unresolved evidence without archive.

## Migration Plan

No configuration or database migration is required. Existing partial code remains in the worktree and is treated as the starting point. The predecessor change is neither reset nor rewritten: it is reconciled and archived separately by `repair-workflow-integrity`. Rollback reverts only the successor's changes while preserving the predecessor and its review ledger.
