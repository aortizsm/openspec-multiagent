# Design

## Context

See `proposal.md` - Why for motivation. Current state:
- `scripts/orchestrate.mjs` runs pipeline phases sequentially without any git checkpoint.
- If a phase fails, the working tree retains partial changes from that phase.
- Re-running the phase or continuing to the next phase compounds errors.

## Goals / Non-Goals

**Goals:**
- Create a git commit checkpoint before each pipeline phase.
- Rollback to the checkpoint when a phase fails.
- Tag checkpoints with the phase name for traceability.

**Non-Goals:**
- Push checkpoints to remote (local only).
- Resolve merge conflicts automatically.
- Support non-git directories.

## Decisions

### 1. Git commit as checkpoint
**Decision**: Use `git commit` with message `rollback: checkpoint before <phase>` instead of `git stash`.
**Rationale**: Commits are more visible in `git log`, easier to reference, and survive across script invocations. Stash is ephemeral and harder to track.
**Alternative considered**: `git stash` — rejected (ephemeral, harder to inspect).

### 2. `git reset --hard` for rollback
**Decision**: Use `git reset --hard <checkpoint-commit>` to restore the working tree.
**Rationale**: Completely discards working tree and index changes, returning to exact checkpoint state.
**Alternative considered**: `git checkout` — rejected (less explicit about discarding index changes).

### 3. Orchestrate.mjs integration
**Decision**: Wrap each phase in orchestrate.mjs with try/catch; call rollback before each phase, rollback on catch.
**Rationale**: Centralizes rollback logic in the orchestrator; rollback.mjs stays focused on git operations.
**Alternative considered**: Put rollback logic inside each agent script — rejected (duplication, harder to maintain).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Checkpoint commits clutter git history | Acceptable trade-off for safety; commits are local only |
| Rollback loses intentional changes from failed phase | By design — failed phase should not leave partial changes |
| Merge conflicts if files changed externally | Rollback only affects working tree, not remote branches |

## Migration Plan

No migration needed — new standalone script.

## Open Questions

None.