# Tasks

## 1. Implement readInput primitive (lib.mjs)

- [x] 1.1 Add `readInput(question, { timeout = 100, fallback = "" } = {})` that probes stdin type (TTY vs pipe vs closed) and returns `{ value, eof }` — verify `node --check scripts/lib.mjs`
- [x] 1.2 TTY path: raw mode + data events, resolve on Enter/Ctrl+D — verify resolves on newline input in TTY
- [x] 1.3 Pipe path: read all available stdin data, resolve on end — verify `echo "test" | node -e "import('./lib.mjs').then(m => m.readInput('q').then(console.log))"`
- [x] 1.4 Closed/EOF path: resolve `{ value: null, eof: true }` immediately — verify with closed stdin
- [x] 1.5 Timeout path: non-TTY non-pipe returns fallback after timeout — verify no hang in headless

## 2. Refactor ask, askText, askYesNo to delegate to readInput (lib.mjs)

- [x] 2.1 Rewrite `ask(question)` to use `readInput()` — verify same return type (string | null)
- [x] 2.2 `askText()` delegates via `ask()` — verify same return type (string)
- [x] 2.3 `askYesNo()` delegates via `ask()` — verify same return type (boolean)
- [x] 2.4 Duplicate raw-mode/readline/pipe code removed from `ask()` — `readInput()` is the only stdin reader
- [x] 2.5 All functions ≤30 lines (clean-code #2) — `ask()` is 7 lines

## 3. Make selectModelFromList resilient (lib.mjs)

- [x] 3.1 N/A — `selectModelFromList` does not exist in current `lib.mjs` (Zen model selection was reverted in prior change). No DECSC/DECRC detection needed.

## 4. Verification

- [ ] 4.1 Run `node --check scripts/lib.mjs scripts/setup.mjs` — both pass
- [x] 4.2 Run `npm test` — 33/33 pass
- [x] 4.3 Run `node scripts/setup.mjs --dry-run` — exit 0, no writes
- [x] 4.4 Run `echo "ghp_test" | node scripts/setup.mjs` — reads token from pipe, continues
- [ ] 4.5 Manual TTY test: `node scripts/setup.mjs` — waits at GITHUB_TOKEN prompt, accepts input (requires real TTY)

## Workflow follow-up

- Validate change: `openspec validate infra-stability`
- Archive change: `openspec archive infra-stability --yes`
- Sync delta specs to main specs