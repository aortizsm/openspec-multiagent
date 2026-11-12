# Design

## Result Contract

- **status**: Ready for implementation approval.
- **executive_summary**: Run `@test-engineer` after implementation and before parallel code/security review so reviewers see completed tests. Remove `--from` entirely so every orchestrator run executes the full quality and verification pipeline before archive.
- **artifacts**: `proposal.md`; deltas for `parallel-reviews` and `multiagent-workflow`; this `design.md`; `tasks.md`; changes to the orchestrator, isolated integration tests, agent guidance, README, verifier guide, changelog, and a Spanish change note.
- **risks**: Removing `--from` is a breaking CLI change and a failed run restarts from `@developer`; callers must use the full command without the flag. Integration tests must exercise rollback only in a temporary Git repository. Existing unrelated workspace edits must remain untouched.
- **next_recommended**: Add isolated tests for phase transitions and failure blocking, run tests and strict OpenSpec validation, then review and verify the change.

## Context

See `proposal.md` for motivation. The current orchestrator runs `@test-engineer`, `@code-reviewer`, and `@security-reviewer` concurrently, so reviewers can start before test generation finishes. Its `--from <agent>` option also permits later-stage starts; no durable success record proves earlier gates passed.

The workspace contains a pre-existing `tests/lib.test.mjs` change and untracked archived changes. Preserve these baseline files and exclude them from this change.

## Goals / Non-Goals

**Goals:**
- Ensure code and security reviewers see the completed test-engineer output.
- Keep code and security reviewers parallel to avoid serial review latency.
- Ensure every orchestrator invocation begins with `@developer` and cannot skip required quality gates before archive.
- Make dry-run output and failure guidance match the complete pipeline.

**Non-Goals:**
- Add persisted phase-success state or a partial-resume mechanism.
- Change user approval, security review, or independent verifier responsibilities.
- Change the OpenSpec minimum version or install/configuration behavior.

## Decisions

- Sequence `@developer` -> `@test-engineer` -> [`@code-reviewer` + `@security-reviewer`] -> `@verifier` -> validation/archive. If test generation fails, reviewers and verifier do not run.
- Remove `--from` instead of storing phase-success evidence. Any rerun starts the full pipeline at `@developer`.
- Reject both `--from <agent>` and `--from=<agent>` before any agent or archive step, with an error explaining how to restart.
- Keep `--dry-run` and show the sequential test phase followed by the parallel review phase.
- Update `parallel-reviews` and `multiagent-workflow` specs, tests, and docs. Preserve historical change entries.
- Exercise the actual phase transitions and test-engineer failure behavior in an isolated harness; do not rely only on dry-run output.
- Centralize the repeated full-pipeline restart hint so failure messages remain consistent.

Alternative considered: retain `--from` with persistent gate-state. Rejected because it requires durable state, invalidation when files change, and synchronization across processes. Restricting it to `developer` is a confusing no-op because it restarts the same full pipeline as omitting the flag.

## Risks / Trade-offs

- **[Trade-off] A failed review requires a full restart** → Prefer complete gate execution over unsafe partial resumes.
- **[Risk] Existing callers use `--from`** → Mark the removal as breaking and document that users restart with `node scripts/orchestrate.mjs <change-name>`.
- **[Risk] Reviewer order or dry-run output drifts from actual orchestration** → Add regression tests for the planned order and rejection of both `--from` forms.
- **[Risk] Failure-path integration tests trigger rollback** → Run them only in a temporary Git repository and assert the active workspace is untouched.

## Migration Plan

Remove `--from <agent>` from the CLI. When correcting a failed run, apply the corrections and rerun `node scripts/orchestrate.mjs <change-name>` without a resume flag; the full pipeline restarts from `@developer`.
