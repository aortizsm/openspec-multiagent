# Tasks

## 1. Make review corrections traceable

- [x] 1.1 Update `AGENTS.md` and all relevant copies of `opencode/agents/architect.md` to consolidate quality-agent and verifier findings into one correction bundle with IDs, sources, severity, acceptance criteria, locations, requested changes, status, and closure evidence; state that a verifier `FAIL` after round three is reported without a fourth round or archive.
- [x] 1.2 Validate the revised OpenSpec delta, including the scenario for verifier failure after the third round.
- [x] 1.3 Update `docs/guides/independent-verification.md` with the consolidation format, three-round limit, and explicit round-three verifier failure behavior; add a six-section Spanish change entry and `docs/CHANGELOG.md` link, then verify docs match the spec.

## Review Findings

Correction round: 1 of 3.

| Stable ID | Source agent(s) | Severity | Linked criterion/scenario | File/location | Requested correction | Status | Closure evidence/rationale |
|-----------|----------------|----------|---------------------------|---------------|----------------------|--------|----------------------------|
| RF-001 | @code-reviewer | WARNING | Correction rounds are bounded — verifier result after round three | `specs/multiagent-workflow/spec.md:35-48` | State that a verifier `FAIL` after round three is recorded/reported without starting a fourth correction round or archiving. | resolved | Implemented and checked against the spec scenario (`spec.md:46-48`); `AGENTS.md:103`, `opencode/agents/architect.md:142, 566, 661, 663, 668`, and `docs/guides/independent-verification.md:25, 83` give the same outcome. Validation commands passed after the update. |
| RF-002 | @security-reviewer | CRITICAL | Scope: this change does not modify the CLI | `scripts/orchestrate.mjs:153-155, 408-409, 473-475` | Add a runtime gate for unresolved findings and the round cap. | not adopted | User confirmed they use `@architect`; the CLI/runtime is explicitly outside this approved change's scope, so this report is not an actionable finding against the changed artifacts. |

## 2. Verify the workflow contract

- [x] 2.1 Run `npm test`, `openspec validate consolidate-review-feedback --strict`, `openspec validate --all`, and `git diff --check`; verify all commands pass and no runtime source code changed by this correction. Existing runtime/test worktree changes were present before this correction and were preserved untouched.
