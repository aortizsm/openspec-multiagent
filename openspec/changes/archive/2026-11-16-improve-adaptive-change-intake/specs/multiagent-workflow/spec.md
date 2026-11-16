# Spec Delta

## ADDED Requirements

### Requirement: Two-stage discovery before proposal
At the start of each new change, the `@architect` MUST ask whether to use automatic or assisted execution unless already specified. Before drafting a proposal, it MUST complete two discovery passes: resolve material ambiguity, then confirm intent, scope, context, and acceptance. It MUST ask only unresolved material questions in natural conversation, at most two per turn.

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
