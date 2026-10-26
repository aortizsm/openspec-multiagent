# Proposal

## Why

The OpenCode Go model selection in the setup wizard had three critical issues:

1. **Stale pricing data**: The embedded pricing table contained 38 models with incorrect prices, "Plan-dependent" monthly limits, and 8 model IDs that no longer exist in the official OpenCode Go offering.
2. **Poor UX for model selection**: The wizard re-rendered the full model table for every agent selection (N+1 times) and used number-based input instead of an interactive arrow-key picker.
3. **Non-interactive environments broken**: Piped input (`echo "token" | node setup.mjs`) failed because `askText` only worked with TTY stdin.

## What Changes

- **Update `ZEN_EMBEDDED_PRICING`** in `scripts/lib.mjs`: 29 models matching the official opencode.ai Go plan, with real monthly limits (`$15/mo`–`$80/mo`), `null` for Beam Free (unlimited), context-dependent pricing using ≤X token prices as canonical, DeepSeek V4.1 Flash/Pro off-peak pricing, Gemini 4 Argon 50% discount through Nov 2026.
- **Remove 8 stale model IDs**: `minimax-m2.7`, `glm-5.1`, `grok-4.6`, `kimi-k2.6`, `qwen3.6-plus`, `qwen3.7-max`, `iceman-contributor-free`, `omen-alpha`.
- **Add `selectModelFromList()`** in `scripts/lib.mjs`: Interactive arrow-key selector (↑↓ navigate, Enter confirm, Esc cancel) that renders the table **once**, saves cursor with `\x1b[s`, and updates only the two affected rows on navigation (no full-table flicker).
- **Fix display names**: Use `entry.displayName` from embedded pricing instead of generating from model IDs (fixes "Gpt 6 Luna" → "GPT 6 Luna", "Claude Haiku 5 5" → "Claude Haiku 5.5", "Mimo" → "MiMo").
- **Integrate model selection into `setup.mjs`**: New Step 6 "Selecting models for OpenCode Go" that discovers agents with `model` fields in user config, lets each pick a model via the arrow-key selector, falls back to provider-level selection if no agents have models, and configures the `opencode-go` provider.
- **Wrap main body in async IIFE** to fix top-level await crash.
- **Split `runModelSelection()` into helpers** (≤30 lines each) to satisfy clean-code criteria.
- **Wrap `configureZenProvider` in try/catch** to prevent setup crash on provider config errors.
- **Fix `askText` to support piped stdin**: Reads all stdin data with 100ms timeout when not interactive.

## Capabilities

### Modified Capabilities
- `setup-wizard`: Model selection step now uses interactive arrow-key picker with official pricing data; supports non-interactive piped input.
- `zen-provider`: Embedded pricing updated to 29 official models with correct prices and monthly limits.

### New Capabilities
- `model-selector`: Reusable arrow-key model selection component (`selectModelFromList`) for any model list with pricing display.

## Impact

- **Files modified**: `scripts/lib.mjs`, `scripts/setup.mjs`, `scripts/install-agents.mjs` (unrelated --force flag), `docs/CHANGELOG.md`, `README.md`, `package.json`
- **Dependencies**: None new. Uses existing Node.js built-ins (readline, stdin raw mode, ANSI escapes).
- **Breaking changes**: None — model IDs match official list; removed IDs were already stale/non-functional.
- **Backwards compatibility**: Full — fallback to recommended model on cancel/non-interactive unchanged.