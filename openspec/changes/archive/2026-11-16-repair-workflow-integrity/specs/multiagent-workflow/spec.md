# Spec Delta

## ADDED Requirements

### Requirement: Correction allowance is declared per change
The automatic orchestrator MUST resolve the correction allowance for a change from the change's own OpenSpec configuration, accepting both `correction_rounds` and the OpenSpec extension spelling `x-correction_rounds` in `openspec/changes/<name>/.openspec.yaml`, and MUST default to one attempt when the change declares neither. It MUST NOT key any allowance on a change name.

#### Scenario: Declared allowance is used
- **WHEN** a change declares a valid `correction_rounds` value greater than one and its findings require correction
- **THEN** the orchestrator runs correction bundles and quality reruns up to the declared allowance before stopping

#### Scenario: Change declares no allowance
- **WHEN** a change has no `correction_rounds` in its configuration
- **THEN** the orchestrator allows exactly one correction attempt

#### Scenario: Declared allowance is invalid
- **WHEN** the configuration declares a value that is not a positive integer
- **THEN** the orchestrator fails closed with a clear error before reading change files or starting an agent

#### Scenario: Extension spelling is accepted
- **WHEN** a change declares its allowance with the OpenSpec extension spelling `x-correction_rounds`
- **THEN** the orchestrator honours it exactly as it honours the unprefixed key

### Requirement: Distributed agent definitions match their source
The repository MUST keep `opencode/agents/<name>.md` as the only source of agent definitions: a project check or test MUST fail when an installed copy under `.opencode/agents/<name>.md` differs from its source, or when `.opencode/agents/` contains an installed definition with no matching source file.

#### Scenario: Installed copy drifts from its source
- **WHEN** an installed agent definition differs from the source definition
- **THEN** the project check or test fails and reports the drifted file

#### Scenario: Installed copies match their source
- **WHEN** every installed agent definition is byte-identical to its source definition and no installed definition lacks a source
- **THEN** the project check and test pass

#### Scenario: Installed definition has no source
- **WHEN** `.opencode/agents/` contains an agent definition with no matching file in `opencode/agents/`, for example after a source agent is renamed or removed
- **THEN** the project check or test fails and reports the orphan installed file

### Requirement: Agent prompts carry no bypass or change-specific directives
Distributed agent prompts MUST NOT instruct an agent to bypass its own permission policy, and MUST NOT embed directions that apply to one specific OpenSpec change.

#### Scenario: Prompt instructs bypassing permissions
- **WHEN** an agent prompt tells the agent to change files outside its allowed resources by another route
- **THEN** the prompt-integrity test fails

#### Scenario: Prompt embeds a change-specific directive
- **WHEN** an agent prompt contains a directive naming a single OpenSpec change
- **THEN** the prompt-integrity test fails

## MODIFIED Requirements

### Requirement: Architect consolidates actionable findings
After each quality phase, the `@architect` MUST send `@developer` one correction bundle that includes every distinct actionable finding and maps each to its source, severity, acceptance criterion, location, requested change, and closure evidence.

#### Scenario: Duplicate findings share a root cause
- **WHEN** multiple quality agents report the same underlying issue
- **THEN** the architect merges it into one bundle entry, lists every source, and preserves the highest severity

#### Scenario: Distinct findings remain separate
- **WHEN** findings concern different root causes or acceptance criteria
- **THEN** the architect keeps separate bundle entries and does not discard or silently merge them

#### Scenario: Verifier failure becomes actionable feedback
- **WHEN** `@verifier` reports a `FAIL` and the change's correction allowance is not yet exhausted
- **THEN** the architect adds the failed scenario and its evidence to the next correction bundle

### Requirement: Review findings stay traceable across rounds
The `@architect` MUST keep a review findings ledger in the change's `tasks.md`; each entry MUST have a stable ID, source agent(s), severity, linked acceptance criterion or scenario, file/location, requested correction, status (`open`, `resolved`, or `not adopted`), and closure evidence or rationale. Resolved findings MUST NOT reopen without new evidence; a declined `SUGGESTION` MUST retain its rationale and MUST NOT block archive.

#### Scenario: Finding is resolved with evidence
- **WHEN** the developer supplies the requested correction and evidence
- **THEN** the architect marks that finding resolved and carries its status into the next review round

#### Scenario: Resolved finding has no new evidence
- **WHEN** a reviewer repeats a resolved finding without new evidence
- **THEN** the architect does not reopen it

#### Scenario: Optional suggestion is declined
- **WHEN** the developer declines a `SUGGESTION`
- **THEN** the architect records the rationale without treating it as a blocking finding

#### Scenario: Ledger section has no findings
- **WHEN** the `## Review Findings` section of a change's `tasks.md` records no findings and contains no line bounded by pipe delimiters, so it holds no ledger table
- **THEN** the ledger is treated as empty and archive is not blocked by it

#### Scenario: Ledger section holds prose without a table
- **WHEN** the section records no findings but a prose sentence inside it contains a pipe character
- **THEN** the ledger is still treated as empty, because only lines bounded by pipe delimiters are read as table rows

#### Scenario: Ledger row or header is malformed
- **WHEN** the `## Review Findings` section contains a table row whose header is not the ledger header, or a row that cannot be read as a finding entry
- **THEN** the orchestrator fails closed and reports the ledger inconsistency instead of treating the section as empty

#### Scenario: Ledger section appears more than once
- **WHEN** a change's `tasks.md` contains more than one `## Review Findings` section
- **THEN** the orchestrator fails closed and reports the duplicate ledger section instead of reading only the first one
