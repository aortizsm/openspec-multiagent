## Why
The OpenCode Go (Zen) model selection feature was added to the setup wizard (`npm run setup`) as an interactive step that lets users pick models for each agent. After using it, the team considers it a bad idea: it adds network scraping, live pricing fetching, and interactive prompts that complicate installation and are not core to the multi-agent workflow.

## What Changes
Remove the Zen model selection feature entirely:
- Remove Step 6 "Selecting models for OpenCode Go" from `scripts/setup.mjs` and its helper functions (`runModelSelection`, `discoverAgentsWithModel`, `selectModelForAgent`, `selectModelsForAgents`, `selectProviderModel`)
- Remove all Zen-specific exports from `scripts/lib.mjs` (`ZEN_EMBEDDED_PRICING`, `ZEN_PROVIDER_FALLBACK`, `fetchZen*`, `parseZen*`, `getZenModelDisplay`, `selectModelFromList`, `configureZenProvider`, and related helpers)
- Remove specs `openspec/specs/model-selector/`, `openspec/specs/setup-wizard/`, `openspec/specs/zen-provider/`
- Remove `docs/changes/2026-10-26-zen-model-selection.md` and update `docs/CHANGELOG.md`

## Scope
- `scripts/setup.mjs` (modified: remove Zen step and helpers, adjust TOTAL_STEPS from 10 to 9)
- `scripts/lib.mjs` (modified: remove entire Zen model selection section)
- `openspec/specs/model-selector/spec.md` (deleted)
- `openspec/specs/setup-wizard/spec.md` (deleted)
- `openspec/specs/zen-provider/spec.md` (deleted)
- `docs/changes/2026-10-26-zen-model-selection.md` (deleted)
- `docs/CHANGELOG.md` (modified: remove zen-model-selection entry)

## Success Criteria
- `npm run setup` runs without the model selection step (9 steps instead of 10)
- `scripts/lib.mjs` no longer exports any Zen/model-selection symbols
- `scripts/setup.mjs` no longer imports Zen/model-selection symbols
- `npm test` passes
- No references to Zen model selection remain in non-archived code or docs
