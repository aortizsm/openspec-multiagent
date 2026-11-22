# Spec Delta: harden-orchestrator-gates

## ADDED Requirements

### Requirement: Telemetry recorded per invocation
The orchestrator MUST append an invocation record to `openspec/changes/<change>/.run.json` at the start of each run, containing `profile`, `timestamp`, and `invocation_id`. Each gate invocation within the run MUST record `attempts`, `wall_ms`, `exit_code`, `verdict`, `fingerprint`, `skipped`, `bundle_bytes`, and `tokens`.

#### Scenario: telemetry recorded per invocation
- **WHEN** the orchestrator starts for a change
- **THEN** an invocation record is appended to `openspec/changes/<change>/.run.json` with `profile`, `timestamp`, `invocation_id`
- **THEN** each gate records `attempts`, `wall_ms`, `exit_code`, `verdict`, `fingerprint`, `skipped`, `bundle_bytes`, `tokens` (or `null`)

#### Scenario: token stats captured when available
- **WHEN** `opencode stats --json --cost --project . --days 0` succeeds
- **THEN** telemetry includes `tokens.input`, `tokens.output`, `tokens.reasoning`, `tokens.cache_read`, `tokens.cache_write`, `cost`
- **WHEN** the command fails or returns no data
- **THEN** telemetry records `tokens: null` and does not block the run

### Requirement: Base-ref and change diff
On the first run for a change with no `.gates.json`, the orchestrator MUST record `base_ref = git rev-parse HEAD` in `.gates.json`. The change diff MUST equal `git diff <base_ref>` (including staged changes) plus the content of untracked files reported by `git ls-files --others --exclude-standard`, and MUST be persisted to `.opencode/run/<change>/change.diff`.

#### Scenario: base_ref recorded on first run
- **WHEN** the orchestrator runs for a change with no `.gates.json`
- **THEN** `base_ref = git rev-parse HEAD` is written to `.gates.json`

#### Scenario: change diff includes staged and untracked
- **WHEN** `computeChangeDiff(baseRef)` runs
- **THEN** output equals `git diff <baseRef>` (includes staged) plus content of untracked files from `git ls-files --others --exclude-standard`
- **THEN** the diff artifact is written to `.opencode/run/<change>/change.diff`

### Requirement: Fingerprint gates
`computeFingerprint` MUST produce a SHA-256 hex string over the concatenation of `base_ref`, the diff bytes, the proposal/design/tasks/specs bytes, the agent definition file bytes, the resolved model id, and the bundle format version. A gate with a current `PASS` verdict MUST be skipped when its fingerprint matches, recording `skipped: true` and not invoking the agent. Any byte change in the inputs MUST invalidate the gate.

#### Scenario: fingerprint computed from all gate inputs
- **WHEN** `computeFingerprint` is called
- **THEN** input = concatenation of: `base_ref` + diff bytes + proposal/design/tasks/specs bytes + agent definition file bytes + resolved model id + bundle format version
- **THEN** output is a SHA-256 hex string

#### Scenario: gate skipped when fingerprint matches
- **WHEN** the orchestrator is re-invoked and a gate has `PASS` with an identical fingerprint
- **THEN** the gate is skipped, telemetry records `skipped: true`, and the agent is not invoked

#### Scenario: gate invalidated when any input changes
- **WHEN** any byte of the diff/spec/prompt/model/agent-definition changes
- **THEN** the fingerprint differs and the gate runs normally

#### Scenario: archive requires all gates current PASS
- **WHEN** `validateAllGatesPass` runs before archive
- **THEN** all required gates for the profile have `verdict=PASS` and a `fingerprint` matching current inputs
- **THEN** a missing or stale gate blocks archive

### Requirement: Ledger gate blocks archive on open findings
`checkLedgerGate` MUST parse the `## Review Findings` ledger from `tasks.md`, requiring a `status` column (`open` or `resolved`), and MUST return `{blocked: true, findings: [...]}` when any row has `severity` `CRITICAL` or `WARNING` with `status=open`. A row with `severity` `WARNING` and `status=resolved` MUST carry non-empty `evidence` to avoid blocking.

