# Design

## Context

See `proposal.md` - Why for motivation. Current state:
- Each agent handoff requires manually reading proposal.md, design.md, tasks.md, spec.md, and git diff.
- No tool exists to assemble these into a single context document.
- Agents work from incomplete or stale context when a file is missed.

## Goals / Non-Goals

**Goals:**
- Single command to generate a complete context bundle for any change.
- Output is Markdown, ready to paste into an agent prompt.
- No new dependencies (Node built-ins only).

**Non-Goals:**
- Execute agents or run the pipeline.
- Modify OpenSpec workflow or agent definitions.
- Support non-change directories or arbitrary file sets.

## Decisions

### 1. Single `context-bundle.mjs` script
**Decision**: One script that takes a change name and outputs a Markdown bundle to stdout.
**Rationale**: Simple, testable, pipeable. Can be used as `node scripts/context-bundle.mjs <change>`.
**Alternative considered**: Add as a subcommand to `openspec` CLI — rejected (would require modifying OpenSpec tooling).

### 2. Artifact order: proposal → design → tasks → spec → diff
**Decision**: Bundle sections appear in dependency order: proposal (why), design (how), tasks (what to build), spec (requirements), diff (current code state).
**Rationale**: Matches the agent's need for context: motivation → architecture → plan → requirements → code.
**Alternative considered**: Diff first — rejected (code without context is harder to interpret).

### 3. Fail fast on missing change
**Decision**: Exit code 1 with error message if the change directory doesn't exist.
**Rationale**: Prevents agents from working with empty or partial context silently.
**Alternative considered**: Return empty bundle — rejected (silent failure leads to wrong assumptions).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Bundle includes stale spec content | Script reads files at execution time; agent should re-bundle if specs changed |
| Large diff output | No size limit; agent can truncate if needed |
| Change directory naming mismatch | Error message shows available changes |

## Migration Plan

No migration needed — new standalone script, no existing users.

## Open Questions

None.