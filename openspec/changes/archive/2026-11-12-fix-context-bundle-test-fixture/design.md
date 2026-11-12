# Design

## Result Contract

- **status**: Ready for implementation approval.
- **executive_summary**: Replace tests' dependency on the deleted `orchestrate-refactor` change with self-contained temporary OpenSpec change fixtures. Keep the production `contextBundle` API and runtime behavior unchanged.
- **artifacts**: `proposal.md`, this `design.md`, and `tasks.md`; specs are intentionally skipped because this is test-only.
- **risks**: A fixture could remain in the repository if cleanup is not guaranteed; create it under `try` and remove it in `finally`.
- **next_recommended**: After user approval, update `tests/lib.test.mjs`, then run `npm test` and OpenSpec validation.

## Context

See `proposal.md` for the motivation. `contextBundle` reads changes from the repository's `openspec/changes` directory, while the existing tests refer to a historical change that is no longer present. The test file already uses temporary directories and `try/finally` cleanup for filesystem tests.

## Goals / Non-Goals

**Goals:**
- Make the bundle-content tests independent of repository change history.
- Preserve coverage for artifact sections, spec content, and missing-change behavior.
- Ensure temporary test artifacts are removed on both success and failure.

**Non-Goals:**
- Change `contextBundle` behavior or its public API.
- Restore or recreate the historical `orchestrate-refactor` change.
- Add new runtime capabilities or dependencies.

## Decisions

- Build a minimal temporary change directory under `openspec/changes` for tests that require a valid change. This exercises the existing public path resolution without adding a test-only parameter or modifying production code.
- Write the proposal, design, tasks, and a spec markdown file with known content; assert the bundle contains the expected sections and fixture content.
- Remove the temporary directory in `finally`, including when an assertion fails.
- Keep the missing-change test separate and use a unique nonexistent name so it continues to validate the error path.

Alternative considered: use a checked-in static change fixture. Rejected because the runtime only reads active changes from `openspec/changes`, and a permanent fixture would be mistaken for real OpenSpec work or become stale again.

## Risks / Trade-offs

- **[Risk] Tests write briefly into the repository's OpenSpec changes directory** → Use a unique temporary directory and unconditional cleanup; do not touch existing changes.
- **[Trade-off] The test assumes the repository's `openspec/changes` directory exists** → This is already required for the repository's OpenSpec workflow and for context-bundle path resolution.

## Migration Plan

No migration is needed. Run the test suite after the test-only change; rollback consists of reverting the test edits.
