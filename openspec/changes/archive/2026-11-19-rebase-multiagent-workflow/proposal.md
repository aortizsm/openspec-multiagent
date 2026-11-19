# Proposal

## Intent

Rebaseline the `multiagent-workflow` capability to match the actual implemented behavior of the architect-led cycle, removing 12 phantom requirements that describe an "automatic orchestration" mode that was never built, and aligning the correction-round governance with the recently archived `correction-round-governance` change.

## Why

The `multiagent-workflow` spec currently contains 36 requirements, of which **12 describe an "automatic orchestration" mode that was never implemented** and was explicitly abandoned when the design settled on an architect-led cycle. These include:

- 7 "Automatic ..." requirements (automatic mode, findings reconciliation, reviewer dispositions, verifier coverage, process cancellation, UTF-8 output, change name bounds)
- "Single correction attempt for future changes" (contradicted by the new per-change allowance)
- "Structured outcomes gate automatic orchestration"
- "Orchestration integration audit before approval"
- "Review content is treated as untrusted data" (partially duplicated with the new correction-round rules)
- "Review ledger input is bounded" (partially covered by the ledger checks already in place)

Additionally, the `Correction allowance is declared per change` requirement still has the old text (default one attempt, orchestrator resolves) even though the `correction-round-governance` change established a new rule (architect-led cycle, default three rounds, declared per change).

The `Correction allowance` requirement in the main spec still has the old text (default one attempt, orchestrator resolves), and the `Single correction attempt for future changes` requirement contradicts the newly established rule and should be removed.

## What Changes

1. **REMOVE** 7 "Automatic ..." requirements that describe a non-existent automatic orchestration mode:
   - `Automatic mode preserves conditional UX review`
   - `Automatic findings reconcile with the actual ledger`
   - `Automatic reviewer dispositions remain explicit`
   - `Automatic verifier coverage matches the change specs`
   - `Automatic process cancellation is bounded`
   - `Automatic agent output preserves UTF-8 boundaries`
   - `Automatic change names have bounded length`

2. **REMOVE** `Single correction attempt for future changes` (superseded by the new correction-round governance)

3. **REMOVE** `Structured outcomes gate automatic orchestration` (no automatic orchestration exists)

4. **REMOVE** `Orchestration integration audit before approval` (no automatic orchestration to audit)

5. **REMOVE** `Review content is treated as untrusted data` (covered by the new correction-round governance's `Review content is treated as untrusted data` from the correction-round-governance change)

6. **REMOVE** `Review ledger input is bounded` (covered by the ledger bounds already checked in the correction-round-governance change)

6. **MODIFY** `Correction allowance is declared per change` to match the `correction-round-governance` delta (architect-led cycle, default three rounds, declared per change, fails closed on invalid value).

7. **ADD** the three new requirements from the `correction-round-governance` delta as formal requirements in the main spec:
   - `Round consumption follows acceptance`
   - `Correction cycle stops on non-convergence`
   - `Re-verification is proportional to the correction`

8. **KEEP** the requirements that are actually implemented:
   - `Explicit approval with selectable options`
   - `Result contract before delegation`
   - `Validation gate before archiving`
   - `Review severities`
   - `Closing and pre-review checklists`
   - `Shell permissions support compound commands`
   - `Canonical OpenSpec tool names`
   - `Correct Engram tool signatures`
   - `Proposal gate requires repository sections`
   - `Standard architect workflow uses one approval`
   - `Only the standard architect workflow is distributed`
   - `Orchestrator runs cannot resume past required gates`
   - `Architect consolidates actionable findings`
   - `Review findings stay traceable across rounds`
   - `Developer uses test-first for observable behavior`
   - `Test engineer complements developer-authored tests`
   - `Two-stage discovery before proposal`
   - `Mode-specific agent handoffs` (partially implemented, keep but note it's manual)
   - `Distributed agent definitions match their source` (implemented in enforcement-guards change)
   - `Agent prompts carry no bypass or change-specific directives`
   - `Developer completes clean-code refinement before handoff`
   - `Avoid speculative performance optimization during refinement`
   - `Test engineer keeps a least-privilege shell boundary`

## Capabilities

### Modified Capabilities
- `multiagent-workflow`: Complete rebaseline to match actual architect-led cycle behavior

## Impact

- `openspec/specs/multiagent-workflow/spec.md`: Major rewrite removing 12 requirements, updating 1, adding 3
- `openspec/specs/multiagent-workflow/spec.md`: Removal of 7 "Automatic" requirements, 1 "Single correction attempt", 1 "Structured outcomes", 1 "Orchestration integration audit", 1 "Review content untrusted", 1 "Review ledger bounded"
- `openspec/specs/multiagent-workflow/spec.md`: Update `Correction allowance` requirement text to match `correction-round-governance` delta
- Add 3 new requirements from `correction-round-governance` delta
- `openspec/specs/multiagent-workflow/spec.md`: Remove 1 `Single correction attempt` requirement
- `openspec/specs/multiagent-workflow/spec.md`: Remove `Structured outcomes gate automatic orchestration` and `Orchestration integration audit before approval`
- `openspec/specs/multiagent-workflow/spec.md`: Remove `Review content is treated as untrusted data` and `Review ledger input is bounded` (covered by correction-round-governance)
- `tests/run.mjs`: Update tests that reference removed requirements
- Documentation: `docs/guides/agent-workflow.md`, `docs/guides/independent-verification.md`, `README.md` if they reference removed requirements
- Change note and changelog entry

No runtime code changes, no new dependencies, no permission changes. This is a spec alignment change.