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
- **WHEN** `@verifier` reports a `FAIL` and the change's correction allowance is not yet exhausted
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

#### Scenario: Ledger section has no findings
- **WHEN** the `## Review Findings` section of a change's `tasks.md` records no findings and contains no line bounded by pipe delimiters, so it holds no ledger table
- **THEN** the ledger is treated as empty and archive is not blocked by it

#### Scenario: Ledger section holds prose without a table
- **WHEN** the section records no findings but a prose sentence inside it contains a pipe character
- **THEN** the ledger is still treated as empty, because only lines bounded by pipe delimiters are read as table rows

#### Scenario: Ledger row or header is malformed
- **WHEN** the `## Review Findings` section contains a table row whose header is not the ledger header, or a row that cannot be read as a finding entry
- **THEN** the orchestrator fails closed and reports the ledger inconsistency instead of treating the section as empty

#### Scenario: Ledger section appears more than once
- **WHEN** a change's `tasks.md` contains more than one `## Review Findings` section
- **THEN** the orchestrator fails closed and reports the duplicate ledger section instead of reading only the first one

### Requirement: Developer uses test-first for observable behavior
When observable implementation behavior has a practical, high-value deterministic black-box test, `@developer` MUST create or update the test before implementing that behavior, observe the expected failure, then implement until the test passes. When no such test is appropriate, `@developer` MUST explain why and run applicable checks.

#### Scenario: Behavior has a deterministic test
- **WHEN** a change requests observable behavior with a clear expected outcome and an applicable deterministic test
- **THEN** `@developer` writes or updates a high-value black-box test first, observes the missing behavior fail, implements the behavior, and verifies the test passes

#### Scenario: Behavior has no meaningful test
- **WHEN** a change is documentation- or prompt-only, or no practical deterministic test can establish the requested outcome
- **THEN** `@developer` does not force a test, records the reason in the completion report, and runs applicable checks

### Requirement: Test engineer complements developer-authored tests
After implementation, `@test-engineer` MUST inspect existing tests against the OpenSpec scenarios and add only missing high-value scenario or edge-case coverage. It MUST NOT duplicate tests that already provide adequate coverage, and MUST remain before the parallel code and security reviews. It MUST validate the tests it adds by running the project's permitted test commands, or report them as unexecuted when those commands cannot run.

#### Scenario: Developer tests already cover the scenario
- **WHEN** `@developer` has added a high-value test that adequately covers an OpenSpec scenario
- **THEN** `@test-engineer` reuses that coverage and does not add a duplicate test

#### Scenario: Scenario coverage is missing
- **WHEN** an OpenSpec scenario or valuable edge case lacks adequate test coverage
- **THEN** `@test-engineer` adds the smallest useful test for the uncovered behavior before code and security review begin

#### Scenario: Scenario has no meaningful deterministic test
- **WHEN** an OpenSpec scenario describes documentation, prompt guidance, or behavior without a practical deterministic test
- **THEN** `@test-engineer` records the scenario as not meaningfully testable with a reason and does not force a test

#### Scenario: Added tests are validated before the reviews start
- **WHEN** `@test-engineer` adds or changes a test and the project's permitted test commands can run
- **THEN** it executes them, reports the observed pass or fail result with the added tests, and fixes or reports a failure before the parallel code and security reviews begin

#### Scenario: Permitted test commands cannot run
- **WHEN** the permitted test commands cannot run in the test-engineer's environment
- **THEN** it declares the added tests as unexecuted and identifies them in its report so the architect or the verifier validates them, instead of implying they passed

### Requirement: Two-stage discovery before proposal
At the start of each new change, the `@architect` MUST ask whether to use automatic or assisted execution unless already specified. Before drafting a proposal, it MUST complete two discovery passes: resolve material ambiguity, then confirm intent, scope, context, and acceptance. It MUST ask every unresolved material question through the OpenCode question menu with selectable options, together in one call, and MUST NOT ask them as plain numbered text.

#### Scenario: Execution mode is unspecified
- **WHEN** a new change begins and the user has not selected an execution mode
- **THEN** the architect asks whether to use automatic or assisted execution

#### Scenario: Execution mode is already specified
- **WHEN** the user's request already selects automatic or assisted execution
- **THEN** the architect honors that selection without asking the user to repeat it

#### Scenario: Ambiguity pass
- **WHEN** the request contains a material ambiguity that cannot be resolved from repository context
- **THEN** the architect asks focused questions to resolve it before drafting the proposal

#### Scenario: Scope and context pass
- **WHEN** the ambiguity pass is complete and the proposal has not been drafted
- **THEN** the architect checks intent, scope, context, and acceptance, and asks only about material details still missing

