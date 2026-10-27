## Status
Draft

## Executive Summary
Remove the OpenCode Go (Zen) model selection feature from the setup wizard and shared library. This deletes Step 6 of `npm run setup`, all Zen-specific exports from `lib.mjs`, and the associated specs and documentation. Setup goes from 10 steps to 9.

## Artifacts
- `openspec/changes/remove-zen-model-selection/proposal.md`
- `openspec/changes/remove-zen-model-selection/design.md`
- `openspec/changes/remove-zen-model-selection/tasks.md`
- `scripts/setup.mjs` (modified)
- `scripts/lib.mjs` (modified)
- `openspec/specs/model-selector/spec.md` (deleted)
- `openspec/specs/setup-wizard/spec.md` (deleted)
- `openspec/specs/zen-provider/spec.md` (deleted)
- `docs/changes/2026-10-26-zen-model-selection.md` (deleted)
- `docs/CHANGELOG.md` (modified)

## Design Decisions
- **Keep archived changes intact**: The archived changes `2026-10-26-zen-model-selection` and `2026-10-26-zen-model-selection-v2` in `openspec/changes/archive/` are not touched — they record historical work.
- **Only remove from active codebase**: Deletion targets `scripts/` (active code), `openspec/specs/` (active specs), and `docs/` (active docs).
- **`TOTAL_STEPS` reduced from 10 to 9**: The model selection step (was Step 6) is removed; subsequent steps (CodeGraph, Engram, MCP servers, Preflight) keep their relative order.
- **`httpsRequest` and `fetchJson` stay in `lib.mjs`**: They are general-purpose and used by non-Zen code (Engram release check, etc.).
- **Non-Zen utilities in `lib.mjs` stay**: `stripModelSuffixes`, `parsePrice`, `parseMonthlyLimit`, `deduplicatePricing`, `isCheaper`, `modelIdToDisplay` are only used by Zen code, so they are removed with the Zen section.

## Risks
- Other scripts may import symbols being removed — verified via grep: only `setup.mjs` imports Zen symbols from `lib.mjs`.
- `check.mjs` may have setup-related tests — verified: tests cover `--help` and `--dry-run`, not Zen selection.
- Deleting specs may leave dangling references — verified: no other active spec references `model-selector`, `setup-wizard`, or `zen-provider`.

## Next Recommended
Implement the tasks in tasks.md.
