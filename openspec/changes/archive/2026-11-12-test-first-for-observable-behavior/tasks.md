# Tasks

## 1. Apply test-first without changing the quality pipeline

- [x] 1.1 Update `opencode/agents/developer.md` with conditional RED/GREEN test-first guidance for high-value deterministic black-box tests; preserve the existing high-ROI policy and document the no-test exception in completion reporting.
- [x] 1.2 Update `opencode/agents/test-engineer.md` to inspect and reuse developer-authored tests, add only uncovered scenario/edge-case coverage, and report scenarios with no meaningful deterministic test instead of requiring one; verify prompt guidance agrees with the spec and existing pipeline.
- [x] 1.3 Ensure the `project-documentation` delta states the per-document language exception and keeps Spanish as the default; verify the rule is scoped to the individually requested guide.
- [x] 1.4 Add an OpenSpec scenario defining how `@test-engineer` handles scenarios without a meaningful deterministic test; verify strict validation passes.
- [x] 1.5 Translate both affected main OpenSpec specs completely into English, including purposes and headings; preserve every requirement and scenario with equivalent meaning and no Spanish duplicate.
- [x] 1.6 Align the `project-documentation` delta's requirement and scenario headings with the translated main spec; verify the delta preserves all scenarios and strict validation passes.

## 2. Document the full agent workflow

- [x] 2.1 Update the English `docs/guides/agent-workflow.md` to state that scenarios without a meaningful deterministic test are documented with rationale rather than forced into test coverage; cross-check with both test-engineer prompt and spec.
- [x] 2.2 Update the Spanish change entry with verifier evidence and remove the stale statement that independent verification has not run; verify its six sections, links, and claims remain accurate.

## 3. Verify the change

- [x] 3.1 Run `npm test`, `openspec validate test-first-for-observable-behavior --strict`, `openspec validate --specs`, `openspec validate --all`, and `git diff --check`; verify all checks pass and no runtime code or automated test harness changes were introduced by this change.

## Review Findings

Correction round: 3 of 3.

| Stable ID | Source agent(s) | Severity | Linked criterion/scenario | File/location | Requested correction | Status | Closure evidence/rationale |
|-----------|----------------|----------|---------------------------|---------------|----------------------|--------|----------------------------|
| RF-001 | @code-reviewer | WARNING | Test engineer complements developer-authored tests — no meaningful test exception | `opencode/agents/test-engineer.md:56,241`; `docs/guides/agent-workflow.md:10,25` | Reconcile the current statement that every spec scenario needs a test with the new no-test exception; require a reasoned untestable status instead of forcing a low-value test. | resolved | The prompt now assesses each scenario's existing coverage and testability, and requires one per-scenario outcome: adequate existing coverage, a useful added test, or not meaningfully testable with a rationale. The report template demonstrates each outcome; the guide matches this exception. `npm test` passed (60 + 38 tests), strict change validation, all-spec validation, and `git diff --check` passed. This correction changed no runtime code or test harness. |
| RF-002 | @verifier | UNVERIFIABLE | `project-documentation` — OpenSpec spec in English | `openspec/specs/multiagent-workflow/spec.md`; `openspec/specs/project-documentation/spec.md` | Translate both affected main specs fully into English while preserving all requirements/scenarios, then re-verify the language scenario after sync assessment. | resolved | Verifier re-read both translated main specs and returned PASS for the language scenario; strict spec validation passes. |
| RF-003 | @verifier | WARNING | `project-documentation` — Entry evidence accuracy | `docs/changes/2026-11-12-test-first-for-observable-behavior.md:33` | Remove the stale claim that verifier has not run; update the Evidence section with the completed verifier report and keep its claims accurate. | resolved | `docs/changes/2026-11-12-test-first-for-observable-behavior.md:33` now records the independent verifier report for the pre-correction candidate: 8 PASS, 0 FAIL, 0 UNVERIFIABLE; the stale unavailable-report claim was removed. |
| RF-004 | @code-reviewer | CRITICAL | Pre-archive diff-scope gate | `scripts/orchestrate.mjs`, `tests/run.mjs`, `tests/lib.test.mjs`, `openspec/specs/parallel-reviews.spec.md` | Reconcile the known prior worktree diff with the approved scopes before committing/pushing. | resolved | These paths predated this change and belong to separately archived changes with completed task records. User explicitly requested a commit and push of all current workspace changes; code-reviewer reassessed the baseline evidence and approved RF-004 as not actionable against this change. |

## Workflow follow-up

- After verifier, archive, and final validation gates pass, `@developer` creates one local commit containing all current workspace changes (including prior archived changes) and pushes it to the configured remote, as explicitly requested by the user; verify the pushed commit and resulting worktree status.
