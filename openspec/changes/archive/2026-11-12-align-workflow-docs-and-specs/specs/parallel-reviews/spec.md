# Spec Delta

## ADDED Requirements

### Requirement: Test engineer joins the parallel quality phase
In a standard full `@architect` run that starts with `@developer`, after implementation the orchestrator MUST run `@test-engineer`, `@code-reviewer`, and `@security-reviewer` concurrently as one quality phase.

#### Scenario: Three quality agents start together
- **WHEN** `@developer` completes implementation
- **THEN** the orchestrator starts all three quality agents without waiting for one of them to finish first

### Requirement: Verifier waits for the complete quality phase
In a standard full `@architect` run, the orchestrator MUST NOT run `@verifier` until all three quality agents complete successfully.

#### Scenario: All quality agents pass
- **WHEN** `@test-engineer`, `@code-reviewer`, and `@security-reviewer` complete successfully
- **THEN** the orchestrator continues to `@verifier`

#### Scenario: A quality agent fails
- **WHEN** any of the three quality agents fails
- **THEN** the orchestrator does not run `@verifier` and returns control for correction
