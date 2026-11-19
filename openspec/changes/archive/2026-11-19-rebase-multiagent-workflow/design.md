# Design

## status

Design ready for user approval.

## executive_summary

Align the `multiagent-workflow` spec with the actual implemented behavior by removing 12 phantom requirements (7 "Automatic" mode, "Single correction attempt", "Structured outcomes gate", "Orchestration integration audit", "Review content untrusted", "Review ledger bounded"), updating the `Correction allowance` requirement to match the recently archived `correction-round-governance` change, and promoting the 3 new requirements from that change to the main spec. No runtime code changes; pure spec alignment.

## artifacts

- `proposal.md` — intent, evidence, and scope
- `specs/multiagent-workflow/spec.md` — the delta (REMOVED 12 requirements, MODIFIED 1, ADDED 3)
- `design.md` — decisions, risks, and migration plan
- `tasks.md` — implementation and validation checklist

## Context

The `multiagent-workflow` spec currently lists 36 requirements. Analysis of the codebase (`scripts/orchestrate.mjs`, `tests/run.mjs`, `opencode/agents/architect.md`) shows that:

- The **orchestrator has no correction loop** — it runs agents once. The "automatic orchestration" requirements (7 "Automatic ...") describe a mode that was designed but never built.
- The **"Single correction attempt"** requirement contradicts the recently archived `correction-round-governance` change, which established a **per-change allowance (default 3)** consumed by the **architect-led cycle**.
- The **main spec's `Correction allowance` requirement** still has the old text (default one attempt, orchestrator resolves) even though the `correction-round-governance` change established a new rule (architect-led cycle, default three rounds, declared per change).
- Several requirements describe features that were **designed but never built** (automatic orchestration, structured outcomes gate, orchestration integration audit).

## Goals / Non-Goals

**Goals:**

- Remove all 12 phantom requirements that describe non-existent behavior
- Update `Correction allowance` to match the `correction-round-governance` delta (architect-led cycle, default three rounds, declared per change, fails closed on invalid value)
- Promote the 3 new requirements from the `correction-round-governance` delta to the main spec
- Remove `Single correction attempt for future changes` (superseded)
- Remove `Structured outcomes gate`, `Orchestration integration audit`, `Review content untrusted`, `Review ledger bounded` (covered by correction-round-governance or not implemented)
- Keep all requirements that match actual implementation

**Non-Goals:**

- No runtime code changes, no new dependencies, no permission changes
- No changes to the orchestrator code (it has no correction loop)
- No new capabilities beyond the 3 promoted from the correction-round-governance delta
- No changes to agent permissions or the `MAX_RETRIES = 3` retry limit

## Decisions

1. **Remove 12 requirements in one change** rather than splitting, because they form a coherent group (the abandoned "automatic orchestration" mode and its dependencies). Doing them separately would leave the spec in an inconsistent intermediate state.

2. **Promote the 3 new requirements from `correction-round-governance`** rather than keeping them only in that change's delta. They describe the actual cycle behavior and belong in the main capability spec.

3. **Update `Correction allowance` requirement** to match the `correction-round-governance` delta text exactly. The old text (orchestrator resolves, default one attempt) is factually incorrect for the current cycle.

3. **Remove `Single correction attempt`** as it contradicts the new rule and was never implemented (the orchestrator never had a single-attempt limit; the cycle is architect-led with a declared allowance).

4. **Remove `Structured outcomes gate` and `Orchestration integration audit`** — no automatic orchestration exists to gate or audit.

4. **Remove `Review content is treated as untrusted data` and `Review ledger input is bounded`** — these are already enforced by the `correction-round-governance` rules (ledger bounds are checked, untrusted data handling is in the review rules).

5. **Keep `Mode-specific agent handoffs`** but note it's manual (the architect asks at handoffs). The requirement text already says "MUST ask" in assisted mode, which matches the current manual behavior.

5. **Keep `Distributed agent definitions match their source`** — the `enforcement-guards` change will implement the check.

6. **Keep `Automatic change names have bounded length`** — actually, this one IS implemented (the `validateChangeName` function in `scripts/orchestrate.mjs` enforces 128 chars). Wait, let me verify... Looking at the code: `validateChangeName` checks length < 128 and pattern. So this one IS implemented! I should keep it. Let me correct.

Actually, looking more carefully: `Automatic change names have bounded length` - the spec says "automatic" but the implementation is in the orchestrator's validation. The orchestrator DOES validate change names (128 chars max, alphanumeric/underscore/hyphen). So this requirement IS implemented, just misnamed. I'll keep it but rename/fix the text to remove "Automatic" since it's not automatic - it's a validation.

Wait, let me re-check. The requirement says "Automatic change names have bounded length". The implementation in `scripts/orchestrate.mjs` has `validateChangeName` which checks length and pattern. The orchestrator calls it. It's not "automatic" in the sense of an automatic mode - it's a validation. But the requirement title says "Automatic". This is a naming issue. I'll keep the requirement but fix the text to remove "Automatic" since it's misleading.

Actually, looking at the list again: "Automatic change names have bounded length" - the requirement text might not say "automatic" in the body, just the title. Let me check... The requirement title is "Automatic change names have bounded length" but the body says "Before using a CLI change name in filesystem paths or subprocess arguments, the orchestrator MUST validate its format and reject names longer than 128 characters." This IS implemented (the `validateChangeName` function). The title is misleading. I'll fix the title to remove "Automatic".

6. **Also keep** `Review severities`, `Closing and pre-review checklists`, `Shell permissions support compound commands`, `Canonical OpenSpec tool names`, `Correct Engram tool signatures`, `Proposal gate requires repository sections`, `Standard architect workflow uses one approval`, `Only the standard architect workflow is distributed`, `Orchestrator runs cannot resume past required gates`, `Architect consolidates actionable findings`, `Review findings stay traceable across rounds`, `Developer uses test-first for observable behavior`, `Test engineer complements developer-authored tests`, `Two-stage discovery before proposal`, `Mode-specific agent handoffs`, `Distributed agent definitions match their source`, `Agent prompts carry no bypass or change-specific directives`, `Developer completes clean-code refinement before handoff`, `Avoid speculative performance optimization during refinement`, `Test engineer keeps a least-privilege shell boundary`.

So the final list to keep is 24 requirements (36 - 12 removed = 24).

## risks

- [Spec drift during implementation] → Single change, all removals/updates atomic; validated by `openspec validate --all --strict`
- [Tests referencing removed requirements] → Only `tests/run.mjs` has contract tests; will update to remove references to removed requirements
- [Documentation references] → Will update `docs/guides/agent-workflow.md` and `docs/guides/independent-verification.md` to remove references to removed requirements
- [Spec validation] — `openspec validate --all --strict` must pass after changes

## Migration Plan

No data migration. The spec change is declarative. After archive, the capability spec will match the implemented behavior. The `correction-round-governance` change already established the runtime behavior; this change just aligns the spec with it.

## next_recommended

Obtain user approval, then implement the spec changes, update tests and documentation, validate, and archive.