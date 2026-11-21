# Proposal

## Intent

Harden the orchestrator gates to make the pipeline reliable, auditable, and incremental: add per-invocation telemetry, correct diff semantics with base-ref, fingerprint-based gate skipping (replacing the removed `--from`), a deterministic ledger gate that blocks archive on open CRITICAL/WARNING findings, a transport-vs-verdict retry policy, and a parallel DAG that doesn't kill siblings.

## Why

Today the orchestrator has several structural weaknesses that cause wasted runs and unreliable gates:

1. **No telemetry**: No record of what ran, how long it took, token cost, or why a gate was skipped/retried. Impossible to measure the 50-70% token reduction goal.
2. **Broken diff**: `git diff` only shows unstaged changes, missing staged and untracked files. Re-runs can't know what actually changed.
3. **No gate fingerprinting**: The deliberate removal of `--from` means every re-run restarts the entire pipeline from developer, even when only the verifier failed. No incremental correctness.
4. **Ledger gate not wired**: `parseReviewLedgerContent()` exists but `main()` never calls it. Archive proceeds with open CRITICAL/WARNING findings.
5. **Blind retries**: Both transport failures (exit≠0, no verdict artifact) and verdict FAIL retry identically 3× with same input. A FAIL should route to developer for a fix cycle, not retry blindly.
6. **Parallel group kills siblings**: `runParallelGroup()` calls `child.kill()` on the other reviewer when one fails, then rolls back to checkpoint — destroying the developer's implementation and the other reviewer's work.
7. **Verifier runs sequentially after reviews** despite not depending on them, adding wall-time.
8. **In-memory retry counters** reset between invocations, losing history.

## What Changes

### 1.1 Telemetry (P0)
- Per invocation, append to `openspec/changes/<change>/.run.json`:
  - `profile`, `timestamp`, `invocation_id`
  - Per gate: `attempts`, `wall_ms`, `exit_code`, `verdict`, `fingerprint`, `skipped`, `bundle_bytes`, `tokens` (or `null`)
- Never overwrite history; append-only.

### 1.2 Correct Diff + Base-Ref
- On first run of a change, record `base_ref = git rev-parse HEAD` in `.gates.json`.
- Change diff = `git diff <base_ref>` (includes staged) + untracked files (`git ls-files --others --exclude-standard`).
- Persist as artifact at `.opencode/run/<change>/change.diff` (gitignored).

### 1.3 Gates with Fingerprint (replaces --from)
- `openspec/changes/<change>/.gates.json`: per gate `{verdict, fingerprint, timestamp, evidence_path}`.
- `fingerprint = sha256(base_ref + diff_bytes + proposal/design/tasks/specs_bytes + agent_definition_bytes + model_id + bundle_format_version)`.
- Skip rule: on re-invocation, skip ONLY gates whose PASS fingerprint matches current inputs exactly. Any input change invalidates automatically.
- Archive rule: ALL required gates for the profile must have current PASS. No manual skip, no `--from` reintroduction.

### 1.4 Deterministic Ledger Gate
- Wire `parseReviewLedgerContent()` in `main()` before `validate`/`archive`.
- Block if any row has `severity` = `CRITICAL` or `WARNING` AND `status` = `open`.
- Add `status` column (`open` | `resolved`) to ledger contract; `resolved` requires `evidence`.

### 1.5 Retry Policy
- Transport failure (exit≠0, no verdict artifact) → 1 retry with same input.
- Verdict FAIL → NEVER blind retry. Write findings to file, route to developer as input for next fix cycle.
- Max 3 fix cycles per change → escalate.
- Counters persisted in `.run.json` (remove in-memory `failureCounts` Map).

### 1.6 Parallel DAG + No Sibling Kill
- New order: `developer → test-engineer → [code-reviewer ∥ security-reviewer ∥ verifier] → join → ledger gate → validate → archive`.
- If a parallel group member fails, let others finish; consolidate ALL findings into single fix pass. **Prohibited `child.kill()` of siblings**.
- Per-agent timeout: default 15 min, configurable; on timeout: kill ONLY that process, mark gate transport FAIL.
- Rollback: read-only gates (reviewers/verifier) never revert code. Implementation gates revert only their own edits. Adjust `rollback.mjs` accordingly.

## Acceptance Criteria (deterministic tests in tests/)

- **Fingerprint**: changing 1 byte of diff/spec/prompt/model invalidates exactly that gate.
- **Skip**: re-run with zero changes invokes no agents (verifiable with spawn mock).
- **Diff**: staged and untracked files appear in `change.diff`.
- **Ledger**: a `WARNING` row with `status=open` blocks archive; `resolved` with evidence does not.
- **Parallel group**: failure of one reviewer does not kill the other; both verdicts consolidate.
- **Timeout**: hung process is killed and marked FAIL without toppling the rest.

---

## Capabilities

### Modified Capabilities
- `multiagent-workflow`: adds telemetry, fingerprint gates, ledger gate, retry policy, parallel DAG, rollback semantics.