# setup-wizard Specification

## Purpose
Adds a model selection step to the OpenCode setup wizard that lets users pick OpenCode Go models for each agent using an interactive arrow-key selector with official pricing data.

## Requirements

### Requirement: Setup wizard includes model selection step
The setup wizard SHALL include a step "Selecting models for OpenCode Go" that runs after agent definitions are installed and before CodeGraph installation.

#### Scenario: Model selection step executes
- **WHEN** setup runs in non-dry-run mode
- **THEN** Step 6 "Selecting models for OpenCode Go" is executed

#### Scenario: Dry-run reports model selection
- **WHEN** setup runs with `--dry-run`
- **THEN** step prints "[dry-run] would show model selector" and continues

### Requirement: Agent-specific model selection
For each agent in the user's OpenCode config that has a `model` field, the wizard SHALL prompt the user to select a model using the interactive arrow-key selector.

#### Scenario: Agent with model field
- **WHEN** user config has agent "architect" with model field
- **THEN** wizard prompts "Select model for architect" with GPT 6 Luna as recommended

#### Scenario: Agent without model field uses provider default
- **WHEN** no agents have model fields in config
- **THEN** wizard prompts once for provider model with Mimo V2.6 Flash as recommended

### Requirement: Model selection uses official pricing data
The selector SHALL display 29 models matching the official OpenCode Go plan with correct prices, monthly limits, and display names.

#### Scenario: 29 official models displayed
- **WHEN** model selector renders
- **THEN** exactly 29 models from opencode.ai/v2/docs/console/go are shown with prices and limits

#### Scenario: Stale model IDs removed
- **WHEN** model selector renders
- **THEN** models `minimax-m2.7`, `glm-5.1`, `grok-4.6`, `kimi-k2.6`, `qwen3.6-plus`, `qwen3.7-max`, `iceman-contributor-free`, `omen-alpha` are NOT shown

### Requirement: Provider configuration after model selection
After models are selected, the wizard SHALL configure the `opencode-go` provider with the selected models and API key.

#### Scenario: Provider configured with selected models
- **WHEN** model selection completes with one or more models
- **THEN** `configureZenProvider` is called with the selected model IDs
