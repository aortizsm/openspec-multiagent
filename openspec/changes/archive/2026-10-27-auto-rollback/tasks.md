# Tasks

## 1. Implement rollback.mjs

- [ ] 1.1 Create `scripts/rollback.mjs` with `saveCheckpoint(phaseName)` — git commit with message `rollback: checkpoint before <phase>` — verify `node --check scripts/rollback.mjs`
- [ ] 1.2 Implement `rollbackToCheckpoint()` — `git reset --hard` to the last checkpoint commit — verify reset works
- [ ] 1.3 Add CLI entry: `node scripts/rollback.mjs save <phase>` and `node scripts/rollback.mjs rollback` — verify both work
- [ ] 1.4 Fail fast when not in a git repository — verify exit code 1 outside git repo

## 2. Integrate with orchestrate.mjs

- [ ] 2.1 Import `saveCheckpoint` and `rollbackToCheckpoint` from `rollback.mjs` — verify import works
- [ ] 2.2 Call `saveCheckpoint(phaseName)` before each pipeline phase — verify checkpoint created
- [ ] 2.3 Call `rollbackToCheckpoint()` in catch block after phase failure — verify rollback on failure

## 3. npm scripts

- [ ] 3.1 Add `rollback` and `rollback:save` scripts to package.json — verify `npm run rollback save architect` works

## 4. Documentation

- [ ] 4.1 Add `docs/changes/2026-10-27-auto-rollback.md` entry — verify file exists
- [ ] 4.2 Add entry to `docs/CHANGELOG.md` — verify entry appears

## 5. Verification

- [ ] 5.1 Run `openspec validate auto-rollback` — exits 0
- [ ] 5.2 Run `npm test` — all tests pass
- [ ] 5.3 Manual: run orchestrate with a failing phase, verify rollback restores tree

## Workflow follow-up

- Archive the change after review requirements are satisfied.
- Verify archived result.