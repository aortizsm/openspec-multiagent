# Proposal

## Intent

Provide a reusable OpenCode JSONC template that lets each project assign the recommended OpenCode Go model to the primary session and each bundled agent without changing global settings or embedding credentials.

## Why

The repository installs agent prompts globally or into a project, but currently provides no copyable per-project model-routing example. A separate non-active template lets the user reuse a cost-conscious model map in other projects without forcing those model choices on collaborators or changing the installed prompts.

## What Changes

- Add a non-active `opencode.models.example.jsonc` template at the repository root. Copying it to `opencode.jsonc` or `.opencode/opencode.jsonc` in a target project activates its model settings.
- Set MiMo-V2.6-Flash as the primary-session default and for high-volume agents; assign GLM-5.3-Flash to `@code-reviewer` and `@security-reviewer` as the review tier.
- Cover all nine bundled roles using the root session model for `@architect` and explicit model overrides for all eight subagents.
- Include no credentials. Document `/connect`, provider/model IDs, how agent overrides and session defaults interact, and that Go limits are per model rather than a global spending cap.
- Add a test that parses the JSONC template and checks the expected model map and credential-free shape.
- Link the template and usage guidance from README and the agent workflow guide; add the required Spanish change note and changelog entry.
- Do not edit global/user config, activate the template in this repo, change installed prompts or runtime behavior, add dependencies, or change workflow gates.

## Capabilities

### New Capabilities

- `agent-model-routing`: a reusable, non-active example for routing bundled OpenCode agents to provider/model IDs in a project-local configuration.

### Modified Capabilities

None.

## Impact

- New file: `opencode.models.example.jsonc`.
- OpenSpec: new `agent-model-routing` capability.
- Documentation: `README.md`, `docs/guides/agent-workflow.md`, `docs/changes/2026-11-13-add-agent-model-routing-template.md`, and `docs/CHANGELOG.md`.
- Tests: validate template syntax and expected agent-to-model assignments using existing Node test conventions.
- No active OpenCode config, global config, provider credentials, dependencies, or runtime code changes.
