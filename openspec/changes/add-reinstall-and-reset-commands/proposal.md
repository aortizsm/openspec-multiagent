## Why
Users need easy ways to reinstall or reset the multi-agent setup. Currently:
- `install-agents` doesn't overwrite existing files (silent fail)
- No `reinstall` command exists
- No `reset` command for a full cleanup

## What Changes
- Add `--force` flag to `install-agents.mjs` (overwrites existing agent files)
- Add `reinstall.mjs` script that reinstalls agents + reconfigures MCPs
- Add `reset.mjs` script that removes everything and starts fresh
- Update `package.json` with new npm scripts
- Update README.md with documentation for new commands

## Scope
- `scripts/reinstall.mjs` (new)
- `scripts/reset.mjs` (new)
- `scripts/install-agents.mjs` (add --force flag)
- `package.json` (add scripts)
- `README.md` (document new commands)

## Success Criteria
- `npm run reinstall` overwrites all agents and reconfigures MCPs
- `npm run reset` removes everything cleanly
- `install-agents --force` overwrites existing agent files
- All existing commands continue to work
- README documents all new commands
