# multiagent-workflow Specification (delta: harden-orchestrator-gates)

## Telemetry

#### Scenario: telemetry recorded per invocation
- **WHEN** orchestrator starts for a change
- **THEN** an invocation record is appended to `openspec/changes/<change>/.run.json` with `profile`, `timestamp`, `invocation_id`
- **THEN** each gate records `attempts`, `wall_ms`, `exit_code`, `verdict`, `fingerprint`, `skipped`, `bundle_bytes`, `tokens` (or `null`)

#### Scenario: token stats captured when available
- **WHEN** `opencode stats --json --cost --project . --days 0` succeeds
- **THEN** telemetry includes `tokens.input`, `tokens.output`, `tokens.reasoning`, `tokens.cache_read`, `tokens.cache_write`, `cost`
- **WHEN** command fails or returns no data
- **THEN** telemetry records `tokens: null` and does not block

## Base-Ref and Diff

#### Scenario: base_ref recorded on first run
- **WHEN** orchestrator runs for a change with no `.gates.json`
- **THEN** `base_ref = git rev-parse HEAD` is written to `.gates.json`

#### Scenario: change diff includes staged and untracked
- **WHEN** `computeChangeDiff(baseRef)` runs
- **THEN** output equals `git diff <baseRef>` (includes staged) plus content of untracked files from `git ls-files --others --exclude-standard`
- **THEN** diff artifact written to `.opencode/run/<change>/change.diff`

## Fingerprint Gates

#### Scenario: fingerprint computed from all gate inputs
- **WHEN** `computeFingerprint` is called
- **THEN** input = concatenation of: `base_ref` + diff bytes + proposal/design/tasks/specs bytes + agent definition file bytes + resolved model id + bundle format version
- **THEN** output is SHA-256 hex string

#### Scenario: gate skipped when fingerprint matches
- **WHEN** orchestrator re-invoked and a gate has PASS with identical fingerprint
- **THEN** gate is skipped, telemetry records `skipped: true`, agent not invoked

#### Scenario: gate invalidated when any input changes
- **WHEN** any byte of diff/spec/prompt/model/agent-definition changes
- **THEN** fingerprint differs, gate runs normally

#### Scenario: archive requires all gates current PASS
- **WHEN** `validateAllGatesPass` runs before archive
- **THEN** all required gates for the profile have `verdict=PASS` and `fingerprint` matching current inputs
- **THEN** missing or stale gate blocks archive

## Ledger Gate

#### Scenario: open CRITICAL/WARNING blocks archive
- **WHEN** `checkLedgerGate` runs and finds row with `severity=CRITICAL` or `WARNING` and `status=open`
- **THEN** returns `{blocked: true, findings: [...]}`
- **THEN** orchestrator blocks before `validate`/`archive`

#### Scenario: resolved with evidence does not block
- **WHEN** row has `severity=WARNING` and `status=resolved` with non-empty `evidence`
- **THEN** does not block archive

#### Scenario: ledger contract requires status column
- **WHEN** `isLedgerHeader` validates header row
- **THEN** requires column named `status` (case-insensitive) in addition to existing requirements

## Retry Policy

#### Scenario: transport failure retries once
- **WHEN** agent exits ≠0 and produces no verdict artifact
- **THEN** exactly 1 retry with same input
- **THEN** attempt count persisted in `.run.json`

#### Scenario: verdict FAIL never blind-retries
- **WHEN** agent exits 0 but verdict artifact shows `verdict=FAIL`
- **THEN** no retry; findings written to `<agent>-findings.json`
- **THEN** developer invoked next with findings as input

#### Scenario: max 3 fix cycles then escalate
- **WHEN** fix cycle count reaches 3 for a change
- **THEN** orchestrator escalates to architect (throws with evidence)

#### Scenario: counters persisted not in-memory
- **WHEN** orchestrator restarts
- **THEN** retry/fix counters read from `.run.json`, not from memory Map

## Parallel DAG

#### Scenario: reviewers and verifier run in parallel
- **WHEN** `runParallelGroupNoKill` executes for `[code-reviewer, security-reviewer, verifier]`
- **THEN** all three spawned concurrently
- **THEN** `Promise.allSettled` waits for all

#### Scenario: sibling failure does not kill others
- **WHEN** one agent in parallel group fails
- **THEN** other agents continue to completion
- **THEN** no `child.kill()` called on siblings

#### Scenario: findings consolidated from all group members
- **WHEN** parallel group completes with mixed verdicts
- **THEN** all findings (including from PASS agents) consolidated into single fix pass for developer

#### Scenario: timeout kills only hung process
- **WHEN** agent exceeds `ORCHESTRATOR_TIMEOUT_MS` (default 15 min)
- **THEN** only that child process killed
- **THEN** gate marked transport FAIL
- **THEN** other agents unaffected

## Rollback Semantics

#### Scenario: read-only gates never revert code
- **WHEN** reviewer or verifier gate fails
- **THEN** no `rollbackToCheckpoint` called
- **THEN** developer's implementation preserved

#### Scenario: implementation gates revert only own edits
- **WHEN** developer or test-engineer gate fails
- **THEN** rollback reverts only changes from that agent's checkpoint
- **THEN** previous agents' work preserved