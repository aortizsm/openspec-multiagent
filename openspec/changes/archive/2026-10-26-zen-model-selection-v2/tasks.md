# Tasks

## 1. Update Embedded Pricing (lib.mjs)

- [ ] 1.1 Replace `ZEN_EMBEDDED_PRICING` with 29 official models (correct prices, monthly limits, display names) — verify `node --check scripts/lib.mjs` and count entries
- [ ] 1.2 Remove 8 stale model IDs from pricing — verify none of `minimax-m2.7`, `glm-5.1`, `grok-4.6`, `kimi-k2.6`, `qwen3.6-plus`, `qwen3.7-max`, `iceman-contributor-free`, `omen-alpha` remain
- [ ] 1.3 Fix `getZenModelDisplay` to use `entry.displayName` instead of `modelIdToDisplay` — verify display names match official branding (GPT 6 Luna, Claude Haiku 5.5, MiMo-V2.6-Flash)

## 2. Implement Arrow-Key Model Selector (lib.mjs)

- [ ] 2.1 Add `selectModelFromList(models, recommendedId, initialId)` with cursor-save ANSI rendering — verify table renders once, `▶` highlight moves on ↑↓ without re-render
- [ ] 2.2 Implement Enter → resolve selected modelId, Escape → resolve recommendedId — verify in TTY
- [ ] 2.3 Implement non-interactive fallback (`!isInteractive()` → return recommendedId) — verify `node -e "require('./lib.mjs').selectModelFromList([...])"` returns recommended
- [ ] 2.4 Ensure `updateHighlight` only touches 2 rows per keystroke — verify no console.log in navigation loop, only `process.stdout.write` with `\x1b[u` restore

## 3. Fix askText for Piped Input (lib.mjs)

- [ ] 3.1 Modify `askText` to read piped stdin when not interactive — verify `echo "ghp_test" | node scripts/setup.mjs` reads token
- [ ] 3.2 Keep TTY path using existing `ask()` — verify interactive prompt still works
- [ ] 3.3 100ms timeout for non-pipe non-TTY — verify fallback works

## 4. Integrate Model Selection into Setup Wizard (setup.mjs)

- [ ] 4.1 Add imports: `selectModelFromList`, `fetchZenData`, `getZenModelDisplay`, `parseZenEndpointTable`, `ZEN_EMBEDDED_PRICING`, `configureZenProvider`, `readJsonc`, `configCandidates`
- [ ] 4.2 Change `TOTAL_STEPS = 10` (match 10 step() calls)
- [ ] 4.3 Add Step 6 "Selecting models for OpenCode Go" after agent definitions, before CodeGraph
- [ ] 4.4 Implement `runModelSelection()` with helpers: `discoverAgentsWithModel()`, `selectModelForAgent()`, `selectModelsForAgents()`, `selectProviderModel()` — verify each ≤30 lines
- [ ] 4.5 Wrap main else branch in async IIFE `(async () => { ... })();` — verify no top-level await crash
- [ ] 4.6 Wrap `configureZenProvider` in try/catch with warning log — verify error doesn't crash setup

## 5. Documentation

- [ ] 5.1 Update `docs/CHANGELOG.md` with entry for this change
- [ ] 5.2 Update `docs/guides/setup-wizard.md` (if exists) or create entry in `docs/changes/`
- [ ] 5.3 Verify `README.md` reflects any new flags or behavior

## 6. Verification

- [ ] 6.1 Run `node --check scripts/lib.mjs scripts/setup.mjs` — both pass
- [ ] 6.2 Run `npm test` — 24/24 pass
- [ ] 6.3 Run `node scripts/setup.mjs --dry-run` — exit 0, no writes
- [ ] 6.4 Run `node scripts/setup.mjs --help` — shows help, exit 0
- [ ] 6.5 Run `echo "ghp_test" | node scripts/setup.mjs` — reaches model selection step, uses fallback
- [ ] 6.6 Manual TTY test: `node scripts/setup.mjs` → token → arrow-key selector works, highlight moves, Enter confirms, Escape falls back

## Workflow follow-up

- Archive the change after review requirements are satisfied
- Verify archived result with `openspec validate`
- Sync delta specs to main specs: `openspec sync zen-model-selection-v2`