# Proposal

## Why

The `orchestrate.mjs` script has two clean-code/security issues:
1. `main()` is 45 lines, exceeding the 30-line limit (clean-code criterion #2).
2. `runCommand` uses `shell: true` (security criterion #6), which is an unnecessary injection risk even though current callers pass hardcoded values.

## What Changes

- Split `main()` into smaller helper functions (each ≤30 lines).
- Remove `shell: true` from `runCommand` since all commands are passed as argument arrays.
- Add input validation for `changeName` before passing it to any shell command.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `orchestrate-refactor`: The setup wizard's orchestrator script must comply with clean-code line limits and avoid shell injection risks.

## Impact

- `scripts/orchestrate.mjs` (modified): refactor `main()` and `runCommand`.
- No new files, no new dependencies.
- No breaking changes to CLI interface.