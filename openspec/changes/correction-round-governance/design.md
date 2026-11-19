# Design

## status

Design ready for user approval.

## executive_summary

Replace the three contradictory correction-round numbers — three rounds in prose, a per-change allowance defaulting to one, and a single attempt in the spec — with one rule: only findings that block acceptance consume a round and block archive, cosmetic or bookkeeping findings never do, non-convergence stops the cycle and escalates, and a correction that changes no behaviour is confirmed with the finding's source agent instead of restarting the full quality sequence. The allowance stays declared per change, with a single default of three. No runtime change.

## artifacts

- `proposal.md` — intent, evidence, and scope.
- `specs/multiagent-workflow/spec.md` — the delta: three requirements modified, one removed, one added.
- `design.md` — the rule, the decided defaults, and the risks.
- `tasks.md` — implementation and validation checklist.

## Context

The cap is written in five files and nine places: `AGENTS.md`, three statements in the architect prompt (the approval paragraph and two lines of the review loop), the same three in the installed mirror, two places in the workflow guide, and two in the independent-verification guide. The spec carries `Correction allowance is declared per change` (the orchestrator resolves it, defaulting to one attempt), `Single correction attempt for future changes` (at most one attempt), and `Review findings stay traceable across rounds` (piggybacking the ledger rules).

Nothing enforces any of it: `correction_rounds` appears nowhere in `scripts/` or `tests/`, and the orchestrator has no correction loop at all — it runs the agent list once. The cycle that runs is the architect-led one described in prose, and its number came from the prose alone.

The evidence for the cost is this batch: two changes stalled at the round cap with only cosmetic findings open, and both needed a round authorised by hand to finish.

## Goals / Non-Goals

**Goals:**

- One number: the declared per-change allowance, default three, consumed by the cycle that actually runs.
- Round consumption proportional to risk, so cosmetic findings never block archive.
- An early stop that exists for the reason a cap exists — non-convergence — instead of a blind counter.
- Re-verification proportional to what changed.

**Non-Goals:**

- Implement a correction loop in `scripts/orchestrate.mjs`: that path runs the pipeline once and is out of scope here; if it is ever given a loop, it consumes the same declared allowance.
- Soften any gate: acceptance-blocking findings still consume rounds and still block archive, and non-convergence stops harder than before, not softer.
- Re-baseline the phantom requirements of `multiagent-workflow` beyond the two this rule replaces; that is the next change.
- Change how `@verifier` results are treated: a `FAIL` remains a blocking finding.

## Decisions

1. **Consumption follows acceptance, not severity labels in the abstract.** A `CRITICAL`, or a `WARNING` tied to an acceptance criterion or scenario, blocks acceptance and consumes a round. Everything else is recorded with a disposition and continues. This is the rule that would have let this batch's two blocked changes finish, while still stopping a real defect.
2. **Non-convergence replaces the blind counter as the early stop.** Re-submitting a resolved finding without new evidence, or a developer/reviewer deadlock on the same finding, stops the cycle immediately and escalates with the ledger. A cap that fires on converging work was the defect; a stop that fires on non-convergence is the protection worth keeping.
3. **Re-verification proportional to the change.** A behavior-preserving correction (comments, documentation, ledger counters) is confirmed with the finding's source agent plus the affected checks; behavior, tests or spec changes restart the full sequence. Today every correction costs five agent runs, which is what made the cap painful in the first place.
4. **One default, stated once: three.** The declared per-change value wins; the default is the number the prose has always used, so no change in practice for an ordinary change, and a change that needs more declares it instead of asking the user mid-flight.
5. **The removal carries a reason and a migration.** `Single correction attempt for future changes` is removed with its rationale: it contradicted the per-change allowance, was never implemented, and clamped the cycle to a single attempt, which is what forced hand-authorised rounds. Its migration points to the declared allowance plus the risk-aware rule.
6. **Align all nine places, and test the two copies.** The prompt is the artifact that governs behaviour, so a rule stated only in the spec is a rule the agent will not follow. The regression asserts the new rule's clauses in both prompt copies and asserts that the removed wording is gone.
7. **No runtime change.** The orchestrator's `MAX_RETRIES = 3` is a different thing — attempts for a failed agent process — and the change notes that distinction explicitly, because the two numbers being both three has already caused confusion.

## risks

- [A cosmetic finding could now go unrecorded and unnoticed] → It must still be recorded with its disposition (`resolved` or `not adopted` with rationale); the rule removes its power to block, not its trace.
- [The absence of a hard cap could let a cycle run long] → Only acceptance-blocking findings consume rounds and the declared allowance still ends the cycle; non-convergence stops it earlier than the allowance would.
- [Proportional re-verification could skip a gate] → It applies only when the correction changes no behaviour, and it still requires the source agent's confirmation plus the affected checks; anything touching behaviour, tests or specs restarts everything.
- [Nine places could drift apart again] → The regression reads both prompt copies, and the guide updates are part of the same diff; the statefulness this batch has been fixing came precisely from aligning some places and not others.
- [Readers could mistake the allowance for the orchestrator's retry limit] → The change states the distinction in the design, the change note and the prompt, and the regression asserts the retired wording is gone.

## Migration Plan

No data or runtime migration. The corrected prompt applies in this repository immediately, because OpenCode reads the project-local definition; other projects pick it up with the user-level reinstall (`node scripts/install-agents.mjs --force`) that closes this batch.

## next_recommended

Obtain user approval, then write the delta, align the nine places, add the contract regressions, update the documentation, and run `npm test`, `npm run check`, and strict OpenSpec validation.
