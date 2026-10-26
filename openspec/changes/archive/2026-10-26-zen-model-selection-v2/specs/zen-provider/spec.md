# Spec Delta

## Purpose

Updates the embedded OpenCode Go pricing data to match the official 29-model list with correct prices, monthly limits, and display names.

## ADDED Requirements

### Requirement: Embedded pricing matches official OpenCode Go plan
The `ZEN_EMBEDDED_PRICING` constant SHALL contain exactly 29 models matching the official opencode.ai/v2/docs/console/go table for the Go plan ($10/mo).

#### Scenario: 29 models present
- **WHEN** `ZEN_EMBEDDED_PRICING` is inspected
- **THEN** it contains exactly 29 model entries

#### Scenario: Prices match official table
- **WHEN** comparing embedded prices to official table
- **THEN** input/output prices per M tokens match exactly

### Requirement: Real monthly limits instead of "Plan-dependent"
Each model SHALL have a numeric monthly limit in USD, or `null` for unlimited (Beam Free only).

#### Scenario: Beam Free has null limit
- **WHEN** model is "beam-free"
- **THEN** `monthlyLimit` is `null` (unlimited)

#### Scenario: Other models have numeric limits
- **WHEN** model is not "beam-free"
- **THEN** `monthlyLimit` is a positive number ($15–$80)

### Requirement: Context-dependent pricing uses ≤X token prices
Models with context-length-dependent pricing SHALL use the ≤X token tier prices as the canonical prices.

#### Scenario: Grok 4.7 uses ≤ limit price
- **WHEN** model is "grok-4.7"
- **THEN** prices match the ≤128K tier from official table

#### Scenario: GPT 6 / 5.6 Luna uses ≤ limit price
- **WHEN** model is "gpt-6-luna" or "gpt-5.6-luna"
- **THEN** prices match the ≤128K tier

#### Scenario: Claude Haiku 5.5 uses ≤ limit price
- **WHEN** model is "claude-haiku-5.5"
- **THEN** prices match the ≤200K tier

#### Scenario: Qwen3.7 Plus uses ≤ limit price
- **WHEN** model is "qwen3.7-plus"
- **THEN** prices match the ≤128K tier

### Requirement: DeepSeek V4.1 Flash/Pro use off-peak pricing
DeepSeek models SHALL use off-peak pricing from the official table.

#### Scenario: DeepSeek V4.1 Flash off-peak
- **WHEN** model is "deepseek-v4.1-flash"
- **THEN** prices match off-peak column

#### Scenario: DeepSeek V4 Pro off-peak
- **WHEN** model is "deepseek-v4-pro"
- **THEN** prices match off-peak column

### Requirement: Gemini 4 Argon has 50% discount
Gemini 4 Argon SHALL use discounted prices ($2.00/$10.00 per M tokens) valid through November 2026.

#### Scenario: Gemini 4 Argon discounted
- **WHEN** model is "gemini-4-argon"
- **THEN** input price is $2.00, output price is $10.00

### Requirement: Display names match official branding
Model display names SHALL use official capitalization (e.g., "GPT 6 Luna", "Claude Haiku 5.5", "MiMo-V2.6-Flash").

#### Scenario: Correct capitalization
- **WHEN** `getZenModelDisplay` produces display names
- **THEN** "GPT 6 Luna", "Claude Haiku 5.5", "MiMo-V2.6-Flash" (not "Gpt 6 Luna", "Claude Haiku 5 5", "Mimo")