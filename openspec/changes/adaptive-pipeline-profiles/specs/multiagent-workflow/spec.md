# multiagent-workflow Specification (delta: adaptive-pipeline-profiles)

## Profile Declaration

#### Scenario: profile declared in .openspec.yaml
- **WHEN** change has `.openspec.yaml` with `pipeline: lite|standard|strict`
- **THEN** orchestrator reads declared profile
- **WHEN** no `.openspec.yaml` or no `pipeline` key
- **THEN** default profile = `standard`

#### Scenario: risk globs configurable
- **WHEN** `.openspec.yaml` has `risk_globs: []`
- **THEN** those globs used instead of defaults
- **WHEN** no `risk_globs` key
- **THEN** defaults: `['**/auth/**', '**/migrations/**', '**/sql/**', '**/api/public/**', '**/secrets/**', '**/*.sql', '**/database/**']`

## Risk-Based Escalation

#### Scenario: risk diff forces strict
- **WHEN** declared profile = `lite` or `standard` AND `matchRiskGlobs(diff, riskGlobs)` = true
- **THEN** effective profile = `strict`
- **THEN** telemetry records `profile_escalated: true`, `original_profile`, `matched_globs`

#### Scenario: lite with risk diff is hard error
- **WHEN** declared profile = `lite` AND `matchRiskGlobs(diff, riskGlobs)` = true
- **THEN** orchestrator throws hard error: `"lite profile prohibited for changes touching risk paths: <globs>. Use standard or strict."`
- **THEN** no agents invoked

## DAG Composition

#### Scenario: lite profile runs developer → code-reviewer → verifier
- **WHEN** effective profile = `lite`
- **THEN** agent order: `developer` → `code-reviewer` → `verifier`
- **THEN** `code-reviewer` runs unified clean-code + security checklist (single reviewer)
- **THEN** `test-engineer` and `security-reviewer` not invoked

#### Scenario: standard profile runs developer → test-engineer(gap-filler) → parallel reviewers+verifier
- **WHEN** effective profile = `standard`
- **THEN** agent order: `developer` → `test-engineer` (mode: gap-filler) → `[code-reviewer ∥ security-reviewer ∥ verifier]`
- **THEN** `test-engineer` only fills gaps per coverage map

#### Scenario: strict profile runs developer → test-engineer(full) → parallel reviewers+verifier
- **WHEN** effective profile = `strict`
- **THEN** agent order: `developer` → `test-engineer` (mode: full) → `[code-reviewer ∥ security-reviewer ∥ verifier]`
- **THEN** `test-engineer` writes full scenario coverage (not just gaps)

## Gap-Filler

#### Scenario: coverage map parsed from tasks.md
- **WHEN** `parseCoverageMap` reads `tasks.md`
- **THEN** finds table with columns: `Scenario`, `Test File`, `Test Case`, `Status`
- **THEN** `Status` values: `covered` | `no-deterministic-test` (requires architect approval note)

#### Scenario: all scenarios covered → test-engineer skipped
- **WHEN** `parseCoverageMap` returns `allCovered: true`
- **THEN** `test-engineer` omitted from DAG for `standard` profile
- **THEN** telemetry records `test_engineer_skipped: true`, `reason: "full_coverage"`

#### Scenario: gap exists → test-engineer runs gap-filler
- **WHEN** `parseCoverageMap` returns `allCovered: false` with `gaps: [...]`
- **THEN** `test-engineer` invoked with gaps as input
- **THEN** `test-engineer` only writes tests for uncovered scenarios

## Quality Threshold Invariant

#### Scenario: all profiles satisfy identical quality gates
- **WHEN** any profile completes
- **THEN** `@verifier` runs same scenarios (verifier bundle unchanged)
- **THEN** ledger gate blocks on open CRITICAL/WARNING (Change 1)
- **THEN** `openspec validate --strict` passes
- **THEN** all required gates current PASS (fingerprint-matched, Change 1)

#### Scenario: verifier suite scope unchanged by profile
- **WHEN** `lite` or `standard` or `strict`
- **THEN** verifier receives same scenarios bundle
- **THEN** verifier runs same commands
- **THEN** verifier reports per-scenario PASS/FAIL/UNVERIFIABLE