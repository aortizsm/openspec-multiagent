# Design

## status

Design ready for user approval.

## executive_summary

Give `@test-engineer` the same test-command allowlist `@verifier` already has, so the agent that writes tests can also run them, while unrestricted shell access stays denied. The change records the validation obligation in the workflow spec and the agent prompt, and updates the README permission table and the workflow guide that currently document the opposite. It adds no runtime code, no dependency, and no change to the agent phase order.

## artifacts

- `proposal.md` — intent, motivation, scope, and impact.
- `specs/multiagent-workflow/spec.md` — delta for the test-engineer validation obligation and the least-privilege shell boundary.
- `design.md` — decisions, permission boundary, and risks.
- `tasks.md` — implementation and validation checklist.

## Context

Agent permissions live in the YAML frontmatter of `opencode/agents/*.md` and the orchestrator (`scripts/orchestrate.mjs`) copies them through the existing installation workflow. `@verifier` already carries the project's test commands in its allowlist; `@code-reviewer` carries them too; `@test-engineer` currently denies `shell: "*"` and permits only `echo`, `cat`, `ls`, `pwd`, and `openspec show/list`.

That boundary is deliberate but asymmetric: the test author cannot execute what it authors. See `proposal.md` for the 2026-11-19 round-4 evidence.

## Goals / Non-Goals

**Goals:**

- Let `@test-engineer` execute the project's test commands and report the observed result with its added tests.
- Keep the principle of least privilege: no unrestricted shell, no build/deploy/service commands beyond the test command set.
- Make the permission durable and checkable in the `multiagent-workflow` spec, not only in the agent frontmatter.
- Keep the existing sequence and the existing prohibitions intact.

**Non-Goals:**

- Change the phase order, the orchestrator, or the correction-round rules.
- Replace `@verifier`'s independent verification: the verifier remains the independent runner and still re-runs the suite from its own environment.
- Let `@test-engineer` modify implementation behavior or decide the change's scope.
- Grant `@test-engineer` `npm run check`, build, or arbitrary shell commands.

## Decisions

1. **Reuse the verifier's allowlist, not `shell: "*"`.** Copy the test-command entries from `opencode/agents/verifier.md` (package managers, `phpunit`, `artisan`, `pytest`, and equivalents) and keep `shell: "*"` denied with the read-only auxiliary commands (`echo`, `cat`, `ls`, `pwd`) intact. Least privilege is preserved: the grant is exactly the command family needed to validate tests, and `AGENTS.md` already notes that restricted agents need the auxiliary commands that appear in compound commands.
2. **Make the obligation spec'd, not just permitted.** A permission alone does not create a duty. The delta modifies the existing `multiagent-workflow` requirement so the test-engineer must run the permitted commands and report the result, and must declare added tests as unexecuted when those commands are unavailable. Both behaviors are covered by scenarios.
3. **Add a least-privilege requirement.** The delta adds a requirement stating the shell boundary so a future edit cannot silently widen it to unrestricted shell.
4. **Exclude `npm run check` from the allowlist.** `check` is the repository's own environment/readiness command, not a test command; `@verifier` already runs it. Keeping it out of the test-engineer's allowlist keeps the grant minimal and avoids overlapping with the verification phase.
5. **Documentation follows the permission.** `README.md` publishes the permission table and `docs/guides/agent-workflow.md` states "It does not execute tests" and lists "execute tests" as a prohibition; both must change in the same diff or the documentation contradicts the agent file.
6. **No orchestrator change.** The orchestrator injects a context bundle and runs agents in a fixed order; nothing about running a test command inside the test-engineer phase requires orchestration support.

## risks

- [A reviewer might see the test-engineer running tests as duplicate work with the verifier] → The verifier's value is independent re-execution from its own environment; the test-engineer's run is a fast feedback loop before the reviews. Both remain, and the verifier's report stays the archive gate.
- [The permission could drift into a broader grant later] → The delta adds an explicit least-privilege requirement, and `README.md` and the agent frontmatter must stay consistent.
- [A restricted environment may still deny the test commands] → The delta requires the test-engineer to declare added tests as unexecuted, so the architect and the verifier can validate them instead of assuming they passed.
- [Running a suite inside the test-engineer phase increases wall-clock time] → The suite for this toolkit runs in seconds; the cost is bounded and replaces a full correction round when a test is broken.

## Migration Plan

No data or runtime migration. Updated agent prompts and permissions take effect when the agents are reinstalled into the OpenCode agent directory with the existing installation workflow; until then the current files remain in effect. Because this repository versions its own project-local install under `.opencode/agents/`, the change also keeps `.opencode/agents/test-engineer.md` in sync with the source file so the grant applies in this repository's own sessions; user-level agent directories remain the user's reinstall step.

## next_recommended

Obtain user approval of this design, then implement: update `opencode/agents/test-engineer.md`, `README.md`, and `docs/guides/agent-workflow.md` together with the change note, and run `npm test`, `npm run check`, and strict OpenSpec validation.
