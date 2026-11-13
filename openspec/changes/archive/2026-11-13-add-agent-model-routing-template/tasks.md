# Tasks

## 1. Add a validated model-routing template

- [x] 1.1 Add a test-first case in `tests/lib.test.mjs` that parses the example with the existing JSONC helper and checks the default model, all nine agent-role mappings, and absence of credential fields; verify it fails before the template exists.
- [x] 1.2 Add `opencode.models.example.jsonc` with the approved MiMo/GLM mapping and no secrets; verify the new test and full `npm test` pass.

## 2. Document copying and model behavior

- [x] 2.1 Update `README.md` and `docs/guides/agent-workflow.md` with the template path, copy targets, model map, `/connect` requirement, primary-session versus subagent overrides, per-model Go limits, and Extra Usage caveat; verify links and guidance match OpenCode V2 docs.
- [x] 2.2 Add the six-section Spanish change note and `docs/CHANGELOG.md` link; verify the note reflects the template's non-active status and contains no credentials.

## 3. Verify the template change

- [x] 3.1 Run `npm test`, `openspec validate add-agent-model-routing-template --strict`, `openspec validate --all`, and `git diff --check`; verify the example is not an active project config and no runtime behavior or agent prompts changed.

## Workflow follow-up

- After all review, verifier, validation, and archive gates pass, `@developer` commits and pushes all current workspace changes as the user requested.

## Review Findings

Correction round: 3 of 3.

| ID | Source | Severity | Acceptance criterion | Location | Requested correction | Status | Closure evidence / justification |
|---|---|---|---|---|---|---|---|
| RF-001 | `@code-reviewer` | WARNING | Recommended mapping covers every bundled agent | `tests/lib.test.mjs:113-130` | Split the test callback into helpers so each function has at most 15 lines, following the clean-code rule. | resolved | The callback delegates assertions to `assertModelRoutingConfig` and `assertAgentModelAssignments`; each function is at most 15 lines. `npm test` passed (60 integration and 39 library tests). |
| RF-002 | `@code-reviewer` | SUGGESTION | Recommended mapping covers every bundled agent | `tests/lib.test.mjs:116-125` | Extract repeated model ID strings into descriptive constants to avoid duplicated literals. Adopted because the repository's DRY criterion requires constants for literals repeated three or more times. | resolved | Replaced repeated model-ID literals with `MIMO_MODEL_ID` and `GLM_MODEL_ID`; mapping assertions remain exact. `npm test` passed (60 integration and 39 library tests). |
| RF-003 | `@verifier` (initial: 4 PASS, 1 UNVERIFIABLE; final: 5 PASS, 0 FAIL, 0 UNVERIFIABLE) | WARNING | Documentation accuracy / archive checklist | `docs/changes/2026-11-13-add-agent-model-routing-template.md:25`; this ledger row | Update the change note and this ledger from the initial report to the final report: 5 PASS, 0 FAIL, 0 UNVERIFIABLE. For the inactive-template scenario, cite official config-discovery names and the absence of a recognized project config path; explicitly state that the evidence is static/documentary and no live OpenCode discovery was run. | resolved | Updated both the change note and this ledger to match the final 5 PASS, 0 FAIL, 0 UNVERIFIABLE report. The inactive-template PASS is qualified as static/documentary evidence based on official recognized config names and the repository's lack of a recognized project config path; no live OpenCode config-discovery run was performed. |
| RF-004 | `@code-reviewer` (both review passes) | WARNING | Current-revision validation evidence / archive checklist | `openspec/changes/add-agent-model-routing-template/tasks.md:15` | Run `npm test`, strict and all OpenSpec validation, and `git diff --check` on the current revision and provide the output. | resolved | Architect ran `npm test` (60 integration + 39 library tests passed), `openspec validate add-agent-model-routing-template --strict` (valid), `openspec validate --all` (23 passed, 0 failed), and `git diff --check` (exit 0) after the final note and RF-004 ledger update. |
