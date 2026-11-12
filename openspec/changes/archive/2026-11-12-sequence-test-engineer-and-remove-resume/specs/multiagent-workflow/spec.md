# Spec Delta

## REMOVED Requirements

### Requirement: Fast architect route is retired
**Reason**: The existing requirement combines agent retirement with the old unsafe partial-resume behavior; those contracts are replaced by separate requirements.
**Migration**: Use only the standard `@architect` workflow and restart the full orchestrator without `--from` after a failure.

## ADDED Requirements

### Requirement: Only standard architect workflow is distributed
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
