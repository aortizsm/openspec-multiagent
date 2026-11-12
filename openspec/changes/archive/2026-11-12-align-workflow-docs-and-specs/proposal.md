# Proposal

## Intent

Align the repository's workflow specifications and human/agent documentation with the implemented standard architect flow, and retire the unwanted fast-architect path.

## Why

The README, verifier guide, and architect prompt describe different review order and approval behavior from the current orchestrator. The specs omit the `## Intent` proposal gate and retain a retired per-change `execution-mode` model. The repository also contains a fast-architect route the user no longer wants.

## What Changes

- Update workflow specifications to document the proposal gate, one-time approval, and full three-agent parallel phase; retire the obsolete per-change `execution-mode` capability and fast-architect route.
- Align the README, independent-verification guide, and architect instructions with the single standard workflow.
- Correct the README's architect permission table to distinguish shell tool permission from prompt-level restrictions.
- Document the repository-specific `## Intent` requirement when authoring proposals, even when the generic OpenSpec template omits it.
- Remove `opencode/agents/fast-architect.md` from future installs and document manual removal of existing copies; do not automatically delete user files.
- Add a Spanish change note and changelog entry describing the documentation/specification alignment.
- Keep the current orchestrator behavior unchanged in this change; the separate approved follow-up will sequence `@test-engineer` before the parallel reviewers and harden `--from` so skipped required gates cannot lead to archive.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multiagent-workflow`: record the proposal-section gate and the standard one-time-approval flow.
- `parallel-reviews`: record the current three-agent parallel phase: `@test-engineer`, `@code-reviewer`, and `@security-reviewer`.
- `change-execution-mode`: retire the obsolete per-change `execution-mode` and assisted/automatic requirements.

## Impact

- OpenSpec deltas: `multiagent-workflow`, `parallel-reviews`, and retirement of `change-execution-mode`.
- Documentation and agent guidance: `README.md`, `AGENTS.md`, `opencode/agents/architect.md`, removal of `opencode/agents/fast-architect.md`, `docs/guides/independent-verification.md`, `docs/CHANGELOG.md`, and a new `docs/changes/` entry.
- No orchestrator runtime or dependency changes. Existing installed fast-agent copies require manual removal.
