# Design

## Context

See `proposal.md` - Why for motivation. Current state:
- `scripts/orchestrate.mjs` has a 45-line `main()` function (violates clean-code criterion #2: max 30 lines).
- `runCommand` uses `shell: true` (violates security criterion #6: unsafe exec functions).

## Goals / Non-Goals

**Goals:**
- `main()` ≤ 30 lines.
- `runCommand` does not use `shell: true`.
- `changeName` validated before use.

**Non-Goals:**
- Change CLI interface.
- Add new dependencies.

## Decisions

### 1. Split main into helpers
**Decision**: Extract dry-run display and agent loop into separate functions.
**Rationale**: Each function stays under 30 lines with single responsibility.
**Alternative**: Keep main as-is — rejected (violates clean-code criterion #2).

### 2. Remove shell: true
**Decision**: Remove `shell: true` from `spawnSync` options in `runCommand`.
**Rationale**: All commands use argument arrays; shell is unnecessary and adds injection risk.
**Alternative**: Keep shell:true with validation — rejected (unnecessary complexity).

### 3. Validate changeName
**Decision**: Add `validateChangeName()` that allows only `[a-z0-9_-]`.
**Rationale**: Prevents path traversal and shell injection if changeName is ever used in a shell context.
**Alternative**: No validation — rejected (security criterion #4 input validation).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Removing shell:true breaks commands needing shell features | None identified; all commands are simple executables with args |
| Validation too strict | Pattern `[a-z0-9_-]` covers all valid change names |

## Migration Plan

No migration needed — backward-compatible CLI.

## Open Questions

None.