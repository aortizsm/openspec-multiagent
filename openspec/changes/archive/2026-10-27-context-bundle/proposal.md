# Proposal

## Why

Every agent handoff requires the architect to manually gather proposal.md, design.md, tasks.md, spec.md, and git diff into one context block. This is error-prone: missing files, stale content, or wrong change name causes agents to work from incorrect assumptions.

## What Changes

- Add `scripts/context-bundle.mjs` that reads all artifacts for a change and emits a single Markdown bundle ready to paste into the next agent's prompt.
- No changes to existing agents or OpenSpec workflow.
- No new dependencies (Node built-ins only).

## Capabilities

### New Capabilities
- `context-bundle`: Generates a complete, single-file context snapshot of an OpenSpec change for agent handoff.

### Modified Capabilities
- None.

## Impact

- `scripts/context-bundle.mjs` (new file).
- No other files modified.
- No breaking changes.