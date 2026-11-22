# Tasks: harden-orchestrator-gates

## Phase 1: Telemetry + Base-Ref + Diff

- [x] 1.1 Add `runTelemetry(changeName, profile)` to `scripts/lib.mjs`: creates/opens `.run.json`, appends invocation record with timestamp, profile, invocation_id.
- [x] 1.2 Add `captureTokenStats(projectRoot)` to `scripts/lib.mjs`: runs `opencode stats --json --cost --project . --days 0`, returns `{input, output, reasoning, cache_read, cache_write, cost}` or `null` on failure.
- [x] 1.3 Add `getBaseRef(changeName)` / `setBaseRef(changeName, ref)` to `scripts/lib.mjs`: reads/writes `base_ref` in `.gates.json`.
- [x] 1.4 Add `computeChangeDiff(baseRef)` to `scripts/lib.mjs`: returns `git diff <baseRef>` + untracked files content. Write to `.opencode/run/<change>/change.diff`.
- [x] 1.5 Modify `orchestrate.mjs` main(): call `runTelemetry` at start, capture `base_ref` on first run, compute and persist diff artifact.

## Phase 2: Fingerprint Gates

- [x] 2.1 Add `computeFingerprint(inputs)` to `scripts/lib.mjs`: SHA-256 of concatenated inputs (base_ref, diff bytes, proposal/design/tasks/specs bytes, agent definition file bytes, resolved model id, bundle format version).
- [x] 2.2 Add `loadGates(changeName)` / `saveGate(changeName, gateName, verdict, fingerprint, evidencePath)` to `scripts/lib.mjs`: reads/writes `.gates.json`.
- [x] 2.3 Modify `runAgent` / `runAgentAsyncWithRetry` to check gate fingerprint before invocation: if PASS with identical fingerprint → skip (record `skipped: true` in telemetry).
- [x] 2.4 On successful agent completion, write gate verdict with fingerprint to `.gates.json`.
- [x] 2.5 Add `validateAllGatesPass(changeName, requiredGates)` called before `validate`/`archive`: all required gates must have current PASS.

## Phase 3: Ledger Gate

- [x] 3.1 Add `checkLedgerGate(changeName)` to `scripts/orchestrate.mjs`: calls `parseReviewLedgerContent(tasksContent)`, returns `{blocked: boolean, findings: []}`.
- [x] 3.2 Extend ledger contract: require `status` column (`open` | `resolved`), `resolved` requires non-empty `evidence`.
- [x] 3.3 Wire `checkLedgerGate` in `main()` after parallel group join, before `runOpenspecValidate`. Block archive if any `CRITICAL`/`WARNING` with `status=open`.
- [x] 3.4 Update `isLedgerHeader` to validate `status` column presence.

## Phase 4: Retry Policy

- [x] 4.1 Distinguish transport failure (exit≠0, no verdict artifact) from verdict FAIL (exit=0, verdict=FAIL in artifact).
- [x] 4.2 Transport failure → 1 retry with same input (persist attempt count in `.run.json`).
- [x] 4.3 Verdict FAIL → write findings to `.opencode/run/<change>/<agent>-findings.json`, route to developer as next cycle input. Max 3 fix cycles → escalate.
- [x] 4.4 Remove in-memory `failureCounts` Map; persist all counters in `.run.json`.

## Phase 5: Parallel DAG + No Sibling Kill

- [x] 5.1 Change agent order to: `developer`, `test-engineer`, then parallel group `[code-reviewer, security-reviewer, verifier]`.
- [x] 5.2 New `runParallelGroupNoKill(agents, changeName)`: spawn all, `Promise.allSettled`, collect all verdicts, never `child.kill()` siblings.
- [x] 5.3 On any failure in group: consolidate all findings (including from successful siblings), route to developer for single fix pass.
- [x] 5.4 Add per-agent timeout (default 15 min, env `ORCHESTRATOR_TIMEOUT_MS`): on timeout, kill ONLY that child, mark gate transport FAIL.
- [x] 5.5 Adjust `rollback.mjs`: add `saveImplementationCheckpoint(agent)` / `rollbackImplementation(agent)` for developer/test-engineer only. Reviewers/verifier use no-op checkpoint/rollback.

## Phase 6: Tests

- [x] 6.1 `tests/orchestrator-gates.test.mjs`: fingerprint invalidation (1 byte change → gate invalidated), skip verification (mock spawn, zero invocations on re-run), diff includes staged/untracked, ledger blocks on WARNING open, parallel group doesn't kill siblings, timeout kills single process.

## Phase 7: Documentation

- [x] 7.1 Update `AGENTS.md` with new gate semantics, fingerprint skip rule, ledger gate, retry policy, parallel DAG.
- [x] 7.2 Update `docs/guides/agent-workflow.md` and `docs/guides/independent-verification.md`.
- [x] 7.3 Create `docs/changes/YYYY-MM-DD-harden-orchestrator-gates.md` entry.

## Review Findings

| ID | Source | Severity | Linked Criterion | File/Location | Requested Correction | Status | Evidence |
|----|--------|----------|------------------|---------------|----------------------|--------|----------|