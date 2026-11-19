# Proposal

## Intent

Enable `@architect` to perform SQL-based verification of database effects itself when the user requests a table review or a process is expected to create records.

## Why

Today, `@architect` may run shell commands but its prompt does not authorize or guide database inspection, so it can incorrectly refuse SQL checks and ask the user to run queries. This prevents the architect from validating records produced by an executed process and reporting evidence from the configured project database.

## What Changes

- Define `@architect` behavior for user-requested table reviews and database verification after record-creating processes.
- Require read-only SQL queries against the project's existing database configuration and tooling; prohibit data/schema mutations and exposing credentials.
- Require the architect to report query findings or a concrete connection/tool blocker instead of refusing generically or delegating the query to the user.
- Document the capability and its safe operating boundary.

## Capabilities

### New Capabilities
- `architect-database-review`: Read-only SQL inspection by `@architect` for user-requested reviews and verification of expected database side effects.

### Modified Capabilities

None.

## Impact

- Agent prompt: `opencode/agents/architect.md`.
- Durable behavior spec: `architect-database-review`.
- Human-facing workflow documentation and changelog.
- No new database service, MCP server, runtime dependency, or permission grant is proposed; the architect already has shell access and should use project-provided database configuration and tooling.
