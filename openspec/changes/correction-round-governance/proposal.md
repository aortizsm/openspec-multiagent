# Proposal

## Intent

Replace the three contradictory correction-round numbers with one rule that can actually be met: only findings that block acceptance consume a round, cosmetic findings never block archive, non-convergence stops the cycle and escalates, and a behavior-preserving correction does not restart the whole quality sequence.

## Why

Today the cap is unusable, and the user paid for it twice in one session:

- Three written rules disagree. `AGENTS.md` and the architect prompt say "at most three rounds"; `Correction allowance is declared per change` says the orchestrator resolves a per-change allowance defaulting to **one** attempt; and `Single correction attempt for future changes` says **at most one** attempt. None of them is enforced in code.
- The cap counts rounds, not risk. Two changes reached the end of the sequence blocked by a function split, an options object, and three documentation counters. The only way to finish them was for the user to authorise an extra round by hand, outside the process.
- One rule is implemented nowhere: `correction_rounds` has no occurrence in `scripts/` or `tests/`.
- Every round repeats the full quality sequence, so a one-line comment fix costs five agent runs. That is the same waste the batch already removed from the test-engineer phase.

## What Changes

- **Only acceptance-blocking findings consume a round.** `CRITICAL`, or a `WARNING` linked to an acceptance criterion or scenario, consume a round and block archive while open. A `SUGGESTION`, a documentation or ledger bookkeeping correction, or a pre-existing issue outside the change's scope is recorded with its disposition and never consumes a round or blocks archive.
- **Non-convergence stops the cycle early.** A resolved finding re-submitted without new evidence, or a developer/reviewer disagreement on the same finding, stops the cycle and reports the ledger to the user, whatever the remaining allowance.
- **Behavior-preserving corrections do not restart the sequence.** A correction that changes no behaviour (comments, documentation, ledger evidence) is confirmed with the finding's source agent and the affected checks; any correction that changes behaviour, tests or specifications restarts the complete sequence.
- **One declared allowance, one default.** The allowance is declared per change in its `.openspec.yaml` (`correction_rounds`, also accepted as `x-correction_rounds`), is consumed by the architect-led cycle, defaults to three rounds, and fails closed when the declared value is not a positive integer. `Single correction attempt for future changes` is removed as superseded.
- Align every place that states the cap: `AGENTS.md`, both occurrences of the architect prompt, the workflow guide, the independent-verification guide, and add contract regressions.

## Capabilities

### Modified Capabilities

- `multiagent-workflow`: rewrites the correction allowance, makes round consumption risk-aware, adds proportional re-verification, adds the non-convergence stop, and removes the single-attempt requirement.

## Impact

- Spec delta for `multiagent-workflow` (three modified requirements, one removed, one added).
- `opencode/agents/architect.md` and `.opencode/agents/architect.md`: the approval paragraph and the two statements in the review loop.
- `AGENTS.md`; `docs/guides/agent-workflow.md` (two places); `docs/guides/independent-verification.md` (two places).
- `tests/run.mjs`: contract regressions over both prompt copies.
- No runtime change: the orchestrator has no correction loop today, and this change does not add one. It makes the written rule match the cycle that actually runs.
