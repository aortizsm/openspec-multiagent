# Proposal

## Why

When a pipeline phase fails (developer, test-engineer, reviewer, verifier), the working tree is left in a partially-modified state. Re-running the phase or continuing to the next one compounds errors. There is no automatic way to rollback to a clean state before each phase.

## What Changes

- Add `scripts/rollback.mjs` that creates a git commit (or stash) before each pipeline phase, tagged with the phase name, so a failed phase can be rolled back to the pre-phase state.
- Add `scripts/orchestrate.mjs` integration: before each agent phase, call rollback to save a checkpoint; after a failure, rollback to the last checkpoint.
- Add npm scripts: `rollback` and `rollback:save`.

## Capabilities

### New Capabilities
- `auto-rollback`: Automatic git checkpoint before each pipeline phase with rollback on failure.

### Modified Capabilities
- None.

## Impact

- `scripts/rollback.mjs` (new file).
- `scripts/orchestrate.mjs` (modified to call rollback before each phase).
- `package.json` (new npm scripts).
- No breaking changes.