# Design: adaptive-pipeline-profiles

## status
proposed

## executive_summary
Add per-change pipeline profiles declared in `.openspec.yaml` with deterministic risk-based escalation. Profiles compose the agent DAG differently (lite/standard/strict) but all enforce the identical quality threshold. Gap-filler logic skips test-engineer when developer covers all scenarios.

## artifacts
- `scripts/orchestrate.mjs` — profile loading, risk glob matching, DAG composition, gap-filler detection
- `scripts/lib.mjs` — `matchRiskGlobs(diff, riskGlobs)`, `parseCoverageMap(tasksContent)`
- `tests/adaptive-profiles.test.mjs` — risk escalation, gap-filler skip, quality equivalence

## risks
- **Risk glob false negatives**: Must be comprehensive. Start with conservative list, allow `.openspec.yaml` override `risk_globs: []`.
- **Gap-filler parsing**: Coverage map in `tasks.md` must be reliably parseable. Define strict markdown table format.
- **Profile migration**: Existing changes without `.openspec.yaml` default to `standard`. Document clearly.

## next_recommended
Implement profile loading + risk escalation first, then DAG composition, then gap-filler. Depends on Change 1 (fingerprint gates) and Change 2 (verdict contract).