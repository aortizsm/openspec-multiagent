# Proposal

## Intent

Declare per-change pipeline profiles (`lite|standard|strict`) in `.openspec.yaml` with deterministic composition rules. The orchestrator FORCES `strict` when the diff touches risk globs (auth, SQL, migrations, public API, secrets) — code, not prompt. Profiles compose the agent DAG differently but all satisfy the identical quality threshold.

## Why

1. **One size fits all**: Today every change runs the full `standard` pipeline. Doc-only changes pay for test-engineer + 3 reviewers + verifier. High-risk changes don't get extra scrutiny.
2. **No risk detection**: The orchestrator doesn't inspect the diff to escalate profile. A migration script runs `lite` if the architect mistakenly declares it.
3. **Test-engineer always runs**: Even when developer already wrote all scenario tests. The "gap-filler" concept exists in AGENTS.md but isn't enforced by the orchestrator.
4. **Quality threshold invariant**: All 3 profiles must meet the same 4 acceptance gates (verifier PASS, zero open CRITICAL/WARNING, validate strict, all gates current PASS).

## What Changes

### 3.1 Profile Declaration + Deterministic Validation
- `.openspec.yaml` per change: `pipeline: lite|standard|strict` (default `standard`), declared by `@architect` in design with justification.
- Orchestrator **FORCES `strict`** if diff matches any risk glob (configurable list):
  - `**/auth/**`, `**/migrations/**`, `**/sql/**`, `**/api/public/**`, `**/secrets/**`, `**/*.sql`, `**/database/**`
  - `lite` prohibited for risk diffs — hard error, not warning.
- Validation in code (JS), not prompt.

### 3.2 Profile Composition
- **lite** (docs/prompts/internal refactor): `developer` (includes tests) → `code-reviewer` (unified clean+security checklist) → `verifier`
- **standard**: `developer` → `test-engineer` (GAP-FILLER only) → `[code-reviewer ∥ security-reviewer ∥ verifier]`
- **strict**: `standard` with `test-engineer` FULL (not gap-filler) + full verifier suite
- **Gap-filler rule**: Developer reports scenario→test map in `tasks.md` (parseable table). If every scenario has a test OR explicit "no deterministic test applies" approved by architect, orchestrator SKIPS `test-engineer` (verified in JS, not prompt).

### 3.3 Quality Threshold Invariant
- All 3 profiles must satisfy:
  1. All spec scenarios PASS with real command evidence (`@verifier`)
  2. Zero open CRITICAL/WARNING in ledger
  3. `openspec validate <change> --strict` passes
  4. All required gates current PASS (fingerprint-matched)

## Acceptance Criteria

- Declaring `lite` with diff in risk path → orchestrator escalates to `strict` (test fails if it doesn't).
- Full scenario coverage → `test-engineer` not invoked (mock test verifies skip).
- Quality threshold identical across profiles (verifier runs same scenarios, ledger gate same, validate same).