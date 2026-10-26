## status: design complete
## executive_summary: Adds interactive model selection to the setup wizard for OpenCode Go (Zen) models. Scrapes live pricing from the Go docs HTML page, displays models sorted by cost-effectiveness, and lets the user assign models to all agents that have a model field configured. Auto-configures the opencode-go provider (SDK package + endpoint) when not already present.
## artifacts:
- openspec/changes/zen-model-selection/proposal.md
- openspec/changes/zen-model-selection/spec.md
- openspec/changes/zen-model-selection/design.md
- openspec/changes/zen-model-selection/tasks.md
## risks:
- HTML scraping is fragile and breaks on layout changes. Mitigation: parser uses multiple heuristics (slot markers, table header detection, suffix stripping) to handle minor variations.
- Provider SDK packages (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) are not pre-installed. The user needs npm to install them. Mitigation: script runs `npm install` for the required packages after writing config.
- Gemini 4 Argon uses `@ai-sdk/google` (not `@ai-sdk/openai`), which is a non-standard endpoint. Mitigation: verify endpoint compatibility during implementation.
- Some models appear in pricing with multiple variants (Off-Peak/Peak, ≤272K/>272K tokens) but only once in the endpoint table. Mitigation: use cheapest variant from pricing and map to single endpoint entry.
## next_recommended: User approval, then delegate to @developer for implementation

## Context
OpenCode Go provides 30+ models with transparent per-token pricing. The pricing is published on the docs page as HTML tables (inside `<div slot="go">` for Go plan and `<div slot="go-plus">` for Go Plus). There is no public API for pricing data — only for the model list (`GET /inference/go/v1/models`). The setup script currently has no integration with OpenCode Go at all.

The user wants to assign models to all agents based on their needs, not just the architect. Agents that already have a `model` field in the user's config will be prompted for model selection; agents without a model field are skipped.

## Decisions

### D1: Scrape pricing from HTML (don't embed)
**Rationale**: OpenCode Go models and pricing change frequently (quarterly or more). Hardcoded pricing becomes stale quickly. The HTML page at `https://opencode.ai/v2/docs/console/go/` is the single source of truth and always up-to-date. Scraping ensures the setup script always shows current pricing without requiring code updates.

**Tradeoff**: HTML scraping is fragile and breaks on layout changes. Mitigation:
- Parser targets the `<div slot="go">` section specifically (not the Go Plus section)
- Uses markdown table parsing (the HTML contains pipe-delimited markdown tables)
- Strips model name suffixes (`(≤ 256K tokens)`, `(Peak)`, `(Off-Peak)`, `(50% off)`, etc.)
- Falls back to a minimal embedded model list if scraping fails
- Logs a warning on fallback so the user knows pricing may be stale

**Parser approach** (regex-based, no external dependencies):
1. Fetch HTML from `https://opencode.ai/v2/docs/console/go/`
2. Find content between `slot="go"` and `slot="go-plus"` markers
3. Locate the pricing table (starts with `| Model` header row)
4. Parse each row: extract model name, input price, output price, cached read price, cached write price, monthly limit
5. Strip model name suffixes: remove `(≤ ... tokens)`, `(> ... tokens)`, `(Peak)`, `(Off-Peak)`, `(50% off)`
6. Deduplicate by base model name, keeping the cheapest variant
7. Parse strikethrough prices: `~~$4.00~~ $2.00` → use `$2.00`

### D2: Parse endpoint table for model→SDK mapping
**Rationale**: The HTML also contains an endpoint table that maps display names to API model IDs, endpoints, and AI SDK packages. This is the authoritative source for SDK package selection.

**Parser approach**:
1. Find the endpoint table (identified by columns: Model, Model ID, Endpoint, AI SDK Package)
2. Parse each row to extract: display name, model ID, endpoint URL, AI SDK package
3. Build a lookup map: `{ [modelName]: { modelId, endpoint, sdk } }`
4. For models not in the endpoint table, fall back to a minimal embedded mapping

**Note**: Some models appear in pricing with multiple variants (e.g., "GPT 6 Luna (≤ 272K tokens)" and "GPT 6 Luna (> 272K tokens)") but only once in the endpoint table. The parser deduplicates by base name and uses the cheapest variant's pricing.

