## Purpose
Allow users to select cost-effective OpenCode Go models for all agents during the setup wizard, with automatic provider configuration when needed. Models and pricing are scraped live from the OpenCode Go docs page.

## MODIFIED Requirements: Setup wizard — model selection

### Requirement: Scrape pricing from HTML
The setup script scrapes pricing data from the OpenCode Go docs HTML page and builds a model list with pricing information.

#### Scenario 1: Scrape pricing and build model list
**Given** the user runs the setup script in interactive mode
**When** the script reaches the "Select agent models" step
**Then** it fetches the HTML from `https://opencode.ai/v2/docs/console/go/`
**And** it extracts the Go pricing table (from `<div slot="go">` section)
**And** it parses each row to get: model name, input price, output price, cached read price, cached write price, monthly limit
**And** it strips model name suffixes: `(≤ ... tokens)`, `(> ... tokens)`, `(Peak)`, `(Off-Peak)`, `(50% off)`
**And** it handles strikethrough prices: `~~$4.00~~ $2.00` → uses `$2.00`
**And** it deduplicates models by base name, keeping the cheapest variant
**And** it fetches the endpoint table for model→SDK mapping
**And** models are sorted by estimated cost per typical request (cheapest first)
**And** the display format is a readable table with columns: rank, model name, input/$/M tokens, output/$/M tokens, est. cost/request, monthly limit

**Acceptance criteria:**
- The HTTP request uses a `User-Agent` header (`openspec-multiagent`)
- On HTML fetch failure (network error, HTTP error), the script falls back to an embedded model list and logs a warning
- On HTML parse failure (no table found), the script falls back to an embedded model list and logs a warning
- Models not found in the pricing table are shown with "N/A" for pricing and placed at the end

### Requirement: Per-agent model assignment with recommendations
The setup script presents the model list to the user for each agent that has a model field configured, with smart recommendations.

#### Scenario 2: Assign models to agents with model fields
**Given** the model list has been scraped and parsed
**And** the user has agents in `opencode/agents/` that have a `model` field in their config
**When** the script iterates through agents that have a `model` field
**Then** it presents the ranked model list (cheapest first) to the user for each agent
**And** the recommended model is marked with `[recommended]` in the display:
  - For the **architect** agent: recommended model is `gpt-6-luna` (best reasoning capability at low cost, $0.10/$0.50)
  - For **all other agents**: recommended model is `mimo-v2.6-flash` (cheapest model, $0.14/$0.28)
**And** the user can select a model by number or accept the default (recommended) by pressing Enter
**And** the selected model's ID is captured (e.g., `mimo-v2.6-flash`)
**And** the full model reference `opencode-go/<model-id>` is stored for config writing
**And** agents without a `model` field are skipped silently

**Acceptance criteria:**
- Invalid input (non-numeric, out of range) re-prompts the user
- Empty input selects the recommended model as default
- Non-interactive mode (no TTY) selects the recommended model for each agent without prompting
- If no agents have a `model` field, the step is skipped entirely with a message

### Requirement: Configure opencode-go provider
When no existing provider is found, the setup script creates one with the correct SDK package and endpoint.

#### Scenario 3: Configure opencode-go provider (first time)
**Given** at least one agent needs a model and no `opencode-go` provider exists in any config file
**When** the setup script proceeds to configuration
**Then** it prompts the user for their OpenCode Go API key
**And** it writes the provider entry to the user-level OpenCode config (`~/.config/opencode/opencode.json`)
**And** the provider entry uses the correct AI SDK package based on the model's API format:
  - `@ai-sdk/openai` for: grok-4.7, gpt-6-luna, gpt-5.6-luna, muse-spark-*, (models from endpoint table with `@ai-sdk/openai`)
  - `@ai-sdk/anthropic` for: claude-haiku-5-5, minimax-m3, qwen3.8-max, qwen3.8-flash, qwen3.7-plus (models from endpoint table with `@ai-sdk/anthropic`)
  - `@ai-sdk/google` for: gemini-4-argon (model from endpoint table with `@ai-sdk/google`)
  - `@ai-sdk/openai-compatible` for: all other models (models from endpoint table with `@ai-sdk/openai-compatible`)
**And** the correct endpoint URL is set based on the AI SDK package and model:
  - `@ai-sdk/openai`: `https://opencode.ai/inference/go/openai/v1/responses`
  - `@ai-sdk/anthropic`: `https://opencode.ai/inference/go/anthropic/v1/messages`
  - `@ai-sdk/google`: `https://opencode.ai/inference/go/google/v1beta/models/gemini-4-argon`
  - `@ai-sdk/openai-compatible`: `https://opencode.ai/inference/go/openai/v1/chat/completions`
**And** the model field is set to `opencode-go/<model-id>` (using the cheapest selected model as the provider's model)

**Acceptance criteria:**
- The provider entry follows the same V2 format as other MCP entries (`type: local`)
- The API key is stored in the config file (not in environment variables)
- If the config file is JSONC, the script throws an error with instructions to add the block manually (same pattern as `writeMcpEntry`)
- Existing provider entries and other config sections are preserved

### Requirement: Use existing provider
When an `opencode-go` provider already exists, only the model field is updated.

#### Scenario 4: Use existing opencode-go provider
**Given** an `opencode-go` provider already exists in the user's config
**When** the user has selected models for agents
**Then** the script only updates the `model` field of the existing provider
**And** it does not modify other provider settings (baseURL, package, etc.)

**Acceptance criteria:**
- The existing provider's baseURL, package, and other settings are preserved
- Only the top-level `model` field is changed

### Requirement: Non-interactive mode
When the script runs in dry-run or non-interactive mode, it uses defaults.

#### Scenario 5: Non-interactive / dry-run mode
**Given** the script is run with `--dry-run` or in non-interactive mode
**When** the model selection step is reached
**Then** it uses the first model (cheapest) as the default for each agent without prompting
**And** it skips provider configuration
**And** it prints what would be configured for each agent

**Acceptance criteria:**
- The script exits cleanly without errors in non-interactive mode
- The dry-run output includes the selected model ID for each agent and the config changes that would be made
