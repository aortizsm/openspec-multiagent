# Configure MCP Servers in the Installer Specification

## Purpose

Let the project installer (`setup.mjs`) ask whether to configure the filesystem and github MCP servers, and write the accepted entries into the OpenCode configuration.

## Requirements

### Requirement: Optional MCP step in setup.mjs

`setup.mjs` SHALL include an optional step to configure MCP servers. The step MUST NOT run by default; the user MUST accept it explicitly for each server. In non-interactive environments (CI), the step MUST be skipped. The system MUST support a `--no-mcp` flag to skip the step entirely.

#### Scenario: Step disabled by flag
- **WHEN** `setup.mjs` runs with `--no-mcp`
- **THEN** no MCP question is asked and the step reports `skipped (--no-mcp)`

#### Scenario: Non-interactive environment
- **WHEN** stdin is not a terminal
- **THEN** no server is configured and no prompt is written

#### Scenario: Explicit acceptance per server
- **WHEN** the user accepts one server and declines another
- **THEN** only the accepted entry is written

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

### Requirement: GitHub token

If the user accepts configuring github, the system SHALL prompt for the `GITHUB_TOKEN` (Personal Access Token) during installation. The system SHALL write it under `env.GITHUB_TOKEN` in the MCP entry.

#### Scenario: Token provided
- **WHEN** the user accepts github and enters a token
- **THEN** the entry is written with `env.GITHUB_TOKEN` set to that value

#### Scenario: Empty token
- **WHEN** the user accepts github but leaves the token empty
- **THEN** the github server is skipped and no entry is written

### Requirement: Write entries in opencode.json

Each accepted MCP entry SHALL be written in `~/.config/opencode/opencode.json` under `mcp.servers.<name>`, in V2 form (`type: local`, `command: [...]`). For github, the entry MUST include `env: { GITHUB_TOKEN: <token> }`.

#### Scenario: V2 entry shape
- **WHEN** the filesystem server is accepted
- **THEN** its entry is written under `mcp.servers.filesystem` as a local server whose command runs `@modelcontextprotocol/server-filesystem` with the project directory

#### Scenario: Existing configuration is preserved
- **WHEN** the configuration already contains unrelated keys or servers
- **THEN** they are kept and only the accepted entries are added

### Requirement: Do not overwrite existing entries

If an MCP already has an entry in the config, the system SHALL show that it is already configured and MUST NOT overwrite it.

#### Scenario: Server already configured
- **WHEN** a server already has an entry in the configuration
- **THEN** the installer reports it as already configured, asks nothing and leaves the entry unchanged

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
