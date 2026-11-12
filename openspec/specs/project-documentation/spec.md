# project-documentation Specification

## Purpose
Define the human-facing documentation produced by the workflow: which artifacts exist, their structure, the sources from which they are derived, who writes and reviews them, and when they are required before archiving a change.

## Requirements

### Requirement: Fixed documentation structure

The repository MUST maintain a `docs/` directory with this structure: `docs/CHANGELOG.md` as a chronological index, `docs/changes/YYYY-MM-DD-<change>.md` with one entry per archived change, and `docs/guides/<capability>.md` with a usage guide for each capability.

#### Scenario: Archived change has an entry
- **WHEN** a change is archived
- **THEN** `docs/changes/<date>-<change>.md` exists along with a line in `docs/CHANGELOG.md` linking to that entry

#### Scenario: Capability has a guide
- **WHEN** a capability is synchronized to `openspec/specs/`
- **THEN** `docs/guides/<capability>.md` exists or is created to explain how it is used

### Requirement: Change entry derived from artifacts

Each `docs/changes/` entry MUST be derived from the change artifacts—`proposal.md`, `design.md`, `tasks.md`, the diff, and the `@verifier` report—and MUST cover: context, what changed, why, how to use it, impact or migration, and verification evidence. It MUST NOT invent behavior that is not in the diff or the spec.

#### Scenario: Complete entry
- **WHEN** an entry for an archived change is written
- **THEN** it contains all six sections, and each behavioral claim can be traced to the diff, the spec, or the verifier report

#### Scenario: No material for a section
- **WHEN** the change has no migration impact
- **THEN** the entry states that explicitly instead of omitting or filling in the section

### Requirement: Documentation as a change task

When a change alters behavior, configuration, or usage, its `tasks.md` MUST include a documentation task. The task MUST be performed by `@developer` and MUST be part of the same diff as the change.

#### Scenario: User-visible change
- **WHEN** a change adds or modifies an agent, permission, command, or gate
- **THEN** the change includes a documentation task and the corresponding entry in `docs/`

#### Scenario: Invisible change
- **WHEN** a change is an internal refactor with no observable effect
- **THEN** it does not require a changelog entry, but the decision to omit one is recorded in `tasks.md`

### Requirement: Documentation accuracy review

The `@code-reviewer` MUST verify that the documentation matches the diff, including file names, commands, paths, and described behavior. The reviewer MUST NOT evaluate style, tone, or wording.

#### Scenario: Outdated documentation
- **WHEN** the diff renames a file or changes a command while the documentation retains the previous name
- **THEN** the `@code-reviewer` marks it as `CRITICAL`

#### Scenario: Inaccurate documentation
- **WHEN** the documentation describes behavior that the diff does not implement
- **THEN** the `@code-reviewer` marks it as `WARNING` and requests a correction to the documentation or code

### Requirement: Documentation gate before archiving

The `@architect` MUST NOT archive a change that alters behavior or usage without a changelog entry and an updated guide for the affected capability. Missing documentation is a blocking reason, not an observation.

#### Scenario: Entry is missing
- **WHEN** a change has been verified but has no entry in `docs/`
- **THEN** the `@architect` does not archive and returns the documentation task to the `@developer`

#### Scenario: Documentation-only change
- **WHEN** a change updates documentation only
- **THEN** the gate is satisfied by the change's own entry and does not require a new guide

### Requirement: Documentation language

Documentation in `docs/` MUST be written in Spanish unless the user explicitly requests another language for an individual document; that document MUST use the requested language, and the rest of `docs/` MUST retain Spanish as the default. OpenSpec specs and `README.md` MUST remain in English.

#### Scenario: Spanish change entry
- **WHEN** a `docs/changes/` entry is written without a different language request
- **THEN** the text is in Spanish, with file names and commands in their literal form

#### Scenario: OpenSpec spec in English
- **WHEN** a delta is synced during archive
- **THEN** the resulting spec in `openspec/specs/` is in English

#### Scenario: Requested alternate language for an individual document
- **WHEN** the user explicitly requests another language for an individual document
- **THEN** that document uses the requested language, and the rest of `docs/` retains Spanish as the default
