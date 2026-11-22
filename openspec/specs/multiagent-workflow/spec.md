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

### Requirement: Correction allowance is declared per change
The correction allowance for a change MUST be declared in its own OpenSpec configuration, accepting both `correction_rounds` and the extension spelling `x-correction_rounds`, and MUST NOT be keyed on a change name. The architect-led cycle consumes the allowance and defaults to three rounds when none is declared. A value that is not a positive integer MUST fail closed before any agent runs.

#### Scenario: Declared allowance is used
- **WHEN** a change declares a valid `correction_rounds` value and acceptance-blocking findings require correction
- **THEN** the architect-led cycle runs correction bundles and quality reruns up to the declared allowance before stopping

#### Scenario: Change declares no allowance
- **WHEN** a change has no `correction_rounds` in its configuration
- **THEN** the architect-led cycle allows three correction rounds

#### Scenario: Declared allowance is invalid
- **WHEN** the configuration declares a value that is not a positive integer
- **THEN** the cycle fails closed with a clear error before reading change files or starting an agent

#### Scenario: Extension spelling is accepted
- **WHEN** a change declares its allowance with the OpenSpec extension spelling `x-correction_rounds`
- **THEN** the cycle honours it exactly as it honours the unprefixed key

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

### Requirement: Round consumption follows acceptance
A correction round MUST be consumed only by findings that block acceptance: a `CRITICAL`, or a `WARNING` linked to an acceptance criterion or scenario. Any other finding — a `SUGGESTION`, a documentation or ledger bookkeeping correction, or a pre-existing issue outside the change's scope — MUST be recorded with its disposition and MUST NOT consume a round or block archive.

#### Scenario: Only acceptance-blocking findings consume a round
- **WHEN** a quality phase or the verifier reports findings and none of them blocks acceptance
- **THEN** the architect records each disposition and continues to verification and archive without starting a correction round

#### Scenario: Acceptance-blocking finding consumes a round
- **WHEN** a `CRITICAL` or a `WARNING` linked to an acceptance criterion is open
- **THEN** it consumes one correction round and blocks archive until it is resolved

### Requirement: Correction cycle stops on non-convergence
The cycle MUST stop and report the ledger to the user, without archiving, when the same finding is submitted again without new evidence or when the developer and a reviewer cannot agree on the same finding, unless new evidence is presented. This stop applies whatever the remaining allowance.

#### Scenario: Resolved finding returns without new evidence
- **WHEN** a finding already marked resolved is reported again without new evidence
- **THEN** the architect stops the cycle, reports the ledger, and does not archive, whatever the allowance

#### Scenario: Developer and reviewer disagree
- **WHEN** the developer and a reviewer hold incompatible positions on the same finding after one correction
- **THEN** the architect stops and reports the disagreement to the user instead of sending another bundle

### Requirement: Re-verification is proportional to the correction
A correction that changes no behaviour — comments, documentation, or ledger evidence — MUST be confirmed with the finding's source agent and the affected checks re-run, without restarting the full quality sequence. A correction that changes behaviour, tests or specifications MUST restart the complete quality sequence before verification.

#### Scenario: Behaviour-preserving correction
- **WHEN** a correction touches only comments, documentation, or ledger evidence
- **THEN** the finding's source agent confirms closure and the affected checks are re-run

#### Scenario: Behaviour-changing correction
- **WHEN** a correction changes behaviour, tests or specifications
- **THEN** the complete quality sequence runs again before verification

### Requirement: Telemetry recorded per invocation
The orchestrator MUST append an invocation record to `openspec/changes/<change>/.run.json` at the start of each run, containing `profile`, `timestamp`, and `invocation_id`. Each gate invocation within the run MUST record `attempts`, `wall_ms`, `exit_code`, `verdict`, `fingerprint`, `skipped`, `bundle_bytes`, and `tokens`.

#### Scenario: telemetry recorded per invocation
- **WHEN** the orchestrator starts for a change
- **THEN** an invocation record is appended to `openspec/changes/<change>/.run.json` with `profile`, `timestamp`, `invocation_id`
- **THEN** each gate records `attempts`, `wall_ms`, `exit_code`, `verdict`, `fingerprint`, `skipped`, `bundle_bytes`, `tokens` (or `null`)

#### Scenario: token stats captured when available
- **WHEN** `opencode stats --json --cost --project . --days 0` succeeds
- **THEN** telemetry includes `tokens.input`, `tokens.output`, `tokens.reasoning`, `tokens.cache_read`, `tokens.cache_write`, `cost`
- **WHEN** the command fails or returns no data
- **THEN** telemetry records `tokens: null` and does not block the run

