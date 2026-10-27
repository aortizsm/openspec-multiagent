# Tasks

## 1. Implement context-bundle.mjs

- [ ] 1.1 Create `scripts/context-bundle.mjs` that reads proposal.md, design.md, tasks.md, spec.md and git diff for a change — verify `node --check scripts/context-bundle.mjs`
- [ ] 1.2 Output sections in order: proposal, design, tasks, spec, git diff — verify output contains all five section headers
- [ ] 1.3 Exit code 1 with error message when change directory doesn't exist — verify `node scripts/context-bundle.mjs nonexistent` exits 1
- [ ] 1.4 No new dependencies; Node built-ins only — verify `node scripts/context-bundle.mjs <change>` runs without npm install
- [ ] 1.5 Add `context-bundle` and `context` npm run scripts to package.json — verify `npm run context-bundle infra-stability` and `npm run context infra-stability` work

## 2. Documentation

- [ ] 2.1 Add `docs/changes/2026-10-27-context-bundle.md` entry — verify file exists with six required sections
- [ ] 2.2 Add entry to `docs/CHANGELOG.md` — verify entry appears in changelog

## 3. Verification

- [ ] 3.1 Run `openspec validate context-bundle` — exits 0
- [ ] 3.2 Run `node scripts/context-bundle.mjs infra-stability` — produces non-empty output
- [ ] 3.3 Run `node scripts/context-bundle.mjs nonexistent` — exits 1 with error message

## Workflow follow-up

- Archive the change after review requirements are satisfied.
- Verify archived result.