### D3: Per-agent model assignment with recommendations
**Rationale**: Different agents have different capabilities and token requirements. The user should select a model for each agent, with smart recommendations:
- **Architect**: recommended model is one with strong reasoning capability at low cost (GPT 6 Luna — $0.10/$0.50, not the cheapest but the best capability/price ratio for reasoning tasks)
- **All other agents**: recommended model is the cheapest (MiMo-V2.6-Flash — $0.14/$0.28)
- The user can override any recommendation

**Behavior**:
1. Fetch available models once (from HTML scraping)
2. Sort models by estimated cost (cheapest first)
3. For each agent in `opencode/agents/` that has a `model` field in the user's config:
   - Present the ranked model list with the recommended model marked `[recommended]`
   - Default selection is the recommended model
   - User selects by number or accepts default
4. For agents without a `model` field: skip silently
5. If user has no agents with model fields: skip model selection entirely

**Agent list source**: Read directory `opencode/agents/` to discover agent names. Only prompt for agents that already have a `model` field in the user's config.

### D4: Auto-configure provider on first use
**Rationale**: Most users won't have an `opencode-go` provider configured. Making them manually add it creates friction. The script can determine the correct AI SDK package and endpoint from the parsed endpoint table.

**Tradeoff**: More code in the installer. Mitigation: the provider config is a simple, well-documented structure that mirrors the existing provider pattern.

### D5: Provider config goes in user-level config, not project config
**Rationale**: The model choice is a personal preference, not a project convention. It follows the same pattern as the existing `model` field and provider definitions.

### D6: API key stored in config file (not env var)
**Rationale**: Consistent with how the existing GitHub MCP entry stores its token. Simpler for users — one place to manage credentials.

## Data Model

### Parsed pricing entry (from HTML)
```js
{
  modelId: "mimo-v2.6-flash",       // from endpoint table mapping
  displayName: "MiMo-V2.6-Flash",    // stripped of suffixes
  inputPrice: 0.14,                  // $/M tokens
  outputPrice: 0.28,                 // $/M tokens
  cachedReadPrice: 0.0028,           // $/M tokens (0 if "-")
  cachedWritePrice: null,            // $/M tokens (null if "-")
  monthlyLimit: 60,                  // $ (null if "Unlimited")
  estCostPerRequest: 0.0098          // calculated from typical request token counts
}
```

### Provider mapping (from endpoint table + fallback)
```js
const ZEN_PROVIDER_FALLBACK = {
  // @ai-sdk/openai
  "muse-spark-1.3-contributor": { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  "muse-spark-1.2-contributor": { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  "gpt-6-luna":                 { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  "gpt-5.6-luna":               { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  "grok-4.7":                   { sdk: "@ai-sdk/openai", endpoint: "https://opencode.ai/inference/go/openai/v1/responses" },
  // @ai-sdk/anthropic
  "claude-haiku-5-5":           { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  "minimax-m3":                 { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  "qwen3.8-max":                { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  "qwen3.8-flash":              { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  "qwen3.7-plus":               { sdk: "@ai-sdk/anthropic", endpoint: "https://opencode.ai/inference/go/anthropic/v1/messages" },
  // @ai-sdk/google
  "gemini-4-argon":             { sdk: "@ai-sdk/google", endpoint: "https://opencode.ai/inference/go/google/v1beta/models/gemini-4-argon" },
  // @ai-sdk/openai-compatible (default)
  // All remaining models
};
```

## Error Handling
- HTML fetch failure: log warning, fall back to embedded model list (from endpoint table model IDs)
- HTML parse failure (no table found): log warning, fall back to embedded model list
- Config write failure (JSONC): throw with manual instructions (same pattern as `writeMcpEntry`)
- Missing API key: prompt again or abort with clear error message
- Non-interactive mode: use defaults, skip prompts
- Model not found in endpoint table: use fallback mapping, log warning if no fallback exists

## Files Modified
- `scripts/lib.mjs` — add `fetchZenPricing()` function, `parseZenEndpointTable()` function, `ZEN_PROVIDER_FALLBACK` constant, `fetchZenModels()` function, `getZenModelDisplay()` function, `selectZenModelForAgent()` function, `configureZenProvider()` function
- `scripts/setup.mjs` — add model selection step between "Installing agent definitions" (Step 5) and "Installing CodeGraph" (Step 6), with per-agent assignment loop