### Requirement: Base-ref and change diff
On the first run for a change with no `.gates.json`, the orchestrator MUST record `base_ref = git rev-parse HEAD` in `.gates.json`. The change diff MUST equal `git diff <base_ref>` (including staged changes) plus the content of untracked files reported by `git ls-files --others --exclude-standard`, and MUST be persisted to `.opencode/run/<change>/change.diff`.

#### Scenario: base_ref recorded on first run
- **WHEN** the orchestrator runs for a change with no `.gates.json`
- **THEN** `base_ref = git rev-parse HEAD` is written to `.gates.json`

#### Scenario: change diff includes staged and untracked
- **WHEN** `computeChangeDiff(baseRef)` runs
- **THEN** output equals `git diff <baseRef>` (includes staged) plus content of untracked files from `git ls-files --others --exclude-standard`
- **THEN** the diff artifact is written to `.opencode/run/<change>/change.diff`

### Requirement: Fingerprint gates
`computeFingerprint` MUST produce a SHA-256 hex string over the concatenation of `base_ref`, the diff bytes, the proposal/design/tasks/specs bytes, the agent definition file bytes, the resolved model id, and the bundle format version. A gate with a current `PASS` verdict MUST be skipped when its fingerprint matches, recording `skipped: true` and not invoking the agent. Any byte change in the inputs MUST invalidate the gate.

#### Scenario: fingerprint computed from all gate inputs
- **WHEN** `computeFingerprint` is called
- **THEN** input = concatenation of: `base_ref` + diff bytes + proposal/design/tasks/specs bytes + agent definition file bytes + resolved model id + bundle format version
- **THEN** output is a SHA-256 hex string

#### Scenario: gate skipped when fingerprint matches
- **WHEN** the orchestrator is re-invoked and a gate has `PASS` with an identical fingerprint
- **THEN** the gate is skipped, telemetry records `skipped: true`, and the agent is not invoked

#### Scenario: gate invalidated when any input changes
- **WHEN** any byte of the diff/spec/prompt/model/agent-definition changes
- **THEN** the fingerprint differs and the gate runs normally

#### Scenario: archive requires all gates current PASS
- **WHEN** `validateAllGatesPass` runs before archive
- **THEN** all required gates for the profile have `verdict=PASS` and a `fingerprint` matching current inputs
- **THEN** a missing or stale gate blocks archive

### Requirement: Ledger gate blocks archive on open findings
`checkLedgerGate` MUST parse the `## Review Findings` ledger from `tasks.md`, requiring a `status` column (`open` or `resolved`), and MUST return `{blocked: true, findings: [...]}` when any row has `severity` `CRITICAL` or `WARNING` with `status=open`. A row with `severity` `WARNING` and `status=resolved` MUST carry non-empty `evidence` to avoid blocking.

#### Scenario: open CRITICAL/WARNING blocks archive
- **WHEN** `checkLedgerGate` runs and finds a row with `severity=CRITICAL` or `WARNING` and `status=open`
- **THEN** it returns `{blocked: true, findings: [...]}`
- **THEN** the orchestrator blocks before `validate`/`archive`

#### Scenario: resolved with evidence does not block
- **WHEN** a row has `severity=WARNING` and `status=resolved` with non-empty `evidence`
- **THEN** it does not block archive

#### Scenario: resolved without evidence blocks
- **WHEN** a row has `severity=CRITICAL` or `WARNING` and `status=resolved` with empty `evidence`
- **THEN** it is treated as blocking

#### Scenario: ledger contract requires status column
- **WHEN** `isLedgerHeader` validates a header row
- **THEN** it requires a column named `status` (case-insensitive) in addition to the existing `id` and `severity` requirements

### Requirement: Transport retry and verdict handling
A transport failure (agent exits non-zero and produces no verdict artifact) MUST be retried exactly once with the same input, with the attempt count persisted in `.run.json`. A verdict artifact with `verdict=FAIL` MUST NOT be blind-retried; its findings MUST be written to `.opencode/run/<change>/<agent>-findings.json` and routed to the developer as the next cycle's input. Retry/fix counters MUST be read from `.run.json`, not held in memory.

#### Scenario: transport failure retries once
- **WHEN** an agent exits ≠0 and produces no verdict artifact
- **THEN** exactly 1 retry occurs with the same input
- **THEN** the attempt count is persisted in `.run.json`

#### Scenario: verdict FAIL never blind-retries
- **WHEN** an agent exits 0 but its verdict artifact shows `verdict=FAIL`
- **THEN** no retry occurs; findings are written to `<agent>-findings.json`
- **THEN** the developer is invoked next with the findings as input

