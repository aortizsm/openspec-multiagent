## Tasks

- [ ] Task 1: Add HTML scraper for Go pricing table (spec: spec.md → Scenario 1)
  - Add `fetchZenPricing()` async function to lib.mjs
  - Fetches HTML from `https://opencode.ai/v2/docs/console/go/`
  - Extracts content between `slot="go"` and `slot="go-plus"` markers
  - Parses markdown pipe table starting with `| Model` header
  - Strips model name suffixes: `(≤ ... tokens)`, `(> ... tokens)`, `(Peak)`, `(Off-Peak)`, `(50% off)`
  - Handles strikethrough prices: `~~$4.00~~ $2.00` → uses `$2.00`
  - Parses monthly limit: `$60`, `$15`, `$30`, `$80`, `$120`, `$180`, `$240`, `**Unlimited**` → number or null
  - Deduplicates by base model name, keeping cheapest variant
  - Returns array of pricing entries with `monthlyLimit` field or `null` on failure
  - Uses `User-Agent: openspec-multiagent` header

- [ ] Task 2: Add endpoint table parser (spec: spec.md → Scenario 1)
  - Add `parseZenEndpointTable(html)` function to lib.mjs
  - Finds the endpoint table (columns: Model, Model ID, Endpoint, AI SDK Package)
  - Parses each row: display name, model ID, endpoint URL, AI SDK package
  - Returns a map: `{ [displayName]: { modelId, endpoint, sdk } }`
  - Strips suffixes from display names for consistent matching

- [ ] Task 3: Add fallback provider mapping (spec: spec.md → Scenario 3)
  - Add `ZEN_PROVIDER_FALLBACK` constant in lib.mjs
  - Maps models not in the endpoint table to their SDK package and endpoint
  - Grouped by SDK: `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible`
  - Includes Gemini 4 Argon → `@ai-sdk/google` (not `@ai-sdk/openai`)

- [ ] Task 4: Add fetchZenModels() helper (spec: spec.md → Scenario 1)
  - Async function that fetches from `https://opencode.ai/inference/go/v1/models`
  - Uses existing `fetchJson()` helper from lib.mjs
  - Returns array of model IDs, or `null` on failure
  - Uses `User-Agent: openspec-multiagent` header

- [ ] Task 5: Add getZenModelDisplay() helper (spec: spec.md → Scenario 1)
  - Takes array of pricing entries + endpoint table map
  - Calculates display name from model ID (e.g., `mimo-v2.6-flash` → `MiMo-V2.6-Flash`)
  - Sorts by `estCostPerRequest` ascending
  - Returns array of display objects with `hasPricing` flag
  - Models without pricing placed at end

- [ ] Task 6: Add selectZenModelForAgent() interactive prompt (spec: spec.md → Scenarios 2, 5)
  - Shows ranked model list (cheapest first) using existing `askChoice()` helper
  - Marks recommended model with `[recommended]`:
    - Architect → `gpt-6-luna` (best reasoning/price ratio)
    - All other agents → `mimo-v2.6-flash` (cheapest)
  - Default: recommended model (not necessarily first in list)
  - Validates input, re-prompts on invalid
  - Non-interactive: returns recommended model ID
  - Takes agent name as parameter for display ("Select model for <agent>")

- [ ] Task 7: Add configureZenProvider() helper (spec: spec.md → Scenarios 3, 4)
  - Looks up provider mapping from endpoint table or `ZEN_PROVIDER_FALLBACK`
  - If provider exists: only updates top-level `model` field
  - If provider doesn't exist: writes full provider entry to user config
  - Handles JSONC files same as `writeMcpEntry` pattern
  - Returns `{ model, providerConfigured }`

- [ ] Task 8: Add per-agent model assignment step to setup.mjs (spec: spec.md → All scenarios)
  - Insert step after "Installing agent definitions" (Step 5)
  - Read `opencode/agents/` directory to discover agent names
  - For each agent with a `model` field in user config:
    - Call `selectZenModelForAgent(agentName, models)`
    - Store selected model ID
  - Skip agents without `model` field silently
  - If no agents have model fields: skip step with informational message
  - In dry-run mode: print what would be selected for each agent
  - Update `TOTAL_STEPS` counter

- [ ] Task 9: Add provider configuration step to setup.mjs (spec: spec.md → Scenarios 3, 4)
  - After per-agent assignment, configure the opencode-go provider
  - Prompt for API key if provider doesn't exist
  - Call `configureZenProvider(selectedModels)` to write/update config
  - In dry-run mode: print what would be configured
  - Install required SDK packages via npm if provider was created

- [ ] Task 10: Update help text and documentation (spec: spec.md → Scenario 5)
  - Update `--help` output to mention per-agent model selection
  - Update `TOTAL_STEPS` comment
