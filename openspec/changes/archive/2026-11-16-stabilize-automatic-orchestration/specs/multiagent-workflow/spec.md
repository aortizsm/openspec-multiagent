# Spec Delta

## ADDED Requirements

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

## REMOVED Requirements

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

**Reason**: Replaced with a single-correction policy to avoid repeating the full quality cycle more than once while preserving the final quality and verification gates.

**Migration**: Changes entering implementation after adoption use one correction attempt. Changes already in progress retain their previously approved allowance; no existing change is automatically archived or rewritten.
