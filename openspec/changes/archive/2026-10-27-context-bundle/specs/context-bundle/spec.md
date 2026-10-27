# Spec Delta

## Purpose

Generates a single-file context bundle of an OpenSpec change for agent handoff, eliminating manual assembly of proposal, design, tasks, spec, and diff.

## ADDED Requirements

### Requirement: Bundle emits all change artifacts
The context-bundle script SHALL read proposal.md, design.md, tasks.md, and spec.md from a change directory and concatenate them into one Markdown document.

#### Scenario: Complete artifact bundle
- **WHEN** context-bundle runs with a valid change name
- **THEN** output contains proposal, design, tasks, and spec sections in order

### Requirement: Bundle includes git diff
The context-bundle script SHALL include the `git diff` of the change's working tree changes in the output bundle.

#### Scenario: Diff included
- **WHEN** the change has uncommitted working tree changes
- **THEN** output contains a `## Git Diff` section with the diff content

### Requirement: Bundle fails fast on missing change
The context-bundle script SHALL exit with a non-zero code if the change directory does not exist.

#### Scenario: Missing change directory
- **WHEN** context-bundle runs with a non-existent change name
- **THEN** script prints an error message and exits with code 1