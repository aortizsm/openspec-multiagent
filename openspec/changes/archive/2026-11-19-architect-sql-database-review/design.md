# Design

## Context

`@architect` already has broad shell execution permission and is allowed to run read-only verification, but its prompt does not describe SQL table review. This repository has no database integration of its own. The capability must therefore rely on each target project's existing environment configuration and database client; see proposal.md and specs/architect-database-review/spec.md.

## Goals / Non-Goals

**Goals:**
- Make an explicit user request to review a database table lead to an attempted SQL inspection rather than a generic refusal or handoff to the user.
- Have `@architect` check expected database side effects after processes that should create records.
- Keep inspection read-only, bound to the project's configured connection, and safe for credentials and returned data.

**Non-Goals:**
- Add a database MCP server, database driver, runtime code, or database permissions for other agents.
- Let `@architect` mutate data/schema or install/configure database tooling.
- Guarantee a query can run when the target project lacks a usable connection or client.

## Decisions

1. **Use existing target-project connection and client.** `@architect` will inspect the project's established scripts/configuration and use its available database CLI or existing project tooling, including for SQL Server when that is the configured database. This avoids coupling the toolkit to one engine or adding a dependency. It must not print `.env` values or place secrets in diagnostic output.
2. **Use explicit and inferred verification triggers.** A direct user request to review a table is sufficient authorization for the read-only query; no routine confirmation is needed. When a process is expected to create records, `@architect` will inspect relevant logs and verify those records against the expected outcome.
3. **Enforce read-only and safe-input boundaries.** Query only with `SELECT`; do not issue DML, DDL, stored-procedure execution, or commands with write effects. Bind all untrusted filter values through the existing client's parameter-binding mechanism; if it cannot bind them, pause instead of interpolating. Derive identifiers from trusted project schema metadata and quote them with the existing client; never interpolate untrusted text into SQL or shell command strings. Select only rows/columns needed to establish the outcome and redact sensitive values in reports.
4. **Fail with concrete blockers, not blanket denials.** If configuration/client is unavailable, report the exact missing prerequisite and a practical next step. If the target database cannot be identified from project context, ask a focused question rather than guessing. Do not delegate the SQL query back to the user when the architect can run it.
5. **Keep implementation scoped to agent guidance and documentation.** Update `opencode/agents/architect.md`, add regression coverage for the prompt contract using existing test conventions, and update user-facing docs. Existing `shell *` permission is sufficient; no permission or orchestrator changes are required.

## Risks / Trade-offs

- [Project credentials may point at an unintended database] → Use only the project's explicit active configuration; ask if the target is ambiguous and never guess a connection.
- [Identifiers or filters derived from user text/logs may alter query scope] → Bind all untrusted values, pause when the existing client cannot bind them, validate identifiers against trusted schema metadata, quote with the existing client, and avoid SQL or shell interpolation.
- [Query output may contain sensitive information] → Restrict selected columns and rows to relevant evidence; redact secrets and unnecessary personal data.
- [A project may not have a query client available] → Report the concrete blocker and available project-supported alternative; do not install tooling automatically.

## Migration Plan

No data or runtime migration is needed. Updated source prompts take effect when agents are reinstalled or copied into the target OpenCode agent directory using the existing installation workflow.

## status

Design ready for user approval.

## executive_summary

`@architect` will use existing project database configuration and tooling for user-requested table reviews and verification of expected record creation. SQL access remains read-only, and failures must identify an actual configuration/tooling blocker rather than claim a blanket prohibition.

## artifacts

- `openspec/changes/architect-sql-database-review/proposal.md`
- `openspec/changes/architect-sql-database-review/specs/architect-database-review/spec.md`
- `openspec/changes/architect-sql-database-review/design.md`
- `openspec/changes/architect-sql-database-review/tasks.md`
- `opencode/agents/architect.md`, prompt regression tests, README, and Spanish user documentation (implementation scope)

## risks

Credentials may target an unintended environment, and query results may contain sensitive data. Mitigations: use only the configured target, ask when it is ambiguous, limit query scope, redact secrets, and never perform database writes.

## next_recommended

After approval, implement the prompt and documentation changes, add regression coverage, run the full quality sequence, and independently verify the read-only scenarios.
