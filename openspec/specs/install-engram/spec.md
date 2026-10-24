# Install Engram Automatically Specification

## Purpose

Let the project installer (`setup.mjs`) download and install the Engram binary as an optional step, also writing the MCP entry into the OpenCode configuration.

## Requirements

### Requirement: Optional Engram step in setup.mjs

`setup.mjs` SHALL include an optional step to install Engram. The step MUST NOT run by default; the user MUST accept it explicitly. In non-interactive environments (CI), the step MUST be skipped.

#### Scenario: Default answer
- **WHEN** the user runs `setup.mjs` and accepts the default answer to the Engram question
- **THEN** Engram is not installed and the step reports itself as skipped

#### Scenario: Explicit acceptance
- **WHEN** the user answers yes to the Engram question
- **THEN** `install-engram.mjs` runs and the outcome is reported

#### Scenario: Non-interactive environment
- **WHEN** stdin is not a terminal
- **THEN** the question is not asked and the step is skipped

#### Scenario: Step disabled by flag
- **WHEN** `setup.mjs` runs with `--no-engram`
- **THEN** the step is not offered and reports `skipped (--no-engram)`

### Requirement: Detect prior Engram installation

The system SHALL check whether `engram` is already available, on `PATH` or via `ENGRAM_BIN`, before attempting a download. If it is installed, the system MUST report that it exists and MUST NOT reinstall it.

#### Scenario: Binary on PATH
- **WHEN** the `engram` binary resolves on `PATH`
- **THEN** no download happens and the reported binary is the one on `PATH`

#### Scenario: Binary pointed at by ENGRAM_BIN
- **WHEN** `ENGRAM_BIN` holds a path to an existing binary
- **THEN** that path is used for the MCP entry and no download happens

#### Scenario: Binary missing
- **WHEN** no `engram` is found on `PATH`, in `ENGRAM_BIN` or at the default install location
- **THEN** the download path runs before the MCP entry is written

### Requirement: Download from GitHub releases

When the user accepts installing Engram, the system SHALL download the binary from the releases of https://github.com/Gentleman-Programming/engram. Only Linux is supported.

#### Scenario: Architecture-specific asset
- **WHEN** the download runs on Linux
- **THEN** the system requests the release asset matching the host architecture (`engram-linux-amd64.tar.gz` or `engram-linux-arm64.tar.gz`)

#### Scenario: Download failure
- **WHEN** the download or extraction fails
- **THEN** the installer reports the failure, does not write a broken MCP entry, and suggests installing by hand

### Requirement: Install the binary

The downloaded binary SHALL be extracted and installed at `~/.local/bin/engram` by default. The system MUST make the binary executable.

#### Scenario: Default install location
- **WHEN** the download completes
- **THEN** the binary is placed at `~/.local/bin/engram` with execute permission

#### Scenario: PATH does not include the install directory
- **WHEN** `~/.local/bin` is not on `PATH`
- **THEN** the installer warns that OpenCode will not resolve the bare `engram` command and points to `PATH` or `ENGRAM_BIN`

### Requirement: MCP entry in OpenCode

After installing, or when it was already installed, the system SHALL write the `engram` entry under `mcp.servers` in the OpenCode configuration (`~/.config/opencode/opencode.json`), in V2 form (`type: local`, `command: [engram, mcp]`).

#### Scenario: Existing configuration is preserved
- **WHEN** the OpenCode configuration already contains other MCP servers
- **THEN** the `engram` entry is added and the other entries stay untouched

#### Scenario: Project-local configuration
- **WHEN** `install-engram.mjs` runs with `--project`
- **THEN** the entry is written to `opencode.json` in the current directory instead of the user configuration

#### Scenario: JSONC file with comments
- **WHEN** the target configuration contains comments
- **THEN** the installer refuses to rewrite it and prints the block to add by hand

#### Scenario: Removing the entry
- **WHEN** `install-engram.mjs` runs with `--remove` and the entry exists
- **THEN** the entry is deleted and the remaining configuration is kept

### Requirement: Supported platform

This functionality MUST be implemented only for Linux. On other operating systems, the step MUST be skipped or the user MUST be informed that it is not supported.

#### Scenario: Non-Linux host
- **WHEN** `setup.mjs` runs on macOS or Windows
- **THEN** the Engram step is skipped with a message that installation is only supported on Linux
