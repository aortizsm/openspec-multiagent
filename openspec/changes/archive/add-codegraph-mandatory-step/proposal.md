## Why

The `npx openspec-multiagent init` wizard (`scripts/init.mjs`) installs Context7 and Engram MCP servers, but CodeGraph is not included as a setup step. CodeGraph is referenced in `package.json` devDependencies and wired in `setup.mjs` (step 6 of 9), but `init.mjs` — the wizard users run inside their own projects — never installs or wires it. Users who want CodeGraph must do it manually, which is inconsistent with the guided setup experience.

## What Changes

Add CodeGraph as a mandatory step in `scripts/init.mjs`:
- Check if `codegraph` binary is on PATH.
- If missing, install it globally via `npm install -g @colbymchenry/codegraph`.
- Wire CodeGraph to OpenCode: `codegraph install --target=opencode --location=global --yes`.
- No interactive prompt: the step is mandatory and fails the wizard if it cannot complete.

## Scope

- `scripts/init.mjs` (add mandatory CodeGraph step, update TOTAL_STEPS from 5 to 6, update --help text)

## Out of Scope

- `scripts/setup.mjs` — already includes CodeGraph (step 6 of 9), no change needed.
- `package.json` — `@colbymchenry/codegraph` is already in devDependencies.

## Success Criteria

- `init.mjs` has 6 steps; CodeGraph is step 3 (mandatory).
- The CodeGraph step runs without user confirmation.
- If `codegraph` is not on PATH, it is installed globally before wiring.
- If wiring fails, the wizard exits with `process.exit(1)`.
- Context7 and Engram remain optional (unchanged behavior).
