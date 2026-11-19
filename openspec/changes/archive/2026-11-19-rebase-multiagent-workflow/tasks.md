# Tasks

## 1. Remove phantom requirements from spec

- [ ] 1.1 Remove the 7 "Automatic ..." requirements from `openspec/specs/multiagent-workflow/spec.md`:
  - Automatic mode preserves conditional UX review
  - Automatic findings reconcile with the actual ledger
  - Automatic reviewer dispositions remain explicit
  - Automatic verifier coverage matches the change specs
  - Automatic process cancellation is bounded
  - Automatic agent output preserves UTF-8 boundaries
  - Automatic change names have bounded length (rename to remove "Automatic" prefix, since validation exists but isn't "automatic")

- [ ] 1.2 Remove `Single correction attempt for future changes` requirement (superseded by `correction-round-governance`).

- [ ] 1.3 Remove `Structured outcomes gate automatic orchestration` requirement (no automatic orchestration exists).

- [ ] 1.4 Remove `Orchestration integration audit before approval` (no automatic orchestration to audit).

- [ ] 1.5 Remove `Review content is treated as untrusted data` (covered by `correction-round-governance`).

- [ ] 1.6 Remove `Review ledger input is bounded` (covered by `correction-round-governance` limits).

- [ ] 1.7 Rename `Automatic change names have bounded length` to `Change names have bounded length` (validation exists in `scripts/orchestrate.mjs:validateChangeName` but it's not "automatic").

## 2. Update Correction allowance requirement

- [ ] 2.1 Replace the text of `Correction allowance is declared per change` in `openspec/specs/multiagent-workflow/spec.md` with the text from the `correction-round-governance` delta (architect-led cycle, default three rounds, declared per change, fails closed on invalid value, extension spelling accepted). Verify requirement text stays under 500 characters.

## 3. Add new requirements from correction-round-governance

- [ ] 3.1 Add `Round consumption follows acceptance` requirement with its two scenarios.
- [ ] 3.2 Add `Correction cycle stops on non-convergence` requirement with its two scenarios.
- [ ] 3.3 Add `Re-verification is proportional to the correction` requirement with its two scenarios.

## 4. Remove superseded requirement

- [ ] 4.1 Remove `Single correction attempt for future changes` requirement (superseded by `correction-round-governance`).

## 5. Update tests

- [ ] 5.1 Update `tests/run.mjs` to remove test cases that reference removed requirements. Search for references to:
  - "Automatic mode"
  - "Automatic findings"
  - "Automatic reviewer"
  - "Automatic verifier"
  - "Automatic process cancellation"
  - "Automatic agent output"
  - "Automatic change names"
  - "Single correction attempt"
  - "Structured outcomes gate"
  - "Orchestration integration audit"
  - "Review content is treated as untrusted data"
  - "Review ledger input is bounded"
  - "Single correction attempt"
  - "Structured outcomes gate"
  - "Orchestration integration audit"

- [ ] 5.2 Ensure no test references removed requirements.

## 6. Documentation

- [ ] 6.1 Update `docs/guides/agent-workflow.md` to remove references to removed requirements.
- [ ] 6.2 Update `docs/guides/independent-verification.md` if it references removed requirements.
- [ ] 6.3 Update `README.md` if it references removed requirements.

## 7. Documentation

- [ ] 7.1 Create `docs/changes/2026-11-19-rebase-multiagent-workflow.md` with six sections (Contexto, Qué cambió, Por qué, Cómo se usa, Impacto/Migración, Evidencia + Referencias). Formato como `docs/changes/2026-11-19-architect-edit-boundary.md`.
- [ ] 7.2 Add line to `<!-- latest start -->` block of `docs/CHANGELOG.md`.

## 8. Validation

- [ ] 8.1 Run `npm test`, `npm run check`, `openspec validate rebase-multiagent-workflow --strict`, `git diff --check`.
- [ ] 8.2 Verify `openspec validate --all --strict` passes (24 specs).
- [ ] 8.3 Verify `git diff --check` clean.