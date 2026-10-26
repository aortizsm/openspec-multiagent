## Status
Draft

## Executive Summary
Add reinstall and reset npm commands for the multi-agent setup. Reinstall overwrites agents and MCPs. Reset removes everything. Both follow existing script conventions.

## Artifacts
- `openspec/changes/add-reinstall-and-reset-commands/proposal.md`
- `openspec/changes/add-reinstall-and-reset-commands/design.md`
- `openspec/changes/add-reinstall-and-reset-commands/tasks.md`
- `scripts/reinstall.mjs` (new)
- `scripts/reset.mjs` (new)
- `scripts/install-agents.mjs` (modified: add --force)
- `package.json` (modified: add scripts)
- `README.md` (modified: document new commands)

## Risks
- `reset` is destructive — must be clear about what it removes
- Must not remove OpenCode config entirely (only our additions)

## Next Recommended
Implement the tasks in tasks.md.
