# Proposal

## Intent

Make `@architect` actually run the project's own commands instead of handing them back to the user, by fixing the installed agent prompt that currently forbids it.

## Why

The architect prompt that is installed into every project restricts the agent to a closed read-only allowlist and tells it not to run build or project commands:

> You NEVER implement anything yourself. You do not edit source code, run build/install commands, or make changes to the codebase. Your only writable outputs are OpenSpec specification files, `AGENTS.md` and `opencode/agents/*`. You MAY run read-only verification commands (`openspec validate`, `npm test`, `git status/diff/log/show`, `ls`, `echo`) to enforce the validation gate.

That text exists twice in `opencode/agents/architect.md` (lines 93 and 517) and is what the user-level install copies, so it governs the architect in every other project. In one of those projects the architect refused to run `npm run scope:sync --dry-run`, delegated the command to the user, and then agreed with the user's mistaken claim that an architect cannot execute commands.

Three verifiable facts make this a prompt defect rather than a model failure:

- `git log -S'You can execute shell commands directly' -- opencode/agents/architect.md` returns nothing: the corrected text has never existed in the source file. It exists only in this repository's project-local copy `.opencode/agents/architect.md`, which someone improved in the wrong place.
- `~/.config/opencode/agents/architect.md` — the copy that governs other projects — is byte-identical to the restrictive source, so every reinstall propagates the refusal.
- `README.md:21` already documents the opposite of the prompt: `shell *` is a broad tool-level allow, and "shell is not a sandbox". The permission and the narrative disagree, and the narrative decides the behaviour.

Running a command is not implementing. The architect's whole job includes inspecting, analysing and verifying the project it is working in, which requires the project's own tooling.

## What Changes

- Replace the closed read-only allowlist in both `opencode/agents/architect.md` occurrences with an execution mandate: the architect runs the project's own commands itself — project scripts, database clients, and available analysis and verification tooling — and reports the output.
- Add the anti-delegation rule: never ask the user to run a command the architect can run itself, and never claim a general inability to execute commands. When a command fails or a tool is missing, report the concrete blocker and the smallest next step.
- Remove the sentence forbidding "build/install commands" as a blanket prohibition, while keeping the editing boundary intact: implementing behaviour changes in the project's source remains `@developer`'s job through a `tasks.md` row.
- Keep the read-only and credential boundary for database reviews unchanged; this change does not widen database access.
- Synchronise `.opencode/agents/architect.md` so the repository's own installed copy is byte-identical to the source; it currently holds the improved narrative but lacks the database-review section added later, so the two copies must be reconciled into one truth.
- Update the capability spec, `README.md`, the agent workflow guide, the change note and the changelog, and reinstall the user-level agents so other projects pick up the corrected prompt.

## Capabilities

### Modified Capabilities

- `architect-shell-editing`: adds a requirement that the architect executes the project's own commands itself, does not delegate a runnable command to the user, does not claim a categorical inability to execute commands, and does not restrict itself to a closed read-only allowlist.

## Impact

- `opencode/agents/architect.md` — both occurrences of the restrictive paragraph.
- `.opencode/agents/architect.md` — reconciled to the source so this repository's own architect (and any project install) behaves identically.
- `openspec/specs/architect-shell-editing/spec.md` via the change delta.
- `README.md`, `docs/guides/agent-workflow.md`, `docs/changes/2026-11-19-architect-runs-project-commands.md`, `docs/CHANGELOG.md`.
- `tests/run.mjs` — prompt-contract regression covering both copies.
- No runtime code, no new dependency, and no permission change: `shell: "*"` is already allowed at the tool layer. The fix is narrative, and the reinstall of the user-level agents is the step that makes it take effect in other projects.
