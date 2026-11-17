# Proposal

## Intent

Make `@developer` complete implementation in two deliberate stages: establish correct behavior with applicable tests first, then perform a focused clean-code refinement before handing the change to the quality pipeline.

## Why

Applying every clean-code criterion while drafting can encourage premature restructuring before tests establish that the behavior works. A separate refinement pass may improve implementation speed while keeping maintainability, correctness, and security as delivery requirements.

## What Changes

- Update developer guidance to distinguish the functional/test stage from a required clean-code refinement stage.
- Keep correctness and security obligations active throughout implementation; require all applicable tests and checks to pass again after refinement.
- Keep the existing 12 clean-code criteria as final-delivery requirements, while deferring their systematic review until behavior is green.
- Clarify that speculative performance optimization and unneeded abstractions are out of scope.
- Preserve the existing external agent order and add focused prompt-contract coverage and human documentation for the revised developer workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `clean-code-criteria`: require a dedicated refinement before developer handoff instead of requiring systematic clean-code compliance from the first implementation draft.
- `multiagent-workflow`: define the developer's two internal stages and require post-refinement validation before the existing test-engineer and review phases.

## Impact

- Agent guidance: `opencode/agents/developer.md`
- OpenSpec requirements: `openspec/specs/clean-code-criteria/` and `openspec/specs/multiagent-workflow/`
- Prompt-contract tests and human documentation: `tests/`, `docs/guides/agent-workflow.md`, `docs/changes/`, and `docs/CHANGELOG.md`
- No orchestrator runtime, external agent-order, dependency, or performance behavior changes.
