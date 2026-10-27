# Tasks

## 1. Refactor orchestrate.mjs

- [ ] 1.1 Split `main()` into helper functions ≤30 lines each — verify `node --check scripts/orchestrate.mjs` and line count ≤30 per function
- [ ] 1.2 Remove `shell: true` from `runCommand` — verify `spawnSync` call has no `shell: true`
- [ ] 1.3 Add `validateChangeName(changeName)` with `[a-z0-9_-]` pattern — verify invalid names exit with error
- [ ] 1.4 Call `validateChangeName` before using `changeName` in commands — verify validation runs at startup

## 2. Verification

- [ ] 2.1 Run `openspec validate orchestrate-refactor` — exits 0
- [ ] 2.2 Run `npm test` — all tests pass
- [ ] 2.3 Run `node scripts/orchestrate.mjs --help` — shows help, exit 0

## Workflow follow-up

- Archive the change after review requirements are satisfied.
- Verify archived result.