#### Scenario: Details are already clear
- **WHEN** a discovery pass finds that its material details are already answered or discoverable
- **THEN** the architect records no open question for that pass and does not repeat or invent questions

#### Scenario: Material questions arrive through the menu
- **WHEN** the architect holds one or more unresolved material questions for the user
- **THEN** it presents them in a single OpenCode question-menu call with selectable options, and does not present them as a numbered list in the chat

#### Scenario: The menu does not limit the answer
- **WHEN** the user wants to answer something other than the offered options
- **THEN** the user writes a free-form answer from the same menu, so the menu never blocks a different reply

#### Scenario: Execution mode is not design approval
- **WHEN** the user selects automatic or assisted execution mode
- **THEN** the architect still completes the proposal and design, then requests the existing final design approval before any agent starts

### Requirement: Mode-specific agent handoffs
In assisted mode, the `@architect` MUST ask and wait at an agent handoff when a material doubt needs user clarification, and MUST continue without a prompt when the next task is clear. In automatic mode, it MUST NOT ask routine handoff questions and MUST stop and notify the user if it reaches a material blocker it cannot resolve from approved artifacts or repository context.

#### Scenario: Assisted handoff has a material doubt
- **WHEN** assisted execution is about to hand work to an agent and a material uncertainty remains
- **THEN** the architect states the uncertainty, asks the user a focused question, and waits before dispatching the agent

#### Scenario: Assisted handoff is clear
- **WHEN** assisted execution is about to hand work to an agent and no material uncertainty remains
- **THEN** the architect proceeds to that agent without an unnecessary confirmation prompt

#### Scenario: Automatic execution has no blocker
- **WHEN** automatic execution reaches an agent handoff and the approved artifacts provide sufficient direction
- **THEN** the architect lets the pipeline continue without asking the user a handoff question

#### Scenario: Automatic execution reaches a material blocker
- **WHEN** automatic execution encounters a material decision that cannot be resolved from approved artifacts or repository context
- **THEN** the architect stops the pipeline and reports the blocker without inventing a decision

### Requirement: Structured outcomes gate automatic orchestration
The automatic orchestrator MUST consume and validate one machine-readable outcome from each invoked agent. Missing, malformed, duplicate, or role-invalid outcomes MUST stop the pipeline before later phases or archive.

#### Scenario: Valid outcome permits the next phase
- **WHEN** an agent returns a parseable outcome with a status allowed for its role
- **THEN** the orchestrator applies the status-specific gate before deciding whether to advance

#### Scenario: Role-specific outcomes
- **WHEN** automatic orchestration runs an agent
- **THEN** developer returns `ready` or `blocked`, test engineer and invoked UX designer return `complete` or `blocked`, reviewers return `approved`, `changes_requested`, or `blocked`, the architect correction coordinator returns `bundle_ready`, `continue`, or `blocked`, and verifier returns per-scenario `pass`, `fail`, or `unverifiable`

#### Scenario: Agent reports a material blocker
- **WHEN** an agent returns a blocked outcome with its reason
- **THEN** the orchestrator stops later phases and archive and reports the blocker

#### Scenario: Agent outcome is missing or invalid
- **WHEN** an agent completes without a recognized outcome or the outcome cannot be parsed
- **THEN** the orchestrator fails closed, stops the pipeline, and does not archive

#### Scenario: Verifier omits a required scenario
- **WHEN** the verifier outcome does not include every scenario in the change specs
- **THEN** the orchestrator stops before archive and reports the missing scenario coverage

#### Scenario: Reviewer requests changes
- **WHEN** either reviewer reports required changes
- **THEN** the architect consolidates the findings and records them in the ledger before automatic correction begins

#### Scenario: Reviewer approval includes optional suggestions
- **WHEN** a reviewer approves with only `SUGGESTION` findings
- **THEN** the architect records whether each suggestion is adopted or declined with rationale, and the orchestrator continues without treating declined suggestions as required changes

#### Scenario: Reviewer reports only optional suggestions
- **WHEN** a reviewer finds only optional `SUGGESTION` items
- **THEN** it returns `approved` with the suggestions; `changes_requested` is reserved for required findings

### Requirement: Automatic mode preserves conditional UX review
In automatic mode, a change with UI/UX requirements MUST run the UX designer before the developer; a change without UI/UX requirements MUST omit that phase.

#### Scenario: Approved change includes UI/UX
- **WHEN** automatic mode is selected for a change with UI/UX requirements
- **THEN** the architect enables UX review and the orchestrator runs `ux-designer` before `developer`

