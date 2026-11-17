# agent-model-routing Specification

## Purpose

Provide maintainers with a reusable, credential-free OpenCode example for assigning provider/model choices to this repository's agent roles on a per-project basis.

## Requirements

### Requirement: Non-active per-agent model template
The repository MUST provide `opencode.models.example.jsonc` as a non-active template with a primary-session default and explicit provider/model assignments for all bundled subagents. The template MUST contain no credentials and MUST NOT be loaded automatically.

#### Scenario: Recommended mapping covers every bundled agent
- **WHEN** a maintainer inspects the example
- **THEN** its primary-session default is `opencode-go/mimo-v2.6-flash`; all eight subagent IDs are mapped, with MiMo for developer, test-engineer, verifier, ux-designer, repo-scout, and diff-summarizer, and GLM-5.3-Flash for code-reviewer and security-reviewer

#### Scenario: Example remains inactive until copied
- **WHEN** `opencode.models.example.jsonc` remains under that example filename
- **THEN** OpenCode does not load it as project configuration

#### Scenario: Template contains no provider credentials
- **WHEN** the example is inspected
- **THEN** it contains model identifiers only and no API keys, tokens, or other credentials

### Requirement: Model template usage is documented
The README and agent workflow guide MUST explain how to copy the example to a recognized project config path, connect the provider separately, and distinguish per-agent model limits from a global spending cap.

#### Scenario: User activates the template in a project
- **WHEN** a user copies the example to `opencode.jsonc` or `.opencode/opencode.jsonc` in a target project
- **THEN** the project config sets the default session model and per-agent model overrides without replacing globally installed agent prompts or permissions

#### Scenario: Go credentials and limits are explained
- **WHEN** the usage guidance is read
- **THEN** it directs the user to connect Go through OpenCode and states that model limits are per model and Extra Usage may permit pay-as-you-go charges beyond included limits

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