#### Scenario: max 3 fix cycles then escalate
- **WHEN** the fix cycle count reaches 3 for a change
- **THEN** the orchestrator escalates to the architect (throws with evidence)

#### Scenario: counters persisted not in-memory
- **WHEN** the orchestrator restarts
- **THEN** retry/fix counters are read from `.run.json`, not from an in-memory Map

### Requirement: Parallel evaluation DAG without sibling kills
`[code-reviewer, security-reviewer, verifier]` MUST run concurrently and be joined with `Promise.allSettled`, which waits for all three. A failure in one member MUST NOT call `child.kill()` on a sibling. Findings from every group member MUST be consolidated into a single fix pass. A per-agent timeout (default 15 minutes, `ORCHESTRATOR_TIMEOUT_MS`) MUST kill only the hung child and mark only that gate as a transport failure.

#### Scenario: reviewers and verifier run in parallel
- **WHEN** `runParallelGroupNoKill` executes for `[code-reviewer, security-reviewer, verifier]`
- **THEN** all three are spawned concurrently
- **THEN** `Promise.allSettled` waits for all

#### Scenario: sibling failure does not kill others
- **WHEN** one agent in the parallel group fails
- **THEN** the other agents continue to completion
- **THEN** no `child.kill()` is called on siblings

#### Scenario: findings consolidated from all group members
- **WHEN** the parallel group completes with mixed verdicts
- **THEN** all findings (including from PASS agents) are consolidated into a single fix pass for the developer

#### Scenario: timeout kills only hung process
- **WHEN** an agent exceeds `ORCHESTRATOR_TIMEOUT_MS` (default 15 min)
- **THEN** only that child process is killed
- **THEN** the gate is marked transport FAIL
- **THEN** other agents are unaffected

### Requirement: Read-only gates never revert code
A reviewer or verifier gate failure MUST NOT call `rollbackToCheckpoint`, so the developer's implementation is preserved. An implementation gate (developer or test-engineer) failure MUST revert only that agent's own edits, preserving previous agents' work.

#### Scenario: read-only gates never revert code
- **WHEN** a reviewer or verifier gate fails
- **THEN** no `rollbackToCheckpoint` is called
- **THEN** the developer's implementation is preserved

#### Scenario: implementation gates revert only own edits
- **WHEN** a developer or test-engineer gate fails
- **THEN** rollback reverts only changes from that agent's checkpoint
- **THEN** previous agents' work is preserved

### Requirement: Role-scoped context bundles
Each agent invocation MUST receive a role-scoped bundle built by a dedicated builder for that role, and each bundle MUST be at most 60 KB. The bundle MUST be passed to the agent by path in the invocation message rather than embedded wholesale in the `OPENCODE_CONTEXT_BUNDLE` environment variable.

#### Scenario: developer bundle contains tasks, specs, design decisions, scout cache, previous findings
- **WHEN** `buildDeveloperBundle` runs
- **THEN** the bundle includes `tasks.md`, all `specs/*/spec.md`, `design.md` limited to `## executive_summary`, `## artifacts`, `## risks`, and `## next_recommended`, the scout cache, and previous findings from `.opencode/run/<change>/*-findings.json`
- **THEN** the bundle size is at most 60 KB

#### Scenario: test-engineer bundle contains scenarios, coverage map, test conventions
- **WHEN** `buildTestEngineerBundle` runs
- **THEN** the bundle includes spec scenarios (extracted `WHEN`/`THEN`), the developer's coverage map from `tasks.md` (parseable table), and project test conventions from the `@repo-scout` cache
- **THEN** the bundle size is at most 60 KB

#### Scenario: code-reviewer bundle contains diff, scenarios, clean-code criteria
- **WHEN** `buildCodeReviewerBundle` runs
- **THEN** the bundle includes the change diff (or a summary plus file list if it exceeds the budget), the spec scenarios, and the 12 clean-code criteria from the `clean-code-criteria` spec
- **THEN** the bundle size is at most 60 KB

#### Scenario: security-reviewer bundle contains diff, security criteria, relevant scenarios
- **WHEN** `buildSecurityReviewerBundle` runs
- **THEN** the bundle includes the change diff (or a summary), the 12 security criteria from the `security-criteria` spec, and the scenarios relevant to security (auth, input handling, file ops, secrets)
- **THEN** the bundle size is at most 60 KB

#### Scenario: verifier bundle contains scenarios, commands, diff-stat
- **WHEN** `buildVerifierBundle` runs
- **THEN** the bundle includes the spec scenarios, the project commands from the `@repo-scout` cache, and `git diff --stat`
- **THEN** the bundle size is at most 60 KB

