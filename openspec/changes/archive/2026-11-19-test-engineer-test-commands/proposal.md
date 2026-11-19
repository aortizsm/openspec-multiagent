# Proposal

## Intent

Let `@test-engineer` validate the tests it writes: grant it the same test-command allowlist `@verifier` already has, keep its unrestricted shell access denied, and record both the permission and the validation obligation in the workflow spec, the agent prompt, the README permission table, and the workflow guide.

## Why

`@test-engineer` is the only agent that writes tests and the only one that cannot run them. `@developer`, `@architect`, `@code-reviewer`, and `@verifier` all have test-command permissions; only the test author does not.

The cost is not theoretical. In the round-4 correction of `project-agent-model-menu` (2026-11-19), the test-engineer added two tests and one of them was broken: it compared the plugin's pretty-printed JSON serialization against a single-line string. The failure was caught only because `@architect` ran the suite on its own initiative. Nothing in the process requires it:

- The pre-review gate in `AGENTS.md` checks the `@developer` checks, not tests added afterwards by `@test-engineer`.
- The `multiagent-workflow` spec requires coverage work from `@test-engineer` but does not require anyone to execute tests between it and the parallel reviews.
- `@code-reviewer` "may" run permitted test commands as a sanity check; that step is optional.
- `@verifier` runs tests only after both reviewers approve, so a broken test costs a full correction round.

The regression tests for the toolkit itself live in the change's spec scenarios, so none of the existing safety nets is designed to catch a broken test added by the test author.

## What Changes

- Grant `@test-engineer` the project's test commands (`npm test*`, `npm run test*`, `pnpm`/`yarn`/`bun test*`, `composer test*`, `vendor/bin/phpunit*`, `php artisan test*`, `pytest*`, `python -m pytest*`, and equivalents), matching the allowlist `@verifier` already carries. Unrestricted `shell: "*"` stays denied.
- Require `@test-engineer` to run those permitted commands after adding or changing a test, report the observed result, and not hand a failing test to the parallel reviews.
- Require it to declare added tests as unexecuted when the permitted commands are unavailable in its environment, so the architect or verifier validates them instead.
- Keep the existing prohibitions that matter: never duplicate adequate coverage, never force low-value tests, never modify implementation behavior or the workflow order.
- Update `opencode/agents/test-engineer.md`, the `README.md` permission table, and `docs/guides/agent-workflow.md`, which today states "It does not execute tests" and lists "execute tests" as a prohibition.

## Capabilities

### Modified Capabilities

- `multiagent-workflow`: the test-engineer requirement gains a validation obligation (run the permitted test commands and report the result; declare unexecuted tests when they cannot run), and a new requirement fixes the least-privilege shell boundary (read-only auxiliary commands plus the project's test commands, never unrestricted shell).

## Impact

- `opencode/agents/test-engineer.md` — permission frontmatter and the "does not execute tests" prohibition.
- `README.md` — the `@test-engineer` row of the permission table.
- `docs/guides/agent-workflow.md` — the sequence description and the per-agent prohibition table.
- `docs/changes/2026-11-19-test-engineer-test-commands.md` and the `docs/CHANGELOG.md` line.
- Spec delta: `multiagent-workflow`.
- No runtime code, no new dependencies, and no orchestrator change: the phase order (`@developer` → `@test-engineer` → parallel reviews → `@verifier`) is untouched.
- Updated agent prompts take effect when the agents are reinstalled with the existing installation workflow.
