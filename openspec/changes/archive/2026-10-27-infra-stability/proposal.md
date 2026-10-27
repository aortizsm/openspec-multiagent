# Proposal

## Why

The setup wizard and model selection are fragile in non-interactive and restarted environments:

- `ask()` in `lib.mjs` fails or hangs when stdin is not a reliable TTY (pipes, CI, post-restart sessions).
- `askText()` has dual code paths (TTY vs piped) that can diverge after a server restart.
- `selectModelFromList()` assumes ANSI cursor save/restore (DECSC/DECRC) works in all terminals; if it doesn't, the highlight breaks silently.
- No centralized input abstraction: `ask`, `askText`, `askYesNo`, and `selectModelFromList` each handle stdin/raw-mode/EOF differently.

This makes the wizard unreliable after server restarts and in headless/CI contexts.

## What Changes

- **Unify input handling**: single `readInput()` primitive that wraps raw-mode TTY, piped stdin, and EOF with a consistent timeout/fallback.
- **Refactor `ask`, `askText`, `askYesNo`** to delegate to `readInput()`, removing duplicate stdin/raw-mode logic.
- **Make `selectModelFromList` resilient**: detect DECSC/DECRC support at startup; fall back to number-based selection if cursor save/restore is unavailable.
- **Add graceful degradation**: any input function that cannot read from stdin returns the configured fallback immediately instead of hanging.

## Capabilities

### New Capabilities
- `input-handling`: Robust, unified stdin reading with TTY/pipe/EOF support and fallback behavior.

### Modified Capabilities
- `setup-wizard`: Model selection and token prompts must not hang after server restart or in non-TTY environments.

## Impact

- `scripts/lib.mjs`: `ask`, `askText`, `askYesNo`, `selectModelFromList`, and a new internal `readInput` helper.
- `scripts/setup.mjs`: No API changes; benefits from more reliable `askText` for GITHUB_TOKEN prompt.
- No new dependencies. Node built-ins only.