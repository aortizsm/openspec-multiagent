# Proposal

## Intent

Repair the repository's own integrity: restore a single correction policy in the specs, close the blocked in-flight change set, make the distributed agent prompts authoritative and drift-proof, and replace the hardcoded per-change exception with declared per-change metadata.

## Why

The repository is internally inconsistent and its gates cannot be satisfied:

- Two unarchived changes hold contradictory deltas for the same capability (`improve-adaptive-change-intake` requires a three-round correction policy; `stabilize-automatic-orchestration` removes it and allows one attempt).
- `improve-adaptive-change-intake` is permanently blocked: it exhausted three correction rounds with an open CRITICAL finding, while four of its five open findings are already fixed in the same worktree and its own design says to wait for user direction.
- The agent definitions OpenCode actually loads (`.opencode/agents/*.md`, committed) are stale copies of the source (`opencode/agents/*.md`) for all nine agents, and nothing detects the drift. `opencode/agents/architect.md` additionally carries two concatenated prompt copies that contradict each other on the correction policy, a change-specific directive for a historical change, and an instruction to bypass its own file-permission policy through shell redirection.
- The orchestrator hardcodes one historical change name to grant a three-round allowance, so the distributed tool carries behaviour keyed to a single change.
- Housekeeping is inconsistent: a wildcard dependency version, a stale lockfile rationale, an untracked example config next to a tracked one, and two empty leftover spec directories.

## What Changes

- Remove the contradictory three-round requirement from `improve-adaptive-change-intake`'s delta so exactly one correction policy remains in the repository.
- Close the predecessor's open ledger rows with verified evidence from the current worktree, record the user-authorized reconciliation, and archive both in-flight changes through the normal gates.
- Rebuild `opencode/agents/architect.md` as one authoritative prompt: no duplicated copy, no contradictory policy text, no change-specific directive, and no permission-bypass instruction.
- Synchronize `.opencode/agents/*.md` with `opencode/agents/*.md` and add a deterministic gate that fails when the installed copies drift from the source.
- **BREAKING** (runtime metadata): replace the hardcoded `GRANDFATHERED_CHANGE_NAME` allowance with a per-change declaration in `openspec/changes/<name>/.openspec.yaml` (`correction_rounds`, default `1`), and declare `correction_rounds: 3` on the in-progress successor to preserve its approved allowance.
- Housekeeping: pin the wildcard dependency, correct the stale lockfile rationale, make the example-config tracking consistent, and remove the empty leftover spec directories.
- Out of scope, recorded in `design.md`: splitting `tests/run.mjs` or modularizing `scripts/orchestrate.mjs`, and adding a "one active change per capability" gate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multiagent-workflow`: add requirements for a per-change declared correction allowance, for installed agent definitions matching their source, and for agent prompts carrying no permission-bypass or change-specific directives; and remove the remaining round-three wording from "Architect consolidates actionable findings".
- `architect-shell-editing`: remove the two requirements that mandated a shell-editing note and presented `shell *` as an editing route, and add the architect's editing boundary instead.

## Impact

- Specs and changes: `openspec/changes/improve-adaptive-change-intake/specs/multiagent-workflow/spec.md`, its `tasks.md` ledger and `design.md`; `openspec/changes/stabilize-automatic-orchestration/tasks.md` (task 5.1) and `.openspec.yaml`; this change's delta.
- Runtime and tests: `scripts/orchestrate.mjs` (correction-allowance resolution), `scripts/check.mjs` (drift report), `tests/run.mjs` (drift gate, allowance metadata, prompt absence checks).
- Agent and project instructions: `opencode/agents/*.md`, `.opencode/agents/*.md`, `AGENTS.md`.
- Human documentation: `docs/guides/agent-workflow.md`, a Spanish change note under `docs/changes/`, and `docs/CHANGELOG.md`.
- Manifests and layout: `package.json`, `.gitignore`, `opencode.clinepass.example.jsonc`, empty `openspec/specs/model-selector/` and `openspec/specs/zen-provider/`.
- No new dependencies. No permission model change beyond removing the documentation that taught the architect to bypass it.
