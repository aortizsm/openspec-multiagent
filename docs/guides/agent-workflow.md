# Agent workflow

This guide describes the standard OpenSpec workflow and the boundaries of the nine agent definitions maintained in `opencode/agents/`. Those prompts and the OpenSpec requirements are authoritative; this guide is an overview, not a replacement for them.

## Standard sequence

1. **`@architect` prepares the change.** It clarifies the request, creates the OpenSpec proposal, design, specs, and tasks, and presents the completed design for one explicit user approval. No delegated agent starts before that approval.
2. **Conditional UI design.** For a change with UI/UX requirements, `@architect` invokes `@ux-designer` before implementation. The designer reviews the requirements and provides design recommendations; it does not edit code.
3. **`@developer` implements.** For observable behavior with a practical, high-value deterministic black-box test, the developer writes or updates the test first, observes the expected failure, then implements until it passes. If no meaningful deterministic test is appropriate, the developer explains why in the completion report and runs applicable checks. Documentation- and prompt-only work does not get a forced test.
4. **`@test-engineer` complements coverage.** After implementation, it compares existing tests—including developer-authored tests—with the OpenSpec scenarios. It reuses adequate coverage and adds only missing high-value scenario or edge-case tests. For a scenario without a meaningful deterministic test, it records that status with a rationale rather than forcing a test. It does not execute tests.
5. **Parallel reviews.** After the test-engineer finishes, `@code-reviewer` and `@security-reviewer` review in parallel. Neither can modify files; they return approval or actionable findings.
6. **`@verifier` independently checks the change.** Only after the test-engineer and both reviewers succeed, the verifier runs the project's permitted test/build/lint/typecheck commands and reports evidence per scenario.
7. **`@architect` validates and closes.** It handles findings through the required correction cycle, checks the final gates, and is the only agent that archives the OpenSpec change. A failed gate stops archive.

The standard quality sequence is `@developer → @test-engineer → [@code-reviewer + @security-reviewer] → @verifier`. `@architect` owns the design approval before it and validation/archive after it. A correction restarts the full quality sequence; no gate is skipped. The workflow permits at most three correction rounds.

## Agent responsibilities and boundaries

### Core workflow

| Agent | Phase and trigger | Responsibilities and output | Does not |
|---|---|---|---|
| **`@architect`** | Leads every change; starts after the request and obtains the one design approval before delegating. | Defines the OpenSpec artifacts and acceptance criteria, delegates each phase with context, consolidates review findings, enforces validation gates, and reports the outcome. | Implement source changes. It alone archives, and only after the required quality, verification, and validation gates pass. |
| **`@developer`** | Implementation, after design approval and any conditional UI-design phase. | Implements the approved tasks, uses conditional RED/GREEN test-first for observable behavior where a practical high-value deterministic black-box test exists, runs applicable checks, and reports completion or the reason a test was not appropriate. | Add brittle tests of internals or exact prompt wording, or skip applicable checks. |
| **`@test-engineer`** | Sequential test phase after implementation and before both parallel reviews. | Inspects existing tests against every OpenSpec scenario, reuses adequate developer-authored tests, and writes only missing high-value scenario/edge-case coverage; reports each scenario as adequately covered, covered by a useful new test, or not meaningfully testable with a rationale. | Duplicate adequate tests, force low-value tests, execute tests, or change the workflow order. |
| **`@code-reviewer`** | First parallel review, after `@test-engineer` succeeds. | Reviews the diff against the change, correctness, maintainability, and high-ROI test coverage; returns approval or severity-tagged, actionable change requests. It may run permitted test commands as a review sanity check. | Modify files, make implementation decisions outside the approved scope, or archive the change. |
| **`@security-reviewer`** | Runs in parallel with `@code-reviewer` after `@test-engineer` succeeds. | Evaluates the diff against the repository's 12 security criteria and returns approval or severity-tagged findings with locations. | Modify code, perform implementation, or archive the change. |
| **`@verifier`** | Independent verification after the test-engineer and both parallel reviews succeed. | Runs declared, permitted project checks and returns PASS/FAIL/UNVERIFIABLE evidence for each spec scenario and requirement. | Edit or create files, install dependencies, mutate shared state, or approve/archive on behalf of the architect. |

### Conditional UI phase

| Agent | Phase and trigger | Responsibilities and output | Does not |
|---|---|---|---|
| **`@ux-designer`** | Before implementation only when the change has UI/UX requirements. | Reviews UX completeness, consistency, and accessibility; provides ASCII wireframes, design tokens, component specifications, and/or review findings as relevant. | Edit code or run unrestricted shell commands; it is not a mandatory stage for non-UI changes. |

### Optional support agents

These read-only agents can be called when useful. They are not required pipeline stages and do not replace any quality gate.

| Agent | Phase and trigger | Responsibilities and output | Does not |
|---|---|---|---|
| **`@repo-scout`** | Optional discovery when the repository or its conventions are unfamiliar. | Reports the detected stack, repository conventions, commands, structure, and relevant open questions from repository evidence. | Modify files, install dependencies, use network access, or recommend speculative changes. |
| **`@diff-summarizer`** | Optional orientation when a change set or diff is large or hard to scan. | Reads the actual diff and returns a terse per-file/group summary with risk hotspots or signs of incompleteness. | Modify files, propose fixes, or conduct a style review. |

## Findings and corrections

After a quality phase, `@architect` sends one consolidated, traceable correction bundle to `@developer` and maintains the findings ledger in the change's `tasks.md`. Each correction round repeats `@test-engineer`, then both parallel reviewers; the verifier runs only after all quality agents succeed. A verifier failure is included in a later correction bundle when a round remains. After three rounds, unresolved required findings or a verifier failure stop the workflow; the change is not archived.

## Source of truth

The installed prompts in `opencode/agents/`, the current OpenSpec change, `AGENTS.md`, and the applicable OpenSpec specs define exact permissions and gates. When this overview and those sources differ, follow the authoritative prompt and spec. The broader project documentation is Spanish by default; this guide is in English at the user's explicit request for this individual document.