#### Scenario: Approved change has no UI/UX work
- **WHEN** automatic mode is selected for a change without UI/UX requirements
- **THEN** the orchestrator does not run the UX phase

### Requirement: Single correction attempt for future changes
For changes entering implementation after adoption, the `@architect` MUST allow at most one correction attempt. Each attempt includes one consolidated bundle, one developer correction, and one full quality/verifier rerun. Afterward, open required findings or verifier `FAIL` MUST be reported and block archive. Declined suggestions with rationale do not consume the attempt. Changes already in progress retain their approved allowance.

#### Scenario: Initial findings trigger one consolidated correction
- **WHEN** the initial quality sequence or verifier reports actionable findings
- **THEN** the architect sends one bundle for one developer correction and then runs the full quality and verification sequence once

#### Scenario: Corrected change passes the full gates
- **WHEN** the developer addresses the consolidated bundle and the full quality sequence and verifier pass
- **THEN** the architect may proceed to the final archive gate

#### Scenario: Required findings remain after the single correction
- **WHEN** a `CRITICAL` or `WARNING` finding remains open after the single correction attempt
- **THEN** the architect stops, reports the unresolved findings, and does not archive or start another correction attempt

#### Scenario: Verifier fails after the single correction
- **WHEN** `@verifier` reports a `FAIL` after the single correction attempt
- **THEN** the architect records and reports the failed scenario and evidence, does not start another correction attempt, and does not archive

#### Scenario: Optional suggestion is declined
- **WHEN** a reviewer `SUGGESTION` is marked `not adopted` with rationale
- **THEN** it does not consume the single correction attempt and does not block verification or archive

#### Scenario: Existing in-progress change retains its approved allowance
- **WHEN** a change was already in progress before this policy was adopted
- **THEN** the change continues under its previously approved correction allowance

### Requirement: Orchestration integration audit before approval
Before final design approval for a change that touches automatic orchestration, agent handoffs, or archive behavior, the `@architect` MUST map each acceptance scenario to its implementation path, agent outcome, state transition, failure behavior, archive effect, and verification test. The architect MUST resolve gaps or explicitly exclude them from the approved scope.

#### Scenario: Automation-sensitive design is ready
- **WHEN** a change affects the orchestrator, agent handoffs, semantic outcomes, or archive gates
- **THEN** the architect presents an integration map covering each scenario, affected code path, outcome/state transition, failure behavior, archive effect, and test before requesting design approval

#### Scenario: Integration path or failure case is missing
- **WHEN** the audit finds an acceptance scenario without a known implementation path, failure behavior, or verification method
- **THEN** the architect resolves the gap in the design or records it as out of scope before asking for approval

### Requirement: Automatic findings reconcile with the actual ledger
Before automatic execution advances after an architect coordinator outcome or archives a change, the orchestrator MUST match the outcome's findings and decisions to the actual `tasks.md` ledger, including IDs, source, severity, scenario, location, request, status, and closure evidence. Missing or mismatched rows and open required findings MUST block archive.

#### Scenario: Correction bundle matches the ledger
- **WHEN** the architect coordinator returns `bundle_ready`
- **THEN** every finding in the bundle has a matching actual ledger row with a stable ID and current status/evidence before developer correction starts

#### Scenario: Coordinator claims a ledger update without matching rows
- **WHEN** the coordinator reports `ledger_updated` but a finding or verifier decision is absent or differs in the actual `tasks.md`
- **THEN** automatic execution stops before dispatching the next agent or archiving

#### Scenario: Required ledger finding remains open
- **WHEN** the automatic pipeline reaches archive while a CRITICAL or WARNING ledger row is `open` or lacks required closure evidence
- **THEN** it stops and reports the unresolved row without archiving

#### Scenario: Previously recorded finding is removed or malformed
- **WHEN** a finding ID validated from an architect outcome is missing from the final ledger, duplicated, or hidden by a malformed ledger row
- **THEN** the orchestrator fails closed before archive and reports the ledger inconsistency

#### Scenario: Required finding classification is downgraded
- **WHEN** a previously validated CRITICAL or WARNING finding is changed to SUGGESTION or `not adopted` before archive
- **THEN** the orchestrator fails closed and reports the finding metadata mismatch

### Requirement: Automatic reviewer dispositions remain explicit
In automatic mode, a reviewer MUST use `changes_requested` only when at least one CRITICAL or WARNING finding requires correction. An `approved` result MAY include optional SUGGESTION findings; the architect MUST record each suggestion as adopted for correction or `not adopted` with rationale before the verifier runs.

