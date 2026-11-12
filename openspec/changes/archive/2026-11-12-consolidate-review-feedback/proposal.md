# Proposal

## Intent

Make architect-led correction cycles more reliable by turning parallel review feedback into one traceable, evidence-based correction batch.

## Why

Parallel reviewers can report overlapping or conflicting findings, and developers may receive feedback in fragments. Without a shared record of findings and resolution evidence, fixes can be missed or previously resolved issues can reappear across correction rounds.

## What Changes

- Require `@architect` to consolidate test-engineer, code-reviewer, security-reviewer, and verifier findings into a single correction bundle mapped to spec criteria.
- Preserve distinct findings, reviewer sources, severity, location, requested correction, and evidence; deduplicate only findings with the same underlying cause.
- Track findings as open or resolved; do not reopen resolved findings without new evidence.
- Bound correction to three complete rounds; if required findings remain after the third round, stop, report them to the user, and do not archive.
- Keep every existing quality, security, verification, validation, and archive gate; this change adds no agent and no runtime behavior.
- Update architect guidance, workflow specs, and the independent-verification guide.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multiagent-workflow`: add traceable review-feedback consolidation and a bounded correction cycle that blocks archive while required findings remain open.

## Impact

- Agent guidance: `AGENTS.md` and `opencode/agents/architect.md`.
- OpenSpec: delta for `multiagent-workflow`.
- Human docs: `docs/guides/independent-verification.md`, `docs/CHANGELOG.md`, and a six-section Spanish `docs/changes/` entry.
- No production code or dependency changes; quality gates remain unchanged.
