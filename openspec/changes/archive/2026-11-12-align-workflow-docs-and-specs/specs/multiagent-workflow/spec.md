# Spec Delta

## ADDED Requirements

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

### Requirement: Fast architect route is retired
The project MUST NOT ship or install an `@fast-architect` agent; all changes use the standard `@architect` agent. The full review and verification gates describe standard full runs starting at `@developer`. An explicit `--from <agent>` resume may start later and currently does not verify completion of earlier required gates; the approved follow-up change will harden this path.

#### Scenario: Fresh agent installation
- **WHEN** the repository's agent definitions are installed
- **THEN** no `fast-architect.md` agent definition is installed

#### Scenario: Resume override starts after earlier quality gates
- **WHEN** the orchestrator is invoked with `--from <agent>` for a later stage
- **THEN** it may resume without verifying completion of earlier required gates; hardening this path remains in the approved follow-up change
