# Spec Delta

## MODIFIED Requirements

### Requirement: Ask for each MCP individually

The system SHALL ask separately whether the user wants to configure:
- **filesystem** (read/write files in the project)
- **github** (PRs, issues, releases)

All questions SHALL default to "no". The order of questions SHALL be: filesystem, github. A `git` server MUST NOT be offered.

#### Scenario: Declining the default
- **WHEN** the user accepts the default answer for a server
- **THEN** that server is not configured and the step reports it as skipped

#### Scenario: Question order
- **WHEN** both servers are missing from the configuration
- **THEN** the questions are asked in the order filesystem, github

#### Scenario: No git server offered
- **WHEN** the MCP step runs
- **THEN** no question about a `git` server is asked and no `git` entry is written

### Requirement: check.mjs detects MCP servers

The preflight check (`check.mjs`) SHALL be able to detect whether the filesystem and github MCP servers are configured, reporting them as `ok` / `none` (optional, non-blocking). A `git` server MUST NOT be reported as an expected entry.

#### Scenario: Configured and missing servers
- **WHEN** `check.mjs` runs with some of the two servers configured
- **THEN** each one is reported as `ok` or `none` and a missing server does not make the check fail

#### Scenario: Entire step optional
- **WHEN** no MCP server is configured at all
- **THEN** the check still reports `status: READY`

#### Scenario: git is not reported
- **WHEN** `check.mjs` prints its report
- **THEN** no `git` MCP entry appears as configured or expected
