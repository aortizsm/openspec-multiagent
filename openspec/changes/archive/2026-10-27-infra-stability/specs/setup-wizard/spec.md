# Spec Delta

## Purpose

Ensures the OpenCode setup wizard's input prompts (GITHUB_TOKEN, model selection) do not hang in non-TTY, piped, or post-restart environments.

## ADDED Requirements

### Requirement: Setup wizard GITHUB_TOKEN prompt does not hang
The setup wizard's `askText` call for GITHUB_TOKEN SHALL return the fallback value immediately when stdin is unavailable, instead of blocking forever.

#### Scenario: Non-interactive environment
- **WHEN** setup runs in a non-TTY environment with no piped input
- **THEN** `askText` returns the fallback (empty string) and the wizard proceeds to error handling rather than hanging

#### Scenario: Post-restart session
- **WHEN** setup runs after an OpenCode server restart where stdin state is uncertain
- **THEN** `askText` detects the stdin state and either reads available input or falls back without hanging

### Requirement: Model selection degrades gracefully
The interactive model selector SHALL fall back to a non-interactive mode when arrow-key navigation or cursor positioning is not available.

#### Scenario: No cursor save/restore support
- **WHEN** the terminal does not support DECSC/DECRC
- **THEN** `selectModelFromList` uses a simpler number-based or default-selection approach instead of failing silently