# auto-rollback Specification

## Purpose
Automatically create a git checkpoint before each pipeline phase and rollback to it on failure, so a failed phase does not leave a partially-modified working tree.

## Requirements

### Requirement: Checkpoint before each phase
The rollback script SHALL create a git commit with the phase name before each pipeline phase executes.

#### Scenario: Save checkpoint
- **WHEN** rollback runs before a pipeline phase
- **THEN** a git commit is created with message `rollback: checkpoint before <phase>`

### Requirement: Rollback on phase failure
The rollback script SHALL restore the working tree to the last checkpoint when a pipeline phase fails.

#### Scenario: Restore checkpoint on failure
- **WHEN** a pipeline phase fails after a checkpoint was saved
- **THEN** the working tree is reset to the checkpoint commit

### Requirement: Fail fast on missing git repo
The rollback script SHALL exit with a non-zero code if not inside a git repository.

#### Scenario: Not a git repo
- **WHEN** rollback runs outside a git repository
- **THEN** script prints an error and exits with code 1