#### Scenario: open CRITICAL/WARNING blocks archive
- **WHEN** `checkLedgerGate` runs and finds a row with `severity=CRITICAL` or `WARNING` and `status=open`
- **THEN** it returns `{blocked: true, findings: [...]}`
- **THEN** the orchestrator blocks before `validate`/`archive`

#### Scenario: resolved with evidence does not block
- **WHEN** a row has `severity=WARNING` and `status=resolved` with non-empty `evidence`
- **THEN** it does not block archive

#### Scenario: resolved without evidence blocks
- **WHEN** a row has `severity=CRITICAL` or `WARNING` and `status=resolved` with empty `evidence`
- **THEN** it is treated as blocking

#### Scenario: ledger contract requires status column
- **WHEN** `isLedgerHeader` validates a header row
- **THEN** it requires a column named `status` (case-insensitive) in addition to the existing `id` and `severity` requirements

### Requirement: Transport retry and verdict handling
A transport failure (agent exits non-zero and produces no verdict artifact) MUST be retried exactly once with the same input, with the attempt count persisted in `.run.json`. A verdict artifact with `verdict=FAIL` MUST NOT be blind-retried; its findings MUST be written to `.opencode/run/<change>/<agent>-findings.json` and routed to the developer as the next cycle's input. Retry/fix counters MUST be read from `.run.json`, not held in memory.

#### Scenario: transport failure retries once
- **WHEN** an agent exits ≠0 and produces no verdict artifact
- **THEN** exactly 1 retry occurs with the same input
- **THEN** the attempt count is persisted in `.run.json`

#### Scenario: verdict FAIL never blind-retries
- **WHEN** an agent exits 0 but its verdict artifact shows `verdict=FAIL`
- **THEN** no retry occurs; findings are written to `<agent>-findings.json`
- **THEN** the developer is invoked next with the findings as input

#### Scenario: max 3 fix cycles then escalate
- **WHEN** the fix cycle count reaches 3 for a change
- **THEN** the orchestrator escalates to the architect (throws with evidence)

#### Scenario: counters persisted not in-memory
- **WHEN** the orchestrator restarts
- **THEN** retry/fix counters are read from `.run.json`, not from an in-memory Map

### Requirement: Parallel evaluation DAG without sibling kills
`[code-reviewer, security-reviewer, verifier]` MUST run concurrently and be joined with `Promise.allSettled`, which waits for all three. A failure in one member MUST NOT call `child.kill()` on a sibling. Findings from every group member MUST be consolidated into a single fix pass. A per-agent timeout (default 15 minutes, `ORCHESTRATOR_TIMEOUT_MS`) MUST kill only the hung child and mark only that gate as a transport failure.

#### Scenario: reviewers and verifier run in parallel
- **WHEN** `runParallelGroupNoKill` executes for `[code-reviewer, security-reviewer, verifier]`
- **THEN** all three are spawned concurrently
- **THEN** `Promise.allSettled` waits for all

#### Scenario: sibling failure does not kill others
- **WHEN** one agent in the parallel group fails
- **THEN** the other agents continue to completion
- **THEN** no `child.kill()` is called on siblings

#### Scenario: findings consolidated from all group members
- **WHEN** the parallel group completes with mixed verdicts
- **THEN** all findings (including from PASS agents) are consolidated into a single fix pass for the developer

#### Scenario: timeout kills only hung process
- **WHEN** an agent exceeds `ORCHESTRATOR_TIMEOUT_MS` (default 15 min)
- **THEN** only that child process is killed
- **THEN** the gate is marked transport FAIL
- **THEN** other agents are unaffected

### Requirement: Read-only gates never revert code
A reviewer or verifier gate failure MUST NOT call `rollbackToCheckpoint`, so the developer's implementation is preserved. An implementation gate (developer or test-engineer) failure MUST revert only that agent's own edits, preserving previous agents' work.

#### Scenario: read-only gates never revert code
- **WHEN** a reviewer or verifier gate fails
- **THEN** no `rollbackToCheckpoint` is called
- **THEN** the developer's implementation is preserved

#### Scenario: implementation gates revert only own edits
- **WHEN** a developer or test-engineer gate fails
- **THEN** rollback reverts only changes from that agent's checkpoint
- **THEN** previous agents' work is preserved
