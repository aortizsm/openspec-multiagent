# Design

## Context

See `proposal.md` - Why for motivation. Current state in `scripts/lib.mjs`:
- `ask()` uses `process.stdin.setRawMode(true)` + `io().question()` (readline), with separate end/close handlers.
- `askText()` has dual code paths: TTY path uses `ask()`, non-TTY path reads piped stdin with 100ms timeout.
- `askYesNo()` builds on `ask()`.
- `selectModelFromList()` uses `\x1b[s`/`\x1b[u` (DECSC/DECRC) for cursor save/restore; no detection of whether the terminal supports it.
- Each function handles raw-mode setup/teardown independently, leading to duplication and inconsistent EOF/timeout behavior.

## Goals / Non-Goals

**Goals:**
- Single `readInput()` primitive handling TTY, piped, and closed stdin consistently.
- `ask`, `askText`, `askYesNo` all delegate to `readInput()`.
- `selectModelFromList` detects DECSC/DECRC support and falls back gracefully.
- No input function hangs indefinitely; all return fallback/null on EOF/timeout.
- All functions ≤30 lines (clean-code criterion #2).

**Non-Goals:**
- Fix the OpenCode `question` tool (environment issue, not repo code).
- Fix server restarts (environment issue).
- Add external dependencies (Node built-ins only).
- Change the public API signatures of `ask`, `askText`, `askYesNo`.

## Decisions

### 1. Single `readInput(question, options)` primitive
**Decision**: Extract all stdin reading into one function that returns `{ value: string | null, eof: boolean }`.
**Rationale**: Eliminates duplicated raw-mode/readline/pipe logic across 4 functions.
**Alternatives considered**: Keep 4 separate implementations (rejected — causes inconsistency).

### 2. `readInput` probes stdin type first
**Decision**: Check `isTTY` first. If TTY, use raw mode + data events. If not TTY, attempt to read all available piped data with a short timeout. If neither, return fallback immediately.
**Rationale**: TTY and pipe have fundamentally different semantics; probing avoids trying raw mode on a pipe.
**Alternatives considered**: Always try raw mode (rejected — throws on non-TTY).

### 3. `selectModelFromList` tests DECSC/DECRC at startup
**Decision**: Before using cursor save/restore, write `\x1b[s` then `\x1b[u` and check if cursor position is preserved. If not, fall back to number-based selection.
**Rationale**: Avoids silent breakage in terminals that don't honor DECSC/DECRC.
**Alternatives considered**: Always use cursor (rejected — breaks silently); never use cursor (rejected — loses the non-flickering UX we already built).

### 4. Timeout for non-pipe non-TTY
**Decision**: 100ms timeout when stdin is neither TTY nor has data. After timeout, return fallback.
**Rationale**: Prevents hanging in headless environments where stdin never closes but never produces data either.
**Alternatives considered**: No timeout (rejected — hangs forever); 5s timeout (rejected — too slow for CI).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `readInput` changes behavior subtly for existing callers | All callers (`ask`, `askText`, `askYesNo`) preserve their public signatures and return types |
| DECSC/DECRC detection adds complexity | Simple probe: write `\x1b[s`, move cursor, write `\x1b[u`, check if position changed |
| Raw mode not restored on error | `cleanup()` always calls `setRawMode(false)` in finally-equivalent logic |
| Piped stdin may not close (e.g., `cat` without EOF) | 100ms timeout prevents indefinite hang |

## Migration Plan

No migration needed — changes are internal to `lib.mjs`. Public API unchanged. Existing tests (`npm test`) should continue passing.

## Open Questions

None.