# Design

## Result Contract

- **status**: Implementation, code/security reviews, and independent verification are complete; ready for archive.
- **executive_summary**: Keep conditional test-first for observable behavior without changing the agent sequence, and publish the user-requested English guide for all nine project agents. Translate the two affected main OpenSpec specs in place, including purposes and headings, preserving every requirement/scenario and meaning so the language requirement can be verified without weakening it.
- **artifacts**: `proposal.md`; deltas at `specs/multiagent-workflow/spec.md` and `specs/project-documentation/spec.md`; English replacements for the existing `openspec/specs/multiagent-workflow/spec.md` and `openspec/specs/project-documentation/spec.md`; this `design.md`; `tasks.md`; updates to `opencode/agents/developer.md`, `opencode/agents/test-engineer.md`, `README.md`, `docs/README.md`, and `docs/guides/independent-verification.md`; new `docs/guides/agent-workflow.md`; a six-section Spanish change note; and a `docs/CHANGELOG.md` entry.
- **risks**: Translating full specs may change normative meaning or drop scenarios; translate requirement-by-requirement, preserve one-to-one requirement/scenario structure, and verify the deltas match translated headings. The new guide may drift from agent prompts; source-check all nine roles and keep the English exception scoped to that guide.
- **next_recommended**: Archive after confirming spec synchronization and strict validation; then have `@developer` commit and push all current workspace changes as the user requested.

## Context

See `proposal.md` for motivation. `@developer` currently has a high-ROI testing policy but no test-first order. `@test-engineer` runs after implementation and its prompt asks for tests from scenarios, which can duplicate tests the developer has already written. The README has a concise role table and flowchart; no document currently explains every stage and the limits of all nine bundled agents.

## Goals / Non-Goals

**Goals:**
- Make test-first the default only when the requested behavior has a practical, deterministic, high-value black-box test.
- Keep documentation-only and otherwise untestable work free of forced or brittle tests, with the exception recorded and relevant checks still run.
- Have `@test-engineer` fill genuine coverage gaps without moving its existing place in the workflow.
- Give the nine bundled agents an English guide with their phase, trigger, responsibilities, outputs, and explicit boundaries, honoring the user's language request.

**Non-Goals:**
- Replace SDD/OpenSpec with ODD or RDD.
- Change the workflow order, remove any test/review/verifier/archive gate, or add an agent.
- Add tests that assert exact prompt wording or automate an LLM's compliance.
- Change `scripts/orchestrate.mjs` or any runtime behavior.

## Decisions

- Put the test-first rule in `opencode/agents/developer.md`, adjacent to the existing high-ROI test policy. Require an observable failing test before the behavior implementation when applicable, followed by implementation and a passing targeted test. For a test that cannot meaningfully represent the behavior, the developer records the reason and runs the relevant checks.
- Update `opencode/agents/test-engineer.md` to inspect developer-authored tests first, retain adequate coverage, add only uncovered spec scenarios or high-value edge cases, and record why a scenario has no meaningful deterministic test instead of forcing one. This agent remains after implementation and before the parallel reviewers; its shell permission remains unchanged.
- Use `docs/guides/agent-workflow.md` as the detailed English guide. Cover all nine agents defined in `opencode/agents/`, grouped as standard workflow roles, conditional UI role, and support roles. Document the normal step-by-step sequence, conditional UX design step, correction cycle, test-first behavior, and the responsibilities/limits of each role. Source-check every claim against that agent's prompt and the workflow specs.
- Keep `README.md`'s existing English role/permission summary concise and add a link to the detailed English guide. Add a cross-link from `docs/guides/independent-verification.md` rather than duplicating its verifier-specific detail.
- Update `docs/README.md` to state that Spanish remains the default while a user-requested per-document language exception is allowed.
- Update the documentation-language requirement only enough to permit this individually user-requested English guide; keep the rest of `docs/` in Spanish.
- Translate the complete `multiagent-workflow` and `project-documentation` main specs into English in place, including purposes and headings. Preserve every requirement and scenario with equivalent meaning, do not retain Spanish duplicates, and align the language delta's requirement/scenario headings with the translated project-documentation spec.
- Add the Spanish six-section change entry and changelog link according to existing documentation conventions.
- Do not add automated prompt-text tests. The change modifies agent instructions and documentation, not executable behavior; run the existing test suite, strict OpenSpec validation, all-spec validation, and diff checks.
- After all quality/archive gates pass, `@developer` makes a single commit containing all current user-authorized workspace changes, including previously completed archived changes, and pushes it to the configured remote. Do not mix in any changes made after this approval.

Alternative considered: move `@test-engineer` before `@developer` to author all tests first. Rejected because it would alter the agreed agent order and would not provide the implementation feedback loop where the developer observes RED and GREEN. Keeping the current phase order while having `@developer` test first is smaller and preserves all gates.

## Risks / Trade-offs

- **[Risk] Test-first is applied to behavior with no useful automated oracle** → Make applicability explicit, prohibit tests that merely assert prose/internal details, record the exception, and run other relevant checks.
- **[Risk] Test-engineer duplicates coverage** → Require it to inspect developer-authored tests and add only uncovered behavior.
- **[Risk] The guide becomes a second source of truth** → Cite the bundled agent prompts and OpenSpec contracts as authoritative and review the guide against them in the same change.
- **[Risk] Spec translation drops or alters a requirement/scenario** → Compare each translated requirement and scenario against the original, preserve one-to-one structure and validate the resulting specs.
- **[Trade-off] A new guide adds maintenance work** → Keep README as a brief index and the new guide as one consolidated, English explanation instead of duplicating details across existing guides.

## Migration Plan

No runtime or data migration is required. Future code changes follow the conditional test-first rule; existing changes and archived documentation remain unchanged.