#### Scenario: Optional suggestion is adopted
- **WHEN** the architect adopts a reviewer SUGGESTION
- **THEN** it records an open ledger finding, returns a correction bundle, and the orchestrator runs developer correction and the full quality sequence

#### Scenario: Optional suggestion is declined
- **WHEN** the architect declines a reviewer SUGGESTION
- **THEN** it records `not adopted` with rationale, and that suggestion alone does not trigger another correction round or block archive

#### Scenario: Approved outcome contains a required finding
- **WHEN** a reviewer returns `approved` with a CRITICAL or WARNING finding
- **THEN** the orchestrator fails closed before verification or archive

#### Scenario: Coordinator finding IDs are unique and map one-to-one
- **WHEN** a coordinator outcome repeats a finding ID or maps multiple findings to the same actual ledger row
- **THEN** the orchestrator rejects the outcome before dispatching another agent

### Requirement: Automatic verifier coverage matches the change specs
Before automatic archive, verifier outcomes MUST include exactly one result for every scenario in every change spec, with no missing, duplicated, or unexpected scenario ID.

#### Scenario: Verifier omits or adds a scenario
- **WHEN** the verifier result set differs from the scenarios parsed from the change specs
- **THEN** the orchestrator stops before archive and reports the coverage mismatch

### Requirement: Automatic process cancellation is bounded
The automatic orchestrator MUST enforce configured runtime and output bounds and terminate and reap the complete agent process tree on timeout, overflow, or failure. When one parallel reviewer is blocked or fails, its sibling MUST be cancelled and reaped before the pipeline returns control.

#### Scenario: Agent exceeds output or runtime bounds
- **WHEN** an agent exceeds its configured output limit or runtime
- **THEN** the orchestrator terminates its process tree, reports the cause, and runs no later phase or archive

#### Scenario: Parallel reviewer is blocked
- **WHEN** either parallel reviewer reports `blocked` or fails
- **THEN** the orchestrator cancels and reaps the sibling reviewer before stopping without verifier or archive

#### Scenario: Windows process-tree termination fails
- **WHEN** the Windows process-tree termination command returns a failure status
- **THEN** the orchestrator reports termination failure, does not claim the process tree was reaped, and starts no later phase or archive

### Requirement: Automatic agent output preserves UTF-8 boundaries
The orchestrator MUST preserve valid UTF-8 text when a multi-byte character is split across child-process output chunks, so structured outcome parsing receives the original text.

#### Scenario: Multi-byte output character spans stream chunks
- **WHEN** valid UTF-8 output contains a multi-byte character split between consecutive child-process chunks
- **THEN** the captured text and parsed outcome preserve that character without replacement or corruption

### Requirement: Automatic change names have bounded length
Before using a CLI change name in filesystem paths or subprocess arguments, the orchestrator MUST validate its format and reject names longer than 128 characters.

#### Scenario: Change name exceeds maximum length
- **WHEN** the orchestrator receives a change name longer than 128 characters
- **THEN** it exits with an error before reading change files or starting an agent

### Requirement: Review content is treated as untrusted data
Agent prompts that review change artifacts or diffs MUST instruct reviewers to treat their contents as untrusted data, not as instructions that override the trusted spec, task, or reviewer role.

#### Scenario: Reviewed artifact contains instruction-like text
- **WHEN** a change artifact or diff includes text that attempts to redirect a reviewer or alter review criteria
- **THEN** the reviewer evaluates that text as untrusted content and follows the trusted spec and reviewer instructions

### Requirement: Review ledger input is bounded
Before parsing the `Review Findings` ledger from `tasks.md`, the orchestrator MUST reject file content larger than 1 MiB.

#### Scenario: Review ledger input exceeds the size limit
- **WHEN** `tasks.md` exceeds 1 MiB while a workflow findings ledger is being read
- **THEN** the orchestrator fails closed before later phases or archive

### Requirement: Correction allowance is declared per change
The automatic orchestrator MUST resolve the correction allowance for a change from the change's own OpenSpec configuration, accepting both `correction_rounds` and the OpenSpec extension spelling `x-correction_rounds` in `openspec/changes/<name>/.openspec.yaml`, and MUST default to one attempt when the change declares neither. It MUST NOT key any allowance on a change name.

#### Scenario: Declared allowance is used
- **WHEN** a change declares a valid `correction_rounds` value greater than one and its findings require correction
- **THEN** the orchestrator runs correction bundles and quality reruns up to the declared allowance before stopping

#### Scenario: Change declares no allowance
- **WHEN** a change has no `correction_rounds` in its configuration
- **THEN** the orchestrator allows exactly one correction attempt

