# Design

## Context

See `proposal.md` for motivation. Today, `@developer` is instructed to apply clean-code criteria throughout implementation. The existing test-first policy, clean-code review, security review, and external agent sequence remain in place.

## Goals / Non-Goals

**Goals:**
- Make behavior and applicable tests/checks green before the developer performs a focused clean-code refinement.
- Keep correctness and security obligations active in both stages.
- Require all applicable clean-code criteria and post-refinement checks before the developer reports completion.
- Keep the existing quality pipeline and its agent order unchanged.

**Non-Goals:**
- Permit knowingly insecure or incorrect code to be delivered or handed to another agent.
- Add a new agent, orchestrator runtime phase, dependency, or performance benchmark.
- Add speculative performance work, broad refactors, or abstractions unrelated to the approved change.

## Decisions

1. **Use two internal stages within `@developer`.** The functional stage preserves the existing test-first policy when an appropriate deterministic test exists and reaches green behavior with the smallest reasonable implementation. Once green, the developer performs a distinct refinement pass against the 12 clean-code criteria, then reruns applicable tests and checks before handoff.
   - **Alternative considered:** Apply every clean-code rule while drafting. Rejected because it can front-load structural decisions before behavior is established.
   - **Alternative considered:** Add a separate refactor agent or orchestrator phase. Rejected because the same developer has the implementation context and can perform the smaller change without expanding the pipeline.

2. **Keep correctness and security continuous; defer only systematic cleanup.** The developer must still implement correct, secure behavior in the first stage. The final refinement is behavior-preserving, scoped to the change, and does not weaken the reviewer's existing clean-code checks.
   - **Alternative considered:** Relax or remove clean-code requirements. Rejected because the goal is to change timing, not reduce delivered quality.

3. **Run applicable validation again after refinement.** If no meaningful deterministic test applies, the developer records that reason and reruns the applicable project checks after cleanup, consistent with the current testing policy.
   - **Alternative considered:** Trust the pre-refinement green result. Rejected because refactoring can introduce regressions.

4. **Do not optimize performance speculatively.** Refinement targets justified clarity and maintainability; performance changes require an explicit requirement or measured bottleneck.
   - **Alternative considered:** Include performance tuning in the cleanup pass. Rejected because it increases scope without evidence of need.

5. **Keep prompt-contract coverage semantic and focused.** Add regression checks for the two-stage sequence, post-refinement validation, and continuous security expectations without asserting the full prompt wording.

## Risks / Trade-offs

- [Risk] The refinement pass adds some time after tests first pass → Keep it focused on the approved diff and required criteria; avoid unrelated redesign.
- [Risk] A refactor can change behavior → Require applicable tests and checks to pass again before developer handoff.
- [Risk] Existing objective criteria may encourage mechanical splitting or abstraction → Apply them only to the scoped implementation diff and reject unrelated performance or structural work.
- [Trade-off] The developer may spend slightly more time before handoff, but downstream agents receive only the refined, validated implementation.

## Migration Plan

No runtime migration is required. Update the developer prompt, applicable OpenSpec capability specs, prompt-contract tests, and the agent workflow documentation in one change. Existing in-progress changes are not reclassified or rewritten.

## Result Contract

- **status**: Proposed; awaiting the user's design approval.
- **executive_summary**: The developer will first establish correct behavior and green applicable checks, then complete a focused clean-code pass. The final implementation must pass validation after that pass, while the existing downstream quality-agent order remains unchanged.
- **artifacts**:
  - `proposal.md`
  - `specs/clean-code-criteria/spec.md`
  - `specs/multiagent-workflow/spec.md`
  - `design.md`
  - `tasks.md`
- **risks**: Refactoring can regress behavior or prompt rigid application of criteria; mitigate with post-refinement checks and strict scope limits.
- **next_recommended**: Review and approve this design before delegating implementation.
