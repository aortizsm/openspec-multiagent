# Spec Delta

## ADDED Requirements

### Requirement: Project TUI agent model selector
An initialized target project MUST provide an OpenCode TUI selector for assigning models to the bundled agent roles.

#### Scenario: Open the selector
- **WHEN** a user invokes `/agent-models` in a project initialized with the multi-agent toolkit
- **THEN** OpenCode displays the bundled agent roles and their current model assignments

#### Scenario: Show an unavailable current assignment
- **WHEN** a bundled role has a configured model that is absent from the current project's available model catalog
- **THEN** the selector still displays the configured model identifier and allows the user to choose an available replacement

### Requirement: Selector uses OpenCode's available model catalog
The selector MUST offer models OpenCode exposes as available in the current project location and MUST NOT use a separately hardcoded model list. It MUST offer available variants for subagents, but MUST NOT offer variants for `@architect`.

#### Scenario: List available models
- **WHEN** a user chooses an agent in the selector
- **THEN** the model choices match the models available to `/models` in that project location

#### Scenario: Offer supported subagent variants
- **WHEN** a user chooses a subagent whose selected model exposes variants
- **THEN** the selector allows choosing the default variant or one of the available variants for that subagent

#### Scenario: Do not offer an architect variant
- **WHEN** a user chooses `@architect`
- **THEN** the selector offers models without variants because the project default model does not persist a variant

#### Scenario: No available models
- **WHEN** OpenCode exposes no available models in the current project location
- **THEN** the selector explains that no models are available and does not change configuration

#### Scenario: Model catalog cannot be loaded
- **WHEN** OpenCode fails to load the model catalog for the current project location
- **THEN** the selector reports that models could not be loaded and does not change configuration

#### Scenario: Catalog loading state
- **WHEN** the selector is waiting for OpenCode's model catalog
- **THEN** it communicates that models are loading and does not allow an assignment to be saved until the catalog is ready

### Requirement: Persist model assignments in project configuration
The selector MUST save agent model assignments in a recognized configuration file within the current project and MUST NOT modify user-level OpenCode configuration.

#### Scenario: Assign a subagent model
- **WHEN** a user assigns a model to a bundled subagent
- **THEN** the project configuration records that model for the selected agent and unrelated configuration remains intact

#### Scenario: Keep changes project-local
- **WHEN** a user assigns a model through the selector
- **THEN** only configuration inside the current project is changed and user-level OpenCode configuration remains unchanged

#### Scenario: Cancel model selection
- **WHEN** a user cancels at any point before saving an assignment
- **THEN** the selector leaves project configuration unchanged

#### Scenario: Save fails
- **WHEN** the selected model cannot be safely persisted to project configuration
- **THEN** the selector reports that the assignment was not saved and leaves the existing configuration unchanged

#### Scenario: Confirm successful save
- **WHEN** a project-local assignment is persisted successfully
- **THEN** the selector reports success only after the write completes

### Requirement: Configure the primary session model
The selector MUST require confirmation before setting the project default model for `@architect`. The confirmation MUST state that this default applies to all primary agents in new sessions and does not change an already-open session.

#### Scenario: Assign the architect model
- **WHEN** a user assigns a model to `@architect`
- **THEN** the selector displays the primary-session effect and requires explicit confirmation before saving the project default model

#### Scenario: Confirm the architect model
- **WHEN** a user confirms the `@architect` model assignment
- **THEN** the project default model for all primary agents is updated for newly created sessions and the current session keeps its selected model

#### Scenario: Cancel the architect confirmation
- **WHEN** a user cancels the `@architect` confirmation
- **THEN** project configuration remains unchanged

### Requirement: Accessible TUI selection
The selector MUST use native OpenCode TUI dialogs and MUST keep keyboard navigation, visible selection, and textual status feedback available without relying on color alone.

#### Scenario: Navigate and cancel
- **WHEN** a user navigates or cancels any selector dialog
- **THEN** the current selection is visibly and textually identifiable, keyboard navigation works, and cancellation makes no configuration change

### Requirement: Bound configuration and catalog processing
The selector MUST enforce finite limits before parsing project configuration or building model and variant options, and MUST reject over-limit input without writing configuration.

#### Scenario: Project config exceeds parsing limits
- **WHEN** project configuration exceeds 1 MiB or has nesting deeper than 64 levels
- **THEN** the selector reports that the configuration exceeds safety limits and leaves the file unchanged

#### Scenario: Model catalog exceeds option limit
- **WHEN** the active project catalog contains more than 2,000 models
- **THEN** the selector reports that the catalog is too large and does not build options or change configuration

#### Scenario: Variant list exceeds option limit
- **WHEN** a selected subagent model exposes more than 256 variants
- **THEN** the selector reports that the variant list is too large and does not build options or change configuration
