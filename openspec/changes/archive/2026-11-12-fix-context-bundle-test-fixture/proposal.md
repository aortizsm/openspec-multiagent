# Proposal

## Why

The context-bundle tests depend on an OpenSpec change named `orchestrate-refactor` that is no longer present as an active change. This makes `npm test` exit early instead of validating the bundle behavior.

## What Changes

- Make context-bundle tests create and clean up their own temporary change artifacts rather than depending on repository history.
- Preserve coverage for complete bundles and missing-change failure behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a test-only reliability fix and does not change runtime behavior.

## Impact

- `tests/lib.test.mjs` test fixtures and cleanup.
- No production code, public API, dependencies, or user-facing behavior changes.
