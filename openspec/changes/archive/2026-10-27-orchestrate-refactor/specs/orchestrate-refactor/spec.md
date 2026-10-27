# Spec Delta

## Purpose

Ensure the setup wizard orchestrator complies with clean-code line limits and avoids shell injection risks.

## ADDED Requirements

### Requirement: main function under 30 lines
The `main()` function SHALL be refactored into helper functions so no single function exceeds 30 lines.

#### Scenario: main function line count
- **WHEN** `main()` is inspected
- **THEN** it contains 30 lines or fewer

### Requirement: No shell:true in runCommand
The `runCommand` function SHALL not use `shell: true` when spawning processes.

#### Scenario: runCommand uses shell false
- **WHEN** `runCommand` is inspected
- **THEN** `shell` is not set to `true`

### Requirement: Change name validation
The `changeName` argument SHALL be validated before being used in any command.

#### Scenario: Invalid change name rejected
- **WHEN** `changeName` contains shell metacharacters
- **THEN** the script exits with an error