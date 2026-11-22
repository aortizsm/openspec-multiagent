# Tasks: adaptive-pipeline-profiles

## Phase 1: Profile Loading + Risk Escalation

- [x] 1.1 Extend `loadOpenSpecConfig(changeName)` in `orchestrate.mjs` to read `pipeline` and `risk_globs` from `.openspec.yaml`.
- [x] 1.2 Add `DEFAULT_RISK_GLOBS` constant in `lib.mjs`: `['**/auth/**', '**/migrations/**', '**/sql/**', '**/api/public/**', '**/secrets/**', '**/*.sql', '**/database/**']`.
- [x] 1.3 Add `matchRiskGlobs(diff, riskGlobs)` in `lib.mjs`: returns true if any changed file matches any glob (use `micromatch` or minimatch logic with built-ins only).
- [x] 1.4 In `main()`: compute effective profile = declared profile, but if `matchRiskGlobs(diff, effectiveRiskGlobs)` → force `strict`. If declared `lite` and risk matched → hard error.

## Phase 2: DAG Composition per Profile

- [x] 2.1 Define `getAgentDAG(profile)` returning ordered agent list with parallel groups marked.
  - `lite`: `['developer', 'code-reviewer', 'verifier']` (code-reviewer runs unified checklist)
  - `standard`: `['developer', 'test-engineer', ['code-reviewer', 'security-reviewer', 'verifier']]`
  - `strict`: same as standard but `test-engineer` mode = `full` (not `gap-filler`)
- [x] 2.2 Modify `runAgents` to accept DAG from `getAgentDAG` and execute accordingly.
- [x] 2.3 For `lite`: code-reviewer prompt receives unified clean+security criteria (update prompt or pass flag).

## Phase 3: Gap-Filler Logic

- [x] 3.1 Define coverage map table format in `tasks.md`:
  ```markdown
  | Scenario | Test File | Test Case | Status |
  |----------|-----------|-----------|--------|
  | user can login | src/auth.test.ts | valid credentials | covered |
  | login fails | src/auth.test.ts | invalid credentials | covered |
  | password reset | N/A | N/A | no-deterministic-test (architect approved) |
  ```
- [x] 3.2 Add `parseCoverageMap(tasksContent)` in `lib.mjs`: returns `{allCovered: boolean, gaps: string[]}`.
- [x] 3.3 In `getAgentDAG` for `standard`: if `allCovered` → omit `test-engineer` from DAG (verified in JS).
- [x] 3.4 Telemetry records `test_engineer_skipped: true` with reason.

## Phase 4: Quality Threshold Enforcement

- [x] 4.1 Verify all profiles run same `verifier` scenarios (verifier bundle unchanged).
- [x] 4.2 Ledger gate, validate, fingerprint gates identical across profiles (from Change 1).
- [x] 4.3 Test: `lite` with risk diff → escalates to `strict` (integration test).
- [x] 4.4 Test: full coverage → test-engineer skipped (unit test with mock).

## Phase 5: Tests

- [x] 5.1 `tests/adaptive-profiles.test.mjs`: risk glob matching, profile escalation, gap-filler skip, DAG composition per profile.

## Phase 6: Documentation

- [x] 6.1 Update `AGENTS.md` with profile definitions, risk globs, gap-filler rule.
- [x] 6.2 Create `docs/changes/YYYY-MM-DD-adaptive-pipeline-profiles.md`.

## Review Findings

| ID | Source | Severity | Linked Criterion | File/Location | Requested Correction | Status | Evidence |
|----|--------|----------|------------------|---------------|----------------------|--------|----------|