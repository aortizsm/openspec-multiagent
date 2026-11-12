# Design

## Result Contract

- **status**: Ready for implementation approval.
- **executive_summary**: Make review feedback traceable and actionable by deduplicating findings into one correction bundle mapped to spec criteria, while preserving sources and evidence. Limit corrections to three full rounds and keep every existing review, verification, and archive gate.
- **artifacts**: `proposal.md`; a `multiagent-workflow` delta; this `design.md`; `tasks.md`; updates to `AGENTS.md`, both relevant architect prompt copies, `docs/guides/independent-verification.md`, `docs/CHANGELOG.md`, and a six-section Spanish change note.
- **risks**: Findings could be over-merged or dropped; preserve each distinct root cause and all reviewer sources, and require explicit evidence to close or reopen an item.
- **next_recommended**: After user approval, add the consolidation protocol and docs, then run tests and strict OpenSpec validation before review.

## Context

See `proposal.md` for motivation. The standard loop already runs test-engineer before code/security reviewers, verifies scenarios independently, and gates archive. Reviewer feedback is currently passed back to the developer without one consistent, durable record that relates findings to requirements and evidence.

## Goals / Non-Goals

**Goals:**
- Send the developer one consolidated, prioritized correction bundle after each quality phase.
- Preserve a traceable ledger in the change's `tasks.md` so findings survive correction rounds and context handoffs.
- Prevent duplicate feedback from causing repeated or contradictory work.
- Bound correction rounds and escalate unresolved required findings without archiving.

**Non-Goals:**
- Add a new reviewer/consolidator agent, service, database, or runtime code.
- Skip, weaken, or conditionally omit test-engineer, code-reviewer, security-reviewer, verifier, or OpenSpec archive gates.
- Change the current agent ordering or the `--from` CLI behavior.

## Decisions

- Use a `## Review Findings` table in `tasks.md`; no new file or state store is needed because the orchestrator already bundles tasks.md into each agent's context.
- Each unique finding gets a stable ID and records source reviewer(s), severity, linked acceptance criterion, location, requested change, status, and closure evidence.
- Merge findings only when they share the same underlying cause. Preserve distinct issues; when duplicates differ in severity, keep the highest severity and list all sources.
- The architect sends one ordered correction bundle referencing finding IDs. `@developer` responds with the change/evidence for each ID. Record declined `SUGGESTION`s with a rationale; required `CRITICAL`/`WARNING` findings stay open until evidence resolves them.
- Do not reopen resolved findings without new evidence. Treat one developer correction followed by the complete quality phase and independent verification as one round. A verifier failure before the third round becomes a finding in the next bundle and requires the same full gates again.
- If verification fails after the third round, record and report the failed scenario and evidence, stop without a fourth correction round, and do not archive. Also stop after round three if any required finding remains open.

Alternative considered: create a separate `review-findings.md` artifact or a dedicated consolidation agent. Rejected because tasks.md is already included in each context bundle, while another artifact or agent would add maintenance without improving traceability for this workflow.

## Risks / Trade-offs

- **[Risk] Consolidation hides a distinct finding** → Merge only findings with the same root cause, retain all sources, and preserve separate IDs for distinct acceptance criteria.
- **[Risk] A correction loop reaches the cap with work still open** → Stop and escalate with the ledger; never mark tasks complete or archive unresolved required findings.
- **[Trade-off] `tasks.md` carries review state in addition to implementation tasks** → Keep the ledger concise and scoped to findings from the current change.

## Migration Plan

No code or runtime migration is required. New changes use the review ledger when quality agents or the verifier request corrections; existing archived changes remain unchanged.
