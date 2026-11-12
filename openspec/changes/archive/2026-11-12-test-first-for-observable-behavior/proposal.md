# Proposal

## Intent

Make test-first the default for observable, deterministically testable implementation behavior, and give maintainers one accurate guide to the workflow and boundaries of every agent shipped by this repository.

## Why

The developer prompt asks for high-value tests but does not say to write them before implementation, so misunderstandings can survive until later review. The README summarizes agent roles, but it does not give a complete step-by-step account of the workflow or clearly distinguish each agent's responsibilities, exclusions, and invocation conditions.

## What Changes

- Require `@developer` to write or update a high-value, deterministic black-box test before implementing observable behavior when such a test is practical; observe the failing case, implement, and make it pass.
- Keep the test-first rule conditional: do not force tests for documentation/prompt-only changes or behavior without a meaningful deterministic test; the developer and test-engineer explain the exception and applicable checks still run.
- Keep `@test-engineer` after implementation and the existing review/verifier/archive gates. It reuses developer-authored coverage and adds only missing scenarios or valuable edge cases.
- Add an English guide describing each workflow phase and the responsibilities, limits, outputs, and invocation conditions of all nine project-maintained agents; this language is an explicit user-requested exception to the normal Spanish docs convention.
- Link the detailed guide from the English README and the independent-verification guide; document the language exception in `docs/README.md`; add the required Spanish change note and changelog entry.
- Translate the existing `multiagent-workflow` and `project-documentation` main specs fully into English, including purposes and requirement/scenario headings; preserve every requirement and scenario's meaning and remove the Spanish text from those two files without keeping duplicate copies.
- Make no runtime/orchestrator changes and do not add agents or skip existing quality gates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multiagent-workflow`: define conditional test-first behavior for the developer while preserving the current agent order and gates.
- `project-documentation`: allow a user-requested language override for an individual document while keeping Spanish as the default for `docs/`.

## Impact

- OpenSpec deltas: `multiagent-workflow` and `project-documentation`.
- Agent instructions: `opencode/agents/developer.md` and `opencode/agents/test-engineer.md`.
- Specifications: translate `openspec/specs/multiagent-workflow/spec.md` and `openspec/specs/project-documentation/spec.md` fully into English, including purposes and headings; preserve every requirement and scenario with equivalent meaning and align the project-documentation delta with the translated requirement/scenario names. Do not retain Spanish copies.
- Human documentation: new English `docs/guides/agent-workflow.md`, updates to `docs/guides/independent-verification.md` and `docs/README.md`, `README.md`, a Spanish `docs/changes/2026-11-12-test-first-for-observable-behavior.md`, and `docs/CHANGELOG.md`.
- No runtime code, CLI, dependency, or automated test-harness changes are expected; existing project tests and strict OpenSpec validation remain required.
- After all quality, verification, validation, and archive gates pass, the user requests one commit and push containing all current workspace changes, including previously completed archived changes.
