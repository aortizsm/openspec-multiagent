# multiagent-workflow Specification

## Purpose
Define the quality-control behavior of this repository's multi-agent loop: how the `architect` obtains explicit approval, what a design must contain before delegation, how work is reviewed and verified, and which canonical tool names the workflow uses.

## Requirements

### Requirement: Explicit approval with selectable options

The `architect` MUST request user approval through the `question` tool with selectable options. The `architect` MUST accept any response that expresses approval ("yes", "approved", "go ahead", "do it", or the selected menu option). The `architect` MUST NOT require the user to type a specific word.

#### Scenario: Approval through the menu
- **WHEN** a change's design is ready for implementation
- **THEN** the `architect` presents a menu with options to approve, revise, or reject, and does not ask the user to type a word

#### Scenario: Natural-language response
- **WHEN** the user responds "go ahead" or "do it" instead of selecting a menu option
- **THEN** the `architect` treats it as approval and continues with implementation

#### Scenario: Rejection or revision
- **WHEN** the user selects revise or reject
- **THEN** the `architect` does not delegate to the `developer` and returns to revising the design

### Requirement: Result contract before delegation

The `architect` MUST NOT delegate work to the `developer` until the change design contains the fields `status`, `executive_summary`, `artifacts`, `risks`, and `next_recommended`. If any field is missing or empty, the gate fails and the `architect` MUST complete it before delegating.

#### Scenario: Complete design
- **WHEN** the design contains all five fields with content
- **THEN** the `architect` may delegate implementation

#### Scenario: Missing field
- **WHEN** the design omits `risks` or leaves it empty
- **THEN** the `architect` does not delegate and completes the field first

### Requirement: Validation gate before archiving

Before archiving a change, the `architect` MUST verify that `openspec validate` passes, the project tests pass, and the diff contains no changes outside the change's scope. If any check fails, the `architect` MUST return the work to the `developer` instead of archiving.

#### Scenario: Verification succeeds
- **WHEN** `openspec validate` passes, the tests pass, and the diff is limited to the change
- **THEN** the `architect` proceeds to archive

#### Scenario: Tests fail
- **WHEN** the project tests fail after implementation
- **THEN** the `architect` does not archive and requests a correction from the `developer`

#### Scenario: Out-of-scope diff
- **WHEN** the diff includes unrelated files
- **THEN** the `architect` does not archive and clarifies the scope before continuing

### Requirement: Review severities

The `code-reviewer` MUST label every change request as `CRITICAL`, `WARNING`, or `SUGGESTION`. `CRITICAL` covers bugs, security risks, data corruption, regressions, and broken contracts; `WARNING` covers missing edge cases, unclear behavior, and insufficient coverage in risky code; `SUGGESTION` covers style, clarity, and optional simplifications. The `code-reviewer` MUST NOT issue requests without a severity.

#### Scenario: Bug detected
- **WHEN** the review finds incorrect behavior
- **THEN** the request is labeled `CRITICAL` and states what to change, why, and where

#### Scenario: Optional improvement
- **WHEN** the review identifies a simplification that does not affect correctness
- **THEN** the request is labeled `SUGGESTION` and the `developer` may omit it

#### Scenario: Approval
- **WHEN** there are no defects to correct
- **THEN** the `code-reviewer` responds in the approval format and includes a severity breakdown with zero findings

### Requirement: Closing and pre-review checklists

`AGENTS.md` MUST document the checks required before review (the `developer` reported green checks, a concrete diff exists, and the change tasks are complete) and the checks required before archive (OpenSpec validation, project tests, diff scope, conflict-free spec synchronization, and a `## Purpose` without placeholders).

#### Scenario: Pre-review is incomplete
- **WHEN** the `developer` has not reported green checks
- **THEN** the `architect` does not send the work to the `code-reviewer`

#### Scenario: Purpose is unfinished
- **WHEN** an archived spec retains placeholder text in `## Purpose`
- **THEN** the `architect` writes a meaningful purpose before closing

### Requirement: Shell permissions support compound commands

Agents with restricted shell access MUST be allowed the auxiliary commands that appear in command chains (`echo`, `ls`, `pwd`, `cat`) in addition to the commands they actually execute, because OpenCode evaluates each segment of a compound command and rejects the entire command if any segment is not permitted.

