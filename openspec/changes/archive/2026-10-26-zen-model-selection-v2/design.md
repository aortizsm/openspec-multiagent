# Design

## Context

See `proposal.md` - Why for motivation. Current state:
- `scripts/lib.mjs` contains `ZEN_EMBEDDED_PRICING` (38 models, stale data), `selectZenModelForAgent` (number-based, re-renders table per agent), `askText` (TTY-only), `getZenModelDisplay` (generates display names from model IDs).
- `scripts/setup.mjs` has 6 steps, no model selection, top-level await causes crashes.
- No existing `setup-wizard` or `zen-provider` specs in main specs.

## Goals / Non-Goals

**Goals:**
- Update pricing to 29 official models with correct prices/limits
- Add interactive arrow-key model selector (`selectModelFromList`)
- Integrate model selection as Step 6 in setup wizard
- Support piped stdin for non-interactive environments
- Keep all functions ≤30 lines (clean-code criterion #2)
- Fix top-level await with async IIFE

**Non-Goals:**
- HTML scraping (page is JS SPA, `/inference/go/v1/models` returns IDs only)
- External dependencies (zero deps, Node built-ins only)
- Changing model selection for providers other than OpenCode Go

## Decisions

### 1. Embedded pricing over HTML scraping
**Decision**: Hardcode 29 models in `ZEN_EMBEDDED_PRICING`.
**Rationale**: Official page is a React SPA; API returns only model IDs without pricing. Embedded data is the single source of truth.
**Alternative considered**: Scrape HTML — rejected (requires JS rendering, brittle).

### 2. Cursor-save ANSI for non-flickering selector
**Decision**: Render table once with `console.log`, save cursor with `\x1b[s` (DECSC), then on navigation restore cursor `\x1b[u` (DECRC) and update only the two affected rows.
**Rationale**: Zero dependencies, works in any VT100-compatible terminal, eliminates full-table re-render on every keystroke.
**Alternative considered**: Full re-render with `console.clear()` — rejected (flicker, slow). Library like `ink`/`prompts` — rejected (adds dependency).

### 3. `selectModelFromList` signature: `(models, recommendedId, initialId)`
**Decision**: Three parameters — model list, fallback on cancel, initial highlight position.
**Rationale**: Allows pre-selecting a different model than the fallback (e.g., user's previous choice). Default `initialId = recommendedId` maintains backward compatibility.

### 4. `askText` dual-mode: TTY readline + piped stdin read
**Decision**: If interactive, use existing `ask()` with readline. If not, read all stdin with 100ms timeout.
**Rationale**: Supports `echo "token" | node setup.mjs` for CI/automation while preserving interactive behavior.
**Alternative considered**: Always use readline — rejected (fails on piped input).

### 5. `runModelSelection` split into helpers
**Decision**: Extract `discoverAgentsWithModel()`, `selectModelForAgent()`, `selectModelsForAgents()`, `selectProviderModel()`.
**Rationale**: Keeps `runModelSelection` ≤30 lines (clean-code #2). Each helper has single responsibility.

### 6. Async IIFE wrapper for top-level await
**Decision**: Wrap entire `else` branch in `(async () => { ... })();`.
**Rationale**: Fixes "unsettled top-level await" without restructuring the whole script. Preserves existing step flow.

### 7. Try/catch around `configureZenProvider`
**Decision**: Wrap provider config in try/catch, log warning on error.
**Rationale**: Prevents setup crash if JSON config has comments or is malformed. User can re-run step manually.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| ANSI cursor save/restore not supported in some terminals | Fallback: `isInteractive()` checks TTY; non-TTY returns recommended immediately. Most modern terminals support DECSC/DECRC. |
| Piped stdin timeout too short/long | 100ms is conservative; if stdin has data it arrives immediately. If no pipe, timeout fires fast. |
| Embedded pricing drifts from official | Manual update process documented; prices change infrequently. Could add `openspec check` validation later. |
| `selectModelFromList` assumes VT100 escapes | Only used when `isInteractive()` is true (TTY). Non-TTY paths never call it. |
| 100ms timeout may race with slow input | `process.stdin.on('data')` accumulates; `end` fires when pipe closes. Timeout only for non-pipe non-TTY. |
| Stale model IDs in `ZEN_PROVIDER_FALLBACK` | Not updated in this change (out of scope). Map maps model IDs to SDK packages; if a removed ID is in the map, it won't be selected since it's not in the model list. |