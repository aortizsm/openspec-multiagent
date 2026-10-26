## Why
OpenCode Zen (Go) offers 30+ models at transparent per-token pricing. Users who subscribe to OpenCode Go should be able to select cost-effective models for all agents during installation, rather than having to manually configure each one later. Different agents have different capabilities and token requirements, so each should be assignable its own model.

## What Changes
- The setup script (`scripts/setup.mjs`) scrapes live pricing from the OpenCode Go docs HTML page (`https://opencode.ai/v2/docs/console/go/`), extracting the Go pricing table and endpoint mapping table
- The script also fetches the live model list from the Go API endpoint (`GET https://opencode.ai/inference/go/v1/models`)
- Models are displayed sorted by cost-effectiveness (cheapest first) with pricing info
- The installer prompts the user to assign a model to each agent that has a `model` field in their config (agents without a model field are skipped)
- If the user has already configured an `opencode-go` provider in their OpenCode config, the selected models are written as `model: "opencode-go/<id>"`
- If no `opencode-go` provider exists, the installer prompts for the API key and auto-configures the provider using the correct AI SDK package based on the chosen model's API format (from the endpoint table)

## Impact
- Affected files: `scripts/setup.mjs`, `scripts/lib.mjs`
- No changes to existing agent definitions, skills, or the OpenSpec workflow
- Pricing data is scraped live from HTML (no hardcoded pricing table)
