# Design

## status

Design ready for user approval.

## executive_summary

Fix the architect prompt so the agent runs its project's own commands instead of delegating them to the user. The installed prompt currently restricts it to a closed read-only allowlist and forbids build commands, which is exactly why an architect in another project refused `npm run scope:sync --dry-run`. The change rewrites that paragraph in both occurrences, adds an anti-delegation rule, reconciles this repository's installed copy with the source, and records the boundary in the capability spec. No runtime code or permission change: `shell: "*"` is already allowed.

## artifacts

- `proposal.md` — intent, evidence, scope, and impact.
- `specs/architect-shell-editing/spec.md` — delta adding the command-execution mandate.
- `design.md` — decisions, boundary, and risks.
- `tasks.md` — implementation and validation checklist.

## Context

OpenCode resolves an agent definition from the project-local directory when it exists and from the user-level directory otherwise. This repository tracks its own project-local install under `.opencode/agents/`, while `~/.config/opencode/agents/` carries the copy that governs every other project. The source of truth is `opencode/agents/architect.md`, copied by `scripts/install-agents.mjs`.

The source and the user-level copy are byte-identical and contain the restrictive narrative; the project-local copy of this repository contains a corrected narrative but was never propagated to the source, and it lacks the read-only database review section added later. The three copies therefore disagree, and the one that governs other projects is the restrictive one. See `proposal.md` for the evidence.

## Goals / Non-Goals

**Goals:**

- The architect runs the project's own commands itself and reports their output.
- The architect never hands the user a command it could run, and never claims a categorical inability to execute commands.
- The editing boundary stays unchanged: behaviour changes in the project's source remain `@developer`'s work, delegated through a `tasks.md` row.
- The source prompt and this repository's installed copy become one truth, so a reinstall never resurrects the refusal.

**Non-Goals:**

- Widen database access or change the read-only and credential rules for database reviews.
- Let the architect edit project source files, which the local copy's "you may also edit source code" sentence would have granted.
- Change the architect's tool-layer permissions; `shell: "*"` is already allowed.
- De-duplicate the prompt's repeated sections, which is pre-existing and out of scope.

## Decisions

1. **The defect is narrative, not permission.** The tool layer already allows `shell: "*"`, and `README.md` documents it, so no permission grant is needed. Fixing the permission would change nothing; the refusal comes from the prompt text the agent reads. This keeps the change small and reviewable.
2. **Mandate execution, and make delegation a violation.** The replacement states that the architect runs the project's commands itself and must not ask the user to run a command it can run. The repository already carries this rule for database queries (`opencode/agents/architect.md:78`); this change generalises it to every command.
3. **Remove the closed allowlist, keep a real boundary.** The enumerated list is what produces the refusal, so it goes. What stays is the editing boundary: `openspec/**`, `AGENTS.md` and `opencode/agents/*` are its writable outputs, and implementing behaviour changes in the project's source is delegated to `@developer`. Running the project's commands is explicitly not implementing.
4. **Do not propagate the local copy's over-grant.** `.opencode/agents/architect.md` says the architect "may also edit source code and run build/install commands when needed". That contradicts the toolkit's model and `README.md` ("It never implements source changes"), so the reconciliation takes the source's narrower editing boundary and the local copy's execution mandate.
5. **Reconcile, do not merge by hand.** `opencode/agents/architect.md` stays the single source; `.opencode/agents/architect.md` becomes a byte-identical copy of it. The upcoming `enforcement-guards` change adds the check that keeps them identical, which is the durable fix for this class of defect.
6. **Non-mutating execution where the tool offers it.** The replacement tells the architect to use non-mutating modes (for example `--dry-run`) when a command supports them, so running a project command does not leave the repository or the environment modified as a side effect of analysis.
7. **Reinstall is the user-visible migration.** Fixing the source does not change other projects until the user-level agents are reinstalled. `scripts/install-agents.mjs` skips files that already exist unless `--force` is passed, so the documented migration step is `node scripts/install-agents.mjs --force` (or `npm run reinstall`, which overwrites existing files per `README.md:193`). Without `--force`, the user-level `~/.config/opencode/agents/architect.md` already exists and would be skipped, so other projects keep the old restrictive prompt. The change documents that step explicitly and does not silently rewrite other projects' agent directories.

## risks

- [A wrong narrative could make the architect mutate a project it should only inspect] → The replacement keeps the editing boundary explicit, keeps the database read-only rules untouched, and requires non-mutating flags for inspection commands.
- [Removing an enumerated allowlist could be read as unbounded authority] → The requirement pairs the mandate with the anti-delegation rule and the unchanged editing boundary; the tool layer was already broad, so the prompt now matches the real permission instead of understating it.
- [Other projects keep the old behaviour after this change] → The source and this repository's copy are fixed, but the user-level install only changes when it is reinstalled; the change states that explicitly and offers the command.
- [The prompt is duplicated, so a fix could land in one occurrence only] → The tasks and the regression test cover both occurrences explicitly.
- [The regression test asserts prompt wording, which is brittle] → Bounded regexes are used, matching the repository's existing prompt-contract pattern, and the assertions target the behaviour statements rather than full sentences.

## Migration Plan

No data or runtime migration. The corrected prompt takes effect in this repository immediately, because OpenCode reads the project-local definition. Other projects pick it up when the user-level agents are reinstalled with `scripts/install-agents.mjs --force` (or `npm run reinstall`, which overwrites existing files per `README.md:193`); until then their architects keep obeying the old text, because without `--force` the existing `~/.config/opencode/agents/architect.md` is skipped.

## next_recommended

Obtain user approval, then implement the prompt fix in both occurrences, reconcile `.opencode/agents/architect.md`, add the capability delta, the regression test, and the documentation, and run `npm test`, `npm run check`, and strict OpenSpec validation.