#### Scenario: bundle passed by path in invocation message
- **WHEN** the orchestrator invokes an agent
- **THEN** the message is `"Change: <name>. Context bundle: <path>. Read it first."`
- **THEN** the `OPENCODE_CONTEXT_BUNDLE` environment variable is not set

#### Scenario: large diff triggers summarization
- **WHEN** the diff exceeds the 60 KB budget
- **THEN** a summary plus file list is produced and the full diff path is included in the bundle for on-demand reading
- **THEN** the bundle size remains at most 60 KB

### Requirement: Repo-scout cache
`@repo-scout` results MUST be cached per git HEAD under `.opencode/cache/scout-<HEAD>.md`, and the cache MUST be reused for subsequent agents in the same run. A HEAD change MUST invalidate the cache so `@repo-scout` runs again.

#### Scenario: scout cache written once per HEAD
- **WHEN** the first agent needs scout data
- **THEN** `@repo-scout` is invoked and its result is cached to `.opencode/cache/scout-<HEAD>.md`
- **WHEN** subsequent agents need scout data in the same run
- **THEN** the cache is reused and no additional `@repo-scout` invocation occurs

#### Scenario: cache invalidated on HEAD change
- **WHEN** `git rev-parse HEAD` differs from the cached HEAD
- **THEN** the cache is missed and `@repo-scout` is invoked again

### Requirement: Machine-readable verdict contract
Every agent invocation MUST write a verdict JSON artifact at `.opencode/run/<change>/<agent>-verdict.json`. An agent that produces the artifact MUST exit 0 regardless of the verdict value, while an infrastructure failure (spawn error, timeout, or missing artifact) MUST exit non-zero. The orchestrator MUST read the JSON artifact to determine the verdict, ignoring the exit code for verdict judgment.

#### Scenario: agents write verdict JSON
- **WHEN** an agent completes
- **THEN** it writes `.opencode/run/<change>/<agent>-verdict.json` with `agent`, `verdict` (`PASS`/`FAIL`/`UNVERIFIABLE`), `findings` (each with `id`, `severity`, `status`, `evidence`, and optional `file`/`line`), and `summary`

#### Scenario: exit code 0 on artifact production
- **WHEN** an agent produces verdict JSON (any verdict)
- **THEN** the exit code is 0
- **WHEN** an infrastructure failure occurs (spawn error, timeout, or no artifact)
- **THEN** the exit code is non-zero

#### Scenario: orchestrator reads JSON for judgment
- **WHEN** the orchestrator collects a gate result
- **THEN** it reads the verdict JSON and ignores the exit code for verdict judgment
- **THEN** `verdict=FAIL` routes findings to the developer
- **THEN** `verdict=UNVERIFIABLE` is recorded with justification

#### Scenario: developer/test-engineer also read bundle
- **WHEN** the developer or test-engineer is invoked
- **THEN** it reads the bundle from the path in the message
- **THEN** no `OPENCODE_CONTEXT_BUNDLE` environment variable is used

### Requirement: Pipeline profile declaration
The orchestrator MUST read the declared pipeline profile from the change's `.openspec.yaml` (`pipeline`, accepted as `pipeline` or the OpenSpec extension spelling `x-pipeline`), defaulting to `standard` when the key or file is absent. The risk globs MUST also be configurable, defaulting to `**/auth/**`, `**/migrations/**`, `**/sql/**`, `**/api/public/**`, `**/secrets/**`, `**/*.sql`, and `**/database/**`.

#### Scenario: profile declared in .openspec.yaml
- **WHEN** a change has `.openspec.yaml` with `x-pipeline: lite|standard|strict`
- **THEN** the orchestrator reads the declared profile
- **WHEN** there is no `.openspec.yaml` or no `pipeline` key
- **THEN** the default profile is `standard`

#### Scenario: risk globs configurable
- **WHEN** `.openspec.yaml` declares `risk_globs: []`
- **THEN** those globs are used instead of the defaults
- **WHEN** there is no `risk_globs` key
- **THEN** the defaults are used: `['**/auth/**', '**/migrations/**', '**/sql/**', '**/api/public/**', '**/secrets/**', '**/*.sql', '**/database/**']`

### Requirement: Risk-based escalation
A diff that matches any risk glob MUST escalate a `standard` profile to `strict` and MUST be a hard error for a `lite` profile. Telemetry MUST record `profile_escalated: true`, `original_profile`, and `matched_globs` when escalation occurs, and no agent MUST be invoked when a `lite` profile is rejected.

