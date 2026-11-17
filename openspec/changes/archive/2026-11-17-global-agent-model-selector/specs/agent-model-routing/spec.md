# Spec Delta

## ADDED Requirements

### Requirement: Global selector availability
The `/agent-models` selector MUST be available across the current user's OpenCode projects after one global installation. Installation MUST NOT require a plugin copy in each project or modify the user's global `opencode.json` or `cli.json`.

#### Scenario: Selector available in another project
- **WHEN** the selector has been installed globally and the user opens a different project
- **THEN** the user can invoke `/agent-models` without installing the plugin in that project

#### Scenario: Initialize or install repeatedly
- **WHEN** the user initializes another project or repeats the global plugin installation
- **THEN** the global selector remains available without creating a project-local plugin copy

### Requirement: Assignments remain scoped to the active project
The selector MUST read and update the recognized OpenCode configuration for the active project, creating a project configuration when none exists, and MUST NOT store model assignments in user-global configuration.

#### Scenario: Update existing project configuration
- **WHEN** the active project already has a recognized OpenCode configuration
- **THEN** the selector updates the effective project configuration, preserves unrelated settings, and leaves global configuration unchanged

#### Scenario: Create missing project configuration
- **WHEN** the active project has no recognized OpenCode configuration
- **THEN** the selector creates a recognized configuration inside that project and stores the assignment there

#### Scenario: Keep projects independent
- **WHEN** the user assigns models in two different projects
- **THEN** each assignment is stored in its own project's configuration and changing one project does not change the other project's assignment