#### Scenario: Permitted compound command
- **WHEN** the `architect` runs `git status --porcelain && echo "---" && git diff --stat`
- **THEN** the command executes because every segment is permitted

#### Scenario: Unpermitted segment
- **WHEN** a compound command includes a segment outside the permitted list
- **THEN** the command is rejected and the agent uses separate commands

### Requirement: Canonical OpenSpec tool names

`AGENTS.md` MUST document the OpenSpec CLI as the primary path (`openspec new change <name>`, `openspec list`, `openspec show`, `openspec validate`, `openspec archive`) and the available MCP tools (`openspec_create_change`, `openspec_list_specs`). It MUST explicitly state that `openspec_new_change` and `openspec_change_new` do not exist, and that the CLI must be used after an unknown-tool error.

#### Scenario: Creating a change
- **WHEN** a change needs to be created
- **THEN** the agent runs `openspec new change <name>` and does not invoke `openspec_new_change`

#### Scenario: Nonexistent tool
- **WHEN** an MCP tool call fails with "Unknown tool"
- **THEN** the agent uses the equivalent CLI command instead of retrying the invented name

### Requirement: Correct Engram tool signatures

The `architect` MUST call `mem_save` with the `title` and `content` arguments. The `architect` MUST NOT pass `type=session_summary` or other unsupported arguments. To end a session, the `architect` MUST call `mem_session_end` with `id` and `summary`.

#### Scenario: Valid save
- **WHEN** the `architect` saves a decision in Engram
- **THEN** it calls `mem_save` with `title` and `content`

#### Scenario: Invalid save
- **WHEN** a `mem_save` call includes a `type` argument
- **THEN** the `architect` corrects the call and retries with only `title` and `content`

### Requirement: Proposal gate requires repository sections
The change execution gate MUST require `proposal.md` to contain the `## Intent`, `## Why`, and `## What Changes` sections before any agent is run.

#### Scenario: Proposal is missing Intent
- **WHEN** `proposal.md` is missing `## Intent`
- **THEN** the gate rejects the change before any agent runs and identifies the missing section

#### Scenario: Proposal contains required sections
- **WHEN** `proposal.md` contains `## Intent`, `## Why`, and `## What Changes`
- **THEN** proposal-section validation passes

### Requirement: Standard architect workflow uses one approval
After the user approves the completed design, the standard `@architect` MUST continue the change workflow without requesting intermediate approvals for implementation, review, verification, or archive.

#### Scenario: Approved design continues through the workflow
- **WHEN** the user approves the completed design
- **THEN** the architect delegates implementation and continues through quality review and independent verification without another approval prompt

#### Scenario: Workflow gate fails
- **WHEN** a required review, verification, or validation gate fails
- **THEN** the architect stops and reports the evidence instead of proceeding to archive

### Requirement: Only the standard architect workflow is distributed
The project MUST NOT ship or install an `@fast-architect` agent; all changes use the standard `@architect` workflow.

#### Scenario: Fresh agent installation
- **WHEN** the repository's agent definitions are installed
- **THEN** no `fast-architect.md` agent definition is installed

### Requirement: Orchestrator runs cannot resume past required gates
The orchestrator MUST start every run at `@developer` and MUST reject resume options that start at a later agent, ensuring all required quality gates run before archive.

#### Scenario: Legacy resume option is rejected
- **WHEN** the orchestrator is invoked with `--from <agent>` or `--from=<agent>`
- **THEN** it exits with an error before running any agent or archive step

#### Scenario: Full run starts at developer
- **WHEN** the orchestrator is invoked with a change name and no resume option
- **THEN** it starts at `@developer` and runs test generation, parallel reviews, independent verification, validation, and archive in order

### Requirement: Architect consolidates actionable findings
After each quality phase, the `@architect` MUST send `@developer` one correction bundle that includes every distinct actionable finding and maps each to its source, severity, acceptance criterion, location, requested change, and closure evidence.

#### Scenario: Duplicate findings share a root cause
- **WHEN** multiple quality agents report the same underlying issue
- **THEN** the architect merges it into one bundle entry, lists every source, and preserves the highest severity

#### Scenario: Distinct findings remain separate
- **WHEN** findings concern different root causes or acceptance criteria
- **THEN** the architect keeps separate bundle entries and does not discard or silently merge them

#### Scenario: Verifier failure becomes actionable feedback
- **WHEN** `@verifier` reports a `FAIL` before the third correction round is complete
- **THEN** the architect adds the failed scenario and its evidence to the next correction bundle

### Requirement: Review findings stay traceable across rounds
The `@architect` MUST keep a review findings ledger in the change's `tasks.md`; each entry MUST have a stable ID, source agent(s), severity, linked acceptance criterion or scenario, file/location, requested correction, status (`open`, `resolved`, or `not adopted`), and closure evidence or rationale. Resolved findings MUST NOT reopen without new evidence; a declined `SUGGESTION` MUST retain its rationale and MUST NOT block archive.

#### Scenario: Finding is resolved with evidence
- **WHEN** the developer supplies the requested correction and evidence
- **THEN** the architect marks that finding resolved and carries its status into the next review round

#### Scenario: Resolved finding has no new evidence
- **WHEN** a reviewer repeats a resolved finding without new evidence
- **THEN** the architect does not reopen it

#### Scenario: Optional suggestion is declined
- **WHEN** the developer declines a `SUGGESTION`
- **THEN** the architect records the rationale without treating it as a blocking finding

### Requirement: Correction rounds are bounded
The `@architect` MUST allow at most three correction rounds per change. Each round MUST include one consolidated bundle, a developer correction, a full quality rerun (`@test-engineer`, then parallel code/security reviewers), and independent verification after all quality agents succeed. After round three, required findings still open or a verifier `FAIL` MUST be reported and MUST prevent archive; the architect MUST NOT start a fourth correction round.

#### Scenario: Corrected change passes the full gates
- **WHEN** the developer addresses the consolidated bundle and the full quality sequence and verifier pass
- **THEN** the architect closes the round and may proceed to the final archive gate

#### Scenario: Required findings remain after three rounds
- **WHEN** a `CRITICAL` or `WARNING` finding remains open after three correction rounds
- **THEN** the architect stops, reports the unresolved findings, and does not archive

#### Scenario: Verifier fails after the third correction round
- **WHEN** `@verifier` reports a `FAIL` after the third correction round
- **THEN** the architect records and reports the failed scenario and evidence, does not start a fourth correction round, and does not archive

### Requirement: Developer uses test-first for observable behavior
When observable implementation behavior has a practical, high-value deterministic black-box test, `@developer` MUST create or update the test before implementing that behavior, observe the expected failure, then implement until the test passes. When no such test is appropriate, `@developer` MUST explain why and run applicable checks.

#### Scenario: Behavior has a deterministic test
- **WHEN** a change requests observable behavior with a clear expected outcome and an applicable deterministic test
- **THEN** `@developer` writes or updates a high-value black-box test first, observes the missing behavior fail, implements the behavior, and verifies the test passes

#### Scenario: Behavior has no meaningful test
- **WHEN** a change is documentation- or prompt-only, or no practical deterministic test can establish the requested outcome
- **THEN** `@developer` does not force a test, records the reason in the completion report, and runs applicable checks

### Requirement: Test engineer complements developer-authored tests
After implementation, `@test-engineer` MUST inspect existing tests against the OpenSpec scenarios and add only missing high-value scenario or edge-case coverage. It MUST NOT duplicate tests that already provide adequate coverage, and MUST remain before the parallel code and security reviews.

#### Scenario: Developer tests already cover the scenario
- **WHEN** `@developer` has added a high-value test that adequately covers an OpenSpec scenario
- **THEN** `@test-engineer` reuses that coverage and does not add a duplicate test

#### Scenario: Scenario coverage is missing
- **WHEN** an OpenSpec scenario or valuable edge case lacks adequate test coverage
- **THEN** `@test-engineer` adds the smallest useful test for the uncovered behavior before code and security review begin

#### Scenario: Scenario has no meaningful deterministic test
- **WHEN** an OpenSpec scenario describes documentation, prompt guidance, or behavior without a practical deterministic test
- **THEN** `@test-engineer` records the scenario as not meaningfully testable with a reason and does not force a test
