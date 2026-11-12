# Tasks

## 1. Update orchestration, tests, and guidance

- [x] 1.1 Run `@test-engineer` sequentially after `@developer`, then run `@code-reviewer` and `@security-reviewer` in parallel; update dry-run output and add coverage that asserts this phase order.
- [x] 1.2 Remove `--from` parsing/help/retry hints; reject both `--from <agent>` and `--from=<agent>` before any agent or archive runs, with regression tests for both forms.
- [x] 1.3 Add isolated integration tests proving test-engineer completes before reviewers, reviewers run concurrently, and a test-engineer failure blocks reviewers, verifier, and archive; use a temporary Git repository so rollback cannot touch the active workspace.
- [x] 1.4 Update `AGENTS.md`, `README.md`, architect guidance, verifier guide, changelog, and a six-section Spanish change entry to document the new order and full-pipeline restart behavior; preserve historical entries.
- [x] 1.5 Extract the repeated full-pipeline restart message into one helper and verify all failure paths use the same instruction.

## 2. Specify and verify the workflow contract

- [x] 2.1 Update `parallel-reviews` and `multiagent-workflow` deltas to specify sequential test generation, parallel code/security reviews, verifier gating, and rejection of resume flags; verify strict OpenSpec validation.
- [x] 2.2 Run `npm test`, `openspec validate sequence-test-engineer-and-remove-resume --strict`, `openspec validate --all`, and `git diff --check`; verify all pass and existing unrelated workspace changes remain untouched.
