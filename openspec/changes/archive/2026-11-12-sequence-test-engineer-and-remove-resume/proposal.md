# Proposal

## Intent

Reduce avoidable review rework and ensure every orchestrator run passes through the complete quality gates.

## Why

The orchestrator currently starts test generation concurrently with code and security review, so reviewers may inspect the change before the final tests exist. Its `--from` option can also start at a later phase and reach archive without proving earlier quality gates passed.

## What Changes

- Run `@test-engineer` after `@developer` and wait for its tests before starting `@code-reviewer` and `@security-reviewer` in parallel.
- Remove the `--from <agent>` resume option. Every orchestrator run starts at `@developer` and executes the complete quality and verification sequence before validation and archive.
- Update specs, tests, agent guidance, README, verifier guide, changelog, and a Spanish change note to reflect the new order and CLI behavior.
- **BREAKING:** callers using `--from <agent>` must rerun the full pipeline without that option.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `parallel-reviews`: test generation completes before code and security reviewers run concurrently; verification follows all successful quality checks.
- `multiagent-workflow`: orchestrator runs cannot skip required quality phases through a resume flag.

## Impact

- Runtime: `scripts/orchestrate.mjs` CLI parsing, agent phase order, dry-run plan, and retry guidance.
- Tests: `tests/run.mjs` for phase planning/order and rejection of the removed `--from` flag.
- Specs and docs: `parallel-reviews`, `multiagent-workflow`, `README.md`, `AGENTS.md`, `opencode/agents/architect.md`, verifier guide, `docs/CHANGELOG.md`, and a new `docs/changes/` entry.
