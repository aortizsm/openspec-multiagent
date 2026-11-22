# Spec Delta: adaptive-pipeline-profiles

## ADDED Requirements

### Requirement: Pipeline profile declaration
The orchestrator MUST read the declared pipeline profile from the change's `.openspec.yaml` (`pipeline`, accepted as `pipeline` or the OpenSpec extension spelling `x-pipeline`), defaulting to `standard` when the key or file is absent. The risk globs MUST also be configurable, defaulting to `**/auth/**`, `**/migrations/**`, `**/sql/**`, `**/api/public/**`, `**/secrets/**`, `**/*.sql`, and `**/database/**`.

#### Scenario: profile declared in .openspec.yaml
- **WHEN** a change has `.openspec.yaml` with `x-pipeline: lite|standard|strict`
- **THEN** the orchestrator reads the declared profile
- **WHEN** there is no `.openspec.yaml` or no `pipeline` key
- **THEN** the default profile is `standard`

#### Scenario: risk globs configurable
- **WHEN** `.openspec.yaml` declares `risk_globs: []`
- **THEN** those globs are used instead of the defaults
- **WHEN** there is no `risk_globs` key
- **THEN** the defaults are used: `['**/auth/**', '**/migrations/**', '**/sql/**', '**/api/public/**', '**/secrets/**', '**/*.sql', '**/database/**']`

### Requirement: Risk-based escalation
A diff that matches any risk glob MUST escalate a `standard` profile to `strict` and MUST be a hard error for a `lite` profile. Telemetry MUST record `profile_escalated: true`, `original_profile`, and `matched_globs` when escalation occurs, and no agent MUST be invoked when a `lite` profile is rejected.

#### Scenario: risk diff forces strict
- **WHEN** the declared profile is `lite` or `standard` and `matchRiskGlobs(diff, riskGlobs)` is true
- **THEN** the effective profile is `strict`
- **THEN** telemetry records `profile_escalated: true`, `original_profile`, and `matched_globs`

#### Scenario: lite with risk diff is hard error
- **WHEN** the declared profile is `lite` and `matchRiskGlobs(diff, riskGlobs)` is true
- **THEN** the orchestrator throws the hard error `"lite profile prohibited for changes touching risk paths: <globs>. Use standard or strict."`
- **THEN** no agents are invoked

### Requirement: Profile-specific DAG composition
Each profile MUST compose the agent DAG it defines: `lite` runs `developer` → `code-reviewer` (unified clean-code and security checklist) → `verifier` and MUST NOT invoke `test-engineer` or `security-reviewer`; `standard` runs `developer` → `test-engineer` (gap-filler mode) → `[code-reviewer ∥ security-reviewer ∥ verifier]`; `strict` runs `developer` → `test-engineer` (full mode) → `[code-reviewer ∥ security-reviewer ∥ verifier]`.

#### Scenario: lite profile runs developer → code-reviewer → verifier
- **WHEN** the effective profile is `lite`
- **THEN** the agent order is `developer` → `code-reviewer` → `verifier`
- **THEN** `code-reviewer` runs a unified clean-code and security checklist (single reviewer)
- **THEN** `test-engineer` and `security-reviewer` are not invoked

#### Scenario: standard profile runs developer → test-engineer(gap-filler) → parallel reviewers+verifier
- **WHEN** the effective profile is `standard`
- **THEN** the agent order is `developer` → `test-engineer` (mode: gap-filler) → `[code-reviewer ∥ security-reviewer ∥ verifier]`
- **THEN** `test-engineer` only fills gaps per the coverage map

#### Scenario: strict profile runs developer → test-engineer(full) → parallel reviewers+verifier
- **WHEN** the effective profile is `strict`
- **THEN** the agent order is `developer` → `test-engineer` (mode: full) → `[code-reviewer ∥ security-reviewer ∥ verifier]`
- **THEN** `test-engineer` writes full scenario coverage (not just gaps)

### Requirement: Coverage-map gap-filler
`parseCoverageMap` MUST read the coverage table from `tasks.md` with columns `Scenario`, `Test File`, `Test Case`, and `Status`, where `Status` is `covered` or `no-deterministic-test` (the latter requiring an architect approval note). When every scenario is covered the `standard` profile MUST omit `test-engineer`; when gaps exist `test-engineer` MUST be invoked with the gaps as input and write tests only for the uncovered scenarios.

#### Scenario: coverage map parsed from tasks.md
- **WHEN** `parseCoverageMap` reads `tasks.md`
- **THEN** it finds the table with columns `Scenario`, `Test File`, `Test Case`, and `Status`
- **THEN** `Status` values are `covered` or `no-deterministic-test` (the latter requiring an architect approval note)

#### Scenario: all scenarios covered → test-engineer skipped
- **WHEN** `parseCoverageMap` returns `allCovered: true`
- **THEN** `test-engineer` is omitted from the DAG for the `standard` profile
- **THEN** telemetry records `test_engineer_skipped: true` with `reason: "full_coverage"`

#### Scenario: gap exists → test-engineer runs gap-filler
- **WHEN** `parseCoverageMap` returns `allCovered: false` with `gaps: [...]`
- **THEN** `test-engineer` is invoked with the gaps as input
- **THEN** `test-engineer` writes tests only for the uncovered scenarios

### Requirement: Quality threshold invariant across profiles
Every profile MUST satisfy the same quality gates: the `@verifier` MUST run the same scenarios and commands regardless of profile, the ledger gate MUST block archive on any open `CRITICAL`/`WARNING` finding, `openspec validate --strict` MUST pass, and all required gates MUST be current `PASS` with matching fingerprints.

#### Scenario: all profiles satisfy identical quality gates
- **WHEN** any profile completes
- **THEN** `@verifier` runs the same scenarios (verifier bundle unchanged)
- **THEN** the ledger gate blocks on any open `CRITICAL`/`WARNING` finding
- **THEN** `openspec validate --strict` passes
- **THEN** all required gates are current `PASS` with matching fingerprints

#### Scenario: verifier suite scope unchanged by profile
- **WHEN** the effective profile is `lite`, `standard`, or `strict`
- **THEN** the verifier receives the same scenarios bundle
- **THEN** the verifier runs the same commands
- **THEN** the verifier reports per-scenario `PASS`/`FAIL`/`UNVERIFIABLE`
