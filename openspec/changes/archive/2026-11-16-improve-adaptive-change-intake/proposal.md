# Proposal

## Intent

Make `@architect` begin every new OpenSpec change with two brief discovery rounds and mode-specific handoffs, and make automatic orchestration honor machine-readable blocker, review, and verifier outcomes before it advances or archives.

## Why

The current workflow does not require separate pre-proposal checks for ambiguity and scope/context, and it does not distinguish assisted clarification from automatic execution at agent handoffs. In addition, `scripts/orchestrate.mjs` treats a zero process exit code as agent success, then validates and archives without interpreting review or verifier results. This can hide unresolved decisions and bypass semantic quality gates.

## What Changes

- Ask whether to use automatic (`scripts/orchestrate.mjs`) or assisted, step-by-step execution at the start unless the user already specified the mode.
- Before drafting the proposal, conduct two distinct, adaptive discovery passes: first resolve material ambiguity; then confirm intent, scope, context, and acceptance. Ask only about details that remain material and unresolved.
- In assisted mode, surface and pause for user clarification at an agent handoff only when a material doubt exists; otherwise continue. In automatic mode, do not ask routine handoff questions; stop and notify the user if an important blocker cannot be resolved without guessing.
- Define a machine-readable terminal outcome for every automatic pipeline agent, capture it from OpenCode CLI JSON output, validate it against the agent's allowed statuses, and fail closed if it is missing or malformed.
- In automatic mode, run the conditional UX phase for UI changes, consolidate review/verifier findings through `@architect`, and perform the existing full correction sequence for up to three rounds. Archive only after explicit reviewer approvals, acceptable verifier outcomes, and strict validation; stop/report blockers or unresolved required findings.
- Ask at most two focused questions per turn, in natural conversation, with options/trade-offs and recommendations when useful. Keep the existing single final design-approval gate and all quality/archive gates.
- Update the orchestrator, its integration tests, affected agent prompts, root guidance, workflow guide, and human-readable change documentation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multiagent-workflow`: require two-stage adaptive discovery, mode-specific handoffs, machine-readable automatic outcomes, bounded automated corrections, and archive gating while retaining the final design-approval gate.

## Impact

- OpenSpec delta: `openspec/changes/improve-adaptive-change-intake/specs/multiagent-workflow/spec.md`.
- Runtime and tests: `scripts/orchestrate.mjs` and `tests/run.mjs`.
- Agent and project instructions: `opencode/agents/architect.md`, `developer.md`, `test-engineer.md`, `code-reviewer.md`, `security-reviewer.md`, `verifier.md`, conditional `ux-designer.md`, and `AGENTS.md`.
- Human documentation: `docs/guides/agent-workflow.md`, a Spanish change note, and `docs/CHANGELOG.md`.
- No new dependencies or permission changes are intended. Tests will cover the outcome protocol and pipeline gates; they will not assert exact natural-language prompt wording.