#### Scenario: Declared allowance is invalid
- **WHEN** the configuration declares a value that is not a positive integer
- **THEN** the orchestrator fails closed with a clear error before reading change files or starting an agent

#### Scenario: Extension spelling is accepted
- **WHEN** a change declares its allowance with the OpenSpec extension spelling `x-correction_rounds`
- **THEN** the orchestrator honours it exactly as it honours the unprefixed key

### Requirement: Distributed agent definitions match their source
The repository MUST keep `opencode/agents/<name>.md` as the only source of agent definitions: a project check or test MUST fail when an installed copy under `.opencode/agents/<name>.md` differs from its source, or when `.opencode/agents/` contains an installed definition with no matching source file.

#### Scenario: Installed copy drifts from its source
- **WHEN** an installed agent definition differs from the source definition
- **THEN** the project check or test fails and reports the drifted file

#### Scenario: Installed copies match their source
- **WHEN** every installed agent definition is byte-identical to its source definition and no installed definition lacks a source
- **THEN** the project check and test pass

#### Scenario: Installed definition has no source
- **WHEN** `.opencode/agents/` contains an agent definition with no matching file in `opencode/agents/`, for example after a source agent is renamed or removed
- **THEN** the project check or test fails and reports the orphan installed file

### Requirement: Agent prompts carry no bypass or change-specific directives
Distributed agent prompts MUST NOT instruct an agent to bypass its own permission policy, and MUST NOT embed directions that apply to one specific OpenSpec change.

#### Scenario: Prompt instructs bypassing permissions
- **WHEN** an agent prompt tells the agent to change files outside its allowed resources by another route
- **THEN** the prompt-integrity test fails

#### Scenario: Prompt embeds a change-specific directive
- **WHEN** an agent prompt contains a directive naming a single OpenSpec change
- **THEN** the prompt-integrity test fails

### Requirement: Developer completes clean-code refinement before handoff
The `@developer` MUST complete a focused clean-code refinement after the functional implementation and applicable tests or checks pass, then rerun applicable tests and checks before reporting completion. This refinement is part of implementation and does not add or reorder pipeline agents.

#### Scenario: Functional implementation enters refinement
- **WHEN** the requested behavior and applicable tests pass
- **THEN** the `@developer` performs a focused refinement against the clean-code criteria before handing the change to `@test-engineer`

#### Scenario: Post-refinement validation fails
- **WHEN** a test or applicable check fails after clean-code refinement
- **THEN** the `@developer` corrects the regression and reruns the affected checks before reporting completion

#### Scenario: No meaningful deterministic test applies
- **WHEN** the behavior has no practical high-value deterministic test and applicable project checks pass
- **THEN** the `@developer` performs the clean-code refinement and reruns the applicable checks before reporting completion

#### Scenario: Developer handoff succeeds
- **WHEN** the refinement is complete and applicable post-refinement checks pass
- **THEN** the existing sequence continues with `@test-engineer`, parallel code and security reviews, and independent verification, without a new agent phase

### Requirement: Avoid speculative performance optimization during refinement
The `@developer` MUST NOT add performance optimizations without evidence of a measured bottleneck or an explicit performance requirement.

#### Scenario: No measured performance need
- **WHEN** the specification contains no performance requirement and no measured bottleneck supports an optimization
- **THEN** the `@developer` limits refinement to justified correctness, clarity, and maintainability improvements

#### Scenario: Performance need is evidenced
- **WHEN** the specification defines a performance requirement or measurements identify a bottleneck
- **THEN** the `@developer` may make a scoped optimization and verifies that the required behavior and tests still pass

### Requirement: Test engineer keeps a least-privilege shell boundary
`@test-engineer` MUST have shell access limited to read-only auxiliary commands and the project's test commands. It MUST NOT have unrestricted shell access, and it MUST NOT be granted build, check, deploy, or service-management commands.

#### Scenario: Test commands are permitted
- **WHEN** a maintainer inspects the `@test-engineer` agent permissions
- **THEN** the project's test command family is permitted, including the package-manager test scripts and the language-specific runners such as `phpunit`, `artisan test`, and `pytest`

#### Scenario: Unrestricted shell stays denied
- **WHEN** a maintainer inspects the `@test-engineer` agent permissions
- **THEN** `shell: "*"` is denied and only the auxiliary read-only commands plus the test command family are permitted

#### Scenario: Non-test commands stay out of the allowlist
- **WHEN** a maintainer inspects the `@test-engineer` agent permissions
- **THEN** the repository readiness, build, deploy, and service commands are not permitted for this agent
