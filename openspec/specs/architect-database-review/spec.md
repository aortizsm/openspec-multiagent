# architect-database-review Specification

## Purpose
Defines how `@architect` reviews database tables and verifies expected record creation through read-only SQL using the target project's existing configuration and tools.

## Requirements

### Requirement: User-requested database review
When the user asks `@architect` to review a database table, `@architect` MUST attempt the requested read-only SQL review using the target project's existing database configuration and tooling instead of refusing generically or asking the user to run the query.

#### Scenario: User asks to inspect a table
- **WHEN** the user explicitly asks `@architect` to review a table in the configured database
- **THEN** `@architect` runs an appropriate read-only query and reports the findings without delegating the query to the user

#### Scenario: Database tooling is unavailable
- **WHEN** the requested review cannot run because the project has no usable database configuration, credentials, or query tool
- **THEN** `@architect` reports the specific blocker and the smallest actionable next step, without claiming a generic prohibition on SQL access

### Requirement: Verify expected database side effects
When an executed project process is expected to create database records, `@architect` MUST use read-only SQL to verify the relevant records when the project's existing database configuration and tooling are available.

#### Scenario: Process should create records
- **WHEN** a requested or delegated process completes and its expected behavior includes creating database records
- **THEN** `@architect` checks relevant logs and queries the affected records, then compares the observed state with the expected outcome

#### Scenario: Expected records are absent or inconsistent
- **WHEN** the query results do not match the expected records or relationships
- **THEN** `@architect` reports the observed evidence and identifies the remaining discrepancy instead of claiming success

### Requirement: Read-only database access and secret handling
`@architect` MUST limit its database inspection to read-only `SELECT` queries, safely handle query inputs, use the target project's existing configuration and tools, and avoid exposing credentials or unrelated sensitive data.

#### Scenario: Query does not modify data or schema
- **WHEN** `@architect` performs a database review
- **THEN** it executes only read-only `SELECT` statements and does not issue data-changing statements, DDL, stored-procedure execution, or install database tooling

#### Scenario: Credentials and query output are sensitive
- **WHEN** `@architect` loads database configuration or reports query results
- **THEN** it does not print secret values and limits reported rows and columns to evidence relevant to the requested verification, redacting sensitive fields when needed

#### Scenario: Query inputs come from untrusted sources
- **WHEN** table identifiers, filter values, or command arguments derive from a user request, logs, or other external input
- **THEN** `@architect` binds all untrusted filter values through the existing client's parameter-binding mechanism, validates identifiers against trusted project schema metadata and quotes them using that client's conventions, and never interpolates untrusted text into SQL or shell command strings; it pauses and reports a concrete blocker if the client cannot bind the values, and pauses if the query cannot otherwise be constructed safely

#### Scenario: Target connection is ambiguous
- **WHEN** the target database or environment cannot be identified reliably from the project configuration
- **THEN** `@architect` pauses and asks a focused clarification instead of guessing or connecting to an unintended database
