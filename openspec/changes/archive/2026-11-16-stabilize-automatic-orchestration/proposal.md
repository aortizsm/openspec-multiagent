# Proposal

## Intent

Stabilize automatic agent orchestration and require an integration-feasibility audit before approving changes that modify the orchestrator, agent handoffs, or archive gates.

## Why

The predecessor `improve-adaptive-change-intake` reached its three-round limit with unresolved findings about ledger reconciliation, process-tree cleanup, and test maintainability. Repeating the full review cycle after every correction also makes changes unnecessarily slow. This successor repairs the orchestration gaps, requires an upfront integration-feasibility audit, and limits future changes to one consolidated correction attempt followed by a final quality and verification pass.

## What Changes

- Reconcile automatic architect outcomes with actual findings-ledger rows and evidence; never treat a missing ledger or a model claim as proof that findings are closed.
- Require exact verifier coverage of all spec scenarios, keep reviewer approval/suggestion semantics consistent, and block archive while required findings or unjustified verifier outcomes remain.
- Terminate and reap the complete agent process tree on timeout, output overflow, or a blocked parallel reviewer; preserve bounded output and runtime behavior.
- Keep optional suggestions non-blocking only when the architect records an explicit adoption or non-adoption decision; adopted suggestions must trigger correction.
- Add a source-grounded integration-feasibility audit before final design approval for changes touching agent orchestration, handoffs, outcomes, or archive behavior. Map scenarios to code paths, state transitions, failure handling, side effects, and tests.
- For changes entering implementation after this policy is adopted, allow at most one consolidated correction bundle and one full quality/verifier rerun. If required findings or a verifier failure remain afterward, stop and report them without another correction cycle or archive.
- Preserve the existing automatic/assisted modes and the predecessor's uncommitted implementation as the baseline. Do not reset, commit, archive, or delete `improve-adaptive-change-intake`; keep RF-009, the unrelated unchanged historical architect directive, outside this scope.
- Keep the already-in-progress `stabilize-automatic-orchestration` review under its previously approved correction allowance so the policy change does not invalidate its active work.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multiagent-workflow`: add an integration-feasibility audit and strengthen automatic outcome, ledger, process-lifecycle, and archive gates.

## Impact

- Runtime and tests: `scripts/orchestrate.mjs` and `tests/run.mjs`.
- Agent/project guidance: `opencode/agents/architect.md`, `AGENTS.md`, `docs/guides/agent-workflow.md`, and `docs/guides/independent-verification.md`.
- Human documentation: a Spanish six-section change note and `docs/CHANGELOG.md`.
- OpenSpec: a delta for the existing `multiagent-workflow` capability.
- The blocked predecessor remains active and unarchived; this successor preserves its current worktree and planning artifacts. It does not claim the predecessor passed review.
- No new dependencies, credentials, or permission changes are intended.