#### Scenario: risk diff forces strict
- **WHEN** the declared profile is `lite` or `standard` and `matchRiskGlobs(diff, riskGlobs)` is true
- **THEN** the effective profile is `strict`
- **THEN** telemetry records `profile_escalated: true`, `original_profile`, and `matched_globs`

#### Scenario: lite with risk diff is hard error
- **WHEN** the declared profile is `lite` and `matchRiskGlobs(diff, riskGlobs)` is true
- **THEN** the orchestrator throws the hard error `"lite profile prohibited for changes touching risk paths: <globs>. Use standard or strict."`
- **THEN** no agents are invoked

### Requirement: Profile-specific DAG composition
Each profile MUST compose the agent DAG it defines: `lite` runs `developer` → `code-reviewer` (unified clean-code and security checklist) → `verifier` and MUST NOT invoke `test-engineer` or `security-reviewer`; `standard` runs `developer` → `test-engineer` (gap-filler mode) → `[code-reviewer ∥ security-reviewer ∥ verifier]`; `strict` runs `developer` → `test-engineer` (full mode) → `[code-reviewer ∥ security-reviewer ∥ verifier]`.

#### Scenario: lite profile runs developer → code-reviewer → verifier
- **WHEN** the effective profile is `lite`
- **THEN** the agent order is `developer` → `code-reviewer` → `verifier`
- **THEN** `code-reviewer` runs a unified clean-code and security checklist (single reviewer)
- **THEN** `test-engineer` and `security-reviewer` are not invoked

#### Scenario: standard profile runs developer → test-engineer(gap-filler) → parallel reviewers+verifier
- **WHEN** the effective profile is `standard`
- **THEN** the agent order is `developer` → `test-engineer` (mode: gap-filler) → `[code-reviewer ∥ security-reviewer ∥ verifier]`
- **THEN** `test-engineer` only fills gaps per the coverage map

#### Scenario: strict profile runs developer → test-engineer(full) → parallel reviewers+verifier
- **WHEN** the effective profile is `strict`
- **THEN** the agent order is `developer` → `test-engineer` (mode: full) → `[code-reviewer ∥ security-reviewer ∥ verifier]`
- **THEN** `test-engineer` writes full scenario coverage (not just gaps)

### Requirement: Coverage-map gap-filler
`parseCoverageMap` MUST read the coverage table from `tasks.md` with columns `Scenario`, `Test File`, `Test Case`, and `Status`, where `Status` is `covered` or `no-deterministic-test` (the latter requiring an architect approval note). When every scenario is covered the `standard` profile MUST omit `test-engineer`; when gaps exist `test-engineer` MUST be invoked with the gaps as input and write tests only for the uncovered scenarios.

#### Scenario: coverage map parsed from tasks.md
- **WHEN** `parseCoverageMap` reads `tasks.md`
- **THEN** it finds the table with columns `Scenario`, `Test File`, `Test Case`, and `Status`
- **THEN** `Status` values are `covered` or `no-deterministic-test` (the latter requiring an architect approval note)

#### Scenario: all scenarios covered → test-engineer skipped
- **WHEN** `parseCoverageMap` returns `allCovered: true`
- **THEN** `test-engineer` is omitted from the DAG for the `standard` profile
- **THEN** telemetry records `test_engineer_skipped: true` with `reason: "full_coverage"`

#### Scenario: gap exists → test-engineer runs gap-filler
- **WHEN** `parseCoverageMap` returns `allCovered: false` with `gaps: [...]`
- **THEN** `test-engineer` is invoked with the gaps as input
- **THEN** `test-engineer` writes tests only for the uncovered scenarios

### Requirement: Quality threshold invariant across profiles
Every profile MUST satisfy the same quality gates: the `@verifier` MUST run the same scenarios and commands regardless of profile, the ledger gate MUST block archive on any open `CRITICAL`/`WARNING` finding, `openspec validate --strict` MUST pass, and all required gates MUST be current `PASS` with matching fingerprints.

#### Scenario: all profiles satisfy identical quality gates
- **WHEN** any profile completes
- **THEN** `@verifier` runs the same scenarios (verifier bundle unchanged)
- **THEN** the ledger gate blocks on any open `CRITICAL`/`WARNING` finding
- **THEN** `openspec validate --strict` passes
- **THEN** all required gates are current `PASS` with matching fingerprints

#### Scenario: verifier suite scope unchanged by profile
- **WHEN** the effective profile is `lite`, `standard`, or `strict`
- **THEN** the verifier receives the same scenarios bundle
- **THEN** the verifier runs the same commands
- **THEN** the verifier reports per-scenario `PASS`/`FAIL`/`UNVERIFIABLE`
