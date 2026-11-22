# Tasks: role-scoped-context-bundles

## Phase 1: Bundle Writer + Scout Cache

- [x] 1.1 Add `writeRoleBundle(changeName, agent, content)` to `scripts/lib.mjs`: writes `.opencode/run/<change>/<agent>-bundle.md`.
- [x] 1.2 Add `getScoutCache(HEAD)` / `setScoutCache(HEAD, content)` to `scripts/lib.mjs`: reads/writes `.opencode/cache/scout-<HEAD>.md`.
- [x] 1.3 Add `summarizeDiff(diff, maxChars)` to `scripts/lib.mjs`: invokes `@diff-summarizer` subagent or falls back to file list + stats.
- [x] 1.4 Implement `buildDeveloperBundle`, `buildTestEngineerBundle`, `buildCodeReviewerBundle`, `buildSecurityReviewerBundle`, `buildVerifierBundle` in `scripts/orchestrate.mjs` or `lib.mjs`.
- [x] 1.5 Modify `buildAgentEnv` / invocation to write bundle file, pass path in message instead of `OPENCODE_CONTEXT_BUNDLE` env var.

## Phase 2: Verdict Contract

- [x] 2.1 Define `Verdict` TypeScript interface (or JSDoc) in `scripts/lib.mjs`.
- [x] 2.2 Add `writeVerdict(changeName, agent, verdict)` / `readVerdict(changeName, agent)` to `scripts/lib.mjs`.
- [x] 2.3 Modify `runAgentAsyncWithRetry` / `waitForAgent` to parse verdict JSON after agent completes (exit code 0 = artifact produced).
- [x] 2.4 On `verdict=FAIL`: write findings to `<agent>-findings.json`, route to developer (integrates with Change 1 retry policy).
- [x] 2.5 On `verdict=UNVERIFIABLE`: record with justification, escalate to architect if unjustified.

## Phase 3: Agent Prompt Updates

- [x] 3.1 Update `opencode/agents/developer.md`: add "Read context bundle from path provided in task message first."
- [x] 3.2 Update `opencode/agents/test-engineer.md`: same.
- [x] 3.2 Update `opencode/agents/code-reviewer.md`: same + "Write verdict JSON to path provided."
- [x] 3.3 Update `opencode/agents/security-reviewer.md`: same.
- [x] 3.4 Update `opencode/agents/verifier.md`: same.
- [x] 3.5 Verify prompts work without prompt caching (no `OPENCODE_CONTEXT_BUNDLE` references).

## Phase 4: Tests

- [x] 4.1 `tests/context-bundles.test.mjs`: each role bundle contains only expected sections, size ≤ 60 KB.
- [x] 4.2 Diff > 60 KB triggers summarization; full diff path included.
- [x] 4.3 Verdict JSON parsed correctly; `FAIL` routes to developer, no retry.
- [x] 4.4 Scout cache: 1 invocation per HEAD across 5 gates.

## Phase 5: Documentation

- [x] 5.1 Update `AGENTS.md` with bundle/verdict contract.
- [x] 5.2 Create `docs/changes/YYYY-MM-DD-role-scoped-context-bundles.md`.

## Review Findings

| ID | Source | Severity | Linked Criterion | File/Location | Requested Correction | Status | Evidence |
|----|--------|----------|------------------|---------------|----------------------|--------|----------|