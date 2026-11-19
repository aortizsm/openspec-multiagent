# Spec Delta

## MODIFIED Requirements

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
