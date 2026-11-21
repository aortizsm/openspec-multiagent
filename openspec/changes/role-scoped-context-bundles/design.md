# Design: role-scoped-context-bundles

## status
proposed

## executive_summary
Replace the unused monolithic env-var bundle with per-role markdown bundles written to disk, passed by path. Add a repo-scout cache keyed by HEAD. Introduce a machine-readable JSON verdict contract for reviewers and verifier, with exit code 0 on artifact production. Update all agent prompts to read their bundle file first.

## artifacts
- `scripts/orchestrate.mjs` — bundle generation per role, scout cache, verdict JSON parsing
- `scripts/lib.mjs` — helpers: `writeBundle`, `readScoutCache`, `parseVerdict`, `summarizeDiff`
- `opencode/agents/developer.md`, `test-engineer.md`, `code-reviewer.md`, `security-reviewer.md`, `verifier.md` — updated prompts
- `tests/context-bundles.test.mjs` — bundle content/size tests, verdict parsing, scout cache

## risks
- **Bundle size estimation**: Markdown size ≠ token count. Use character budget (60 KB ≈ 15k tokens) as proxy.
- **Diff summarization quality**: `@diff-summarizer` must produce faithful summary. Fallback: file list only.
- **Prompt changes**: All 5 agent prompts must be updated in sync. Test each reads bundle correctly.
- **Verdict JSON parsing**: Must handle malformed JSON gracefully (infrastructure FAIL).

## next_recommended
Implement bundle writer + scout cache first, then verdict contract, then prompt updates. Test each role's bundle in isolation.