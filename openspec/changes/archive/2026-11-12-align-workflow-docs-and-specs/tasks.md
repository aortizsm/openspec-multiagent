# Tasks

## 1. Align workflow specifications and guidance

- [x] 1.1 Update `README.md` and `docs/guides/independent-verification.md` to describe only the standard full workflow; remove all fast-agent paths and accurately describe `@architect` shell permissions.
- [x] 1.2 Align `AGENTS.md` and `opencode/agents/architect.md` with the proposal gate, one approval, full parallel quality phase, verifier, and archive; remove all fast-agent references.
- [x] 1.3 Remove fast-path requirements from `multiagent-workflow` and retire obsolete `change-execution-mode`; preserve the current three-agent parallel requirement in `parallel-reviews`.
- [x] 1.4 Add/update the six-section Spanish change entry and changelog link to describe fast-agent retirement and preserve the historical 2026-11-09 note.
- [x] 1.5 Delete `opencode/agents/fast-architect.md` from the source so future installs no longer include it.
- [x] 1.6 Document manual removal of already-installed `fast-architect.md` copies; do not automatically delete existing user files.
- [x] 1.7 Correct the README permission table so it distinguishes the architect's broad shell tool permission from the prompt-level restriction against implementing/mutating source code.
- [x] 1.8 Qualify documentation/specification claims as applying to the standard run and document the current `--from` resume limitation.

## 2. Verify specification and documentation alignment

- [x] 2.1 Keep a regression test proving a proposal missing `## Intent` is rejected before any implementation starts; keep the test callback within the repository's function-length limit and verify with `npm test`.
- [x] 2.2 Add a test proving the fresh-install agent source no longer contains `fast-architect.md`; verify with `npm test`.
- [x] 2.3 Run `openspec validate align-workflow-docs-and-specs --strict`, `openspec validate --all`, and `git diff --check`; verify all commands pass and no orchestrator runtime code changed.

## Workflow follow-up

- After this change is archived, create the separately approved workflow change to run `@test-engineer` before parallel `@code-reviewer` and `@security-reviewer`, and to harden `scripts/orchestrate.mjs --from` so it cannot archive when required gates were skipped.
