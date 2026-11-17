# Spec Delta

## ADDED Requirements

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
