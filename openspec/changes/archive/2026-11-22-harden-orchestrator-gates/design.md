# Design: harden-orchestrator-gates

## status
proposed

## executive_summary
Redesign the orchestrator's gate mechanism to be incremental, auditable, and reliable. Replace the removed `--from` with fingerprint-based gate skipping, wire the existing ledger parser as a blocking gate, fix the diff to include staged/untracked files, add per-invocation telemetry with token tracking, separate transport retries from verdict-driven fix cycles, and run reviewers + verifier in a true parallel DAG without sibling kills.

## artifacts
- `scripts/orchestrate.mjs` — main orchestration logic, gate management, telemetry, fingerprinting
- `scripts/rollback.mjs` — adjust rollback semantics for read-only vs implementation gates
- `scripts/lib.mjs` — add helpers: sha256, git diff with base-ref, token stats capture
- `tests/orchestrator-gates.test.mjs` — deterministic tests for fingerprint, skip, diff, ledger, parallel group, timeout

## risks
- **Fingerprint collision**: Extremely low (SHA-256). Mitigation: include bundle format version.
- **Rollback semantics change**: Read-only gates must not revert code. Must audit `rollback.mjs` call sites.
- **Token stats availability**: `opencode stats` may not have per-session granularity. Fallback to `null` with warning, never block.
- **Parallel group join logic**: Must handle partial failures correctly. Consolidate findings before routing to developer.

## next_recommended
Implement telemetry and fingerprint gates first (1.1, 1.2, 1.3), then ledger gate (1.4), then retry policy (1.5), then parallel DAG (1.6). Each step has independent tests.