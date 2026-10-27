# Spec Delta

## Purpose

Provides a robust, unified stdin input primitive that works reliably in TTY, piped, and headless environments without hanging after server restarts.

## ADDED Requirements

### Requirement: readInput primitive exists
The system SHALL expose a single internal `readInput()` function that reads user input from stdin regardless of whether stdin is a TTY, a pipe, or closed.

#### Scenario: TTY input
- **WHEN** stdin is a TTY and the user types text followed by Enter
- **THEN** `readInput()` returns the trimmed text

#### Scenario: Piped input
- **WHEN** stdin receives piped data ending with newline
- **THEN** `readInput()` returns the trimmed piped content

#### Scenario: Closed stdin (EOF)
- **WHEN** stdin is closed or at EOF with no data
- **THEN** `readInput()` returns `null` immediately

#### Scenario: Timeout on non-interactive non-pipe
- **WHEN** stdin is neither TTY nor has piped data available
- **THEN** `readInput()` returns the configured fallback after a short timeout instead of hanging indefinitely

### Requirement: Input functions delegate to readInput
`ask`, `askText`, and `askYesNo` SHALL all delegate to `readInput()` instead of implementing their own raw-mode or readline logic.

#### Scenario: Consistent behavior across input functions
- **WHEN** any input function is called in a non-TTY environment
- **THEN** all three behave identically: read piped data or return fallback/null without hanging

### Requirement: selectModelFromList detects cursor support
The arrow-key model selector SHALL test whether DECSC/DECRC cursor save/restore is supported before using it.

#### Scenario: Cursor support available
- **WHEN** the terminal honors `\x1b[s`/`\x1b[u`
- **THEN** `selectModelFromList` uses cursor-based row updates (no full re-render)

#### Scenario: Cursor support unavailable
- **WHEN** the terminal does not honor DECSC/DECRC
- **THEN** `selectModelFromList` falls back to number-based selection via `askChoice` or similar