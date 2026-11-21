# multiagent-workflow Specification (delta: role-scoped-context-bundles)

## Role-Scoped Bundles

#### Scenario: developer bundle contains tasks, specs, design decisions, scout cache, previous findings
- **WHEN** `buildDeveloperBundle` runs
- **THEN** bundle includes: `tasks.md`, all `specs/*/spec.md`, `design.md` (only `## executive_summary`, `## artifacts`, `## risks`, `## next_recommended`), scout cache, previous findings from `.opencode/run/<change>/*-findings.json`
- **THEN** bundle size ≤ 60 KB

#### Scenario: test-engineer bundle contains scenarios, coverage map, test conventions
- **WHEN** `buildTestEngineerBundle` runs
- **THEN** bundle includes: spec scenarios (extracted `WHEN`/`THEN`), developer's coverage map from `tasks.md` (parseable table), project test conventions (from `@repo-scout` cache)
- **THEN** bundle size ≤ 60 KB

#### Scenario: code-reviewer bundle contains diff, scenarios, clean-code criteria
- **WHEN** `buildCodeReviewerBundle` runs
- **THEN** bundle includes: change diff (or summary + file list if > budget), spec scenarios, clean-code criteria (12 rules from `clean-code-criteria` spec)
- **THEN** bundle size ≤ 60 KB

#### Scenario: security-reviewer bundle contains diff, security criteria, relevant scenarios
- **WHEN** `buildSecurityReviewerBundle` runs
- **THEN** bundle includes: change diff (or summary), security criteria (12 rules from `security-criteria` spec), scenarios relevant to security (auth, input handling, file ops, secrets)
- **THEN** bundle size ≤ 60 KB

#### Scenario: verifier bundle contains scenarios, commands, diff-stat
- **WHEN** `buildVerifierBundle` runs
- **THEN** bundle includes: spec scenarios, project commands (from `@repo-scout` cache), `git diff --stat`
- **THEN** bundle size ≤ 60 KB

#### Scenario: bundle passed by path in invocation message
- **WHEN** orchestrator invokes agent
- **THEN** message = `"Change: <name>. Context bundle: <path>. Read it first."`
- **THEN** `OPENCODE_CONTEXT_BUNDLE` env var not set

#### Scenario: large diff triggers summarization
- **WHEN** diff exceeds 60 KB budget
- **THEN** `@diff-summarizer` invoked to produce summary + file list
- **THEN** full diff path included in bundle for on-demand read
- **THEN** bundle size ≤ 60 KB

## Repo-Scout Cache

#### Scenario: scout cache written once per HEAD
- **WHEN** first agent needs scout data
- **THEN** `@repo-scout` invoked, result cached to `.opencode/cache/scout-<HEAD>.md`
- **WHEN** subsequent agents need scout data in same run
- **THEN** cache reused, no additional `@repo-scout` invocation

#### Scenario: cache invalidated on HEAD change
- **WHEN** `git rev-parse HEAD` differs from cached HEAD
- **THEN** cache missed, `@repo-scout` invoked again

## Verdict Contract

#### Scenario: reviewers/verifier write verdict JSON
- **WHEN** agent completes (code-reviewer, security-reviewer, verifier)
- **THEN** writes `.opencode/run/<change>/<agent>-verdict.json` with schema:
  ```json
  {
    "agent": "string",
    "verdict": "PASS|FAIL|UNVERIFIABLE",
    "findings": [{"id": "string", "severity": "CRITICAL|WARNING|SUGGESTION", "status": "open|resolved", "evidence": "string", "file": "string?", "line": "number?"}],
    "summary": "string (≤5 lines)"
  }
  ```

#### Scenario: exit code 0 on artifact production
- **WHEN** agent produces verdict JSON (any verdict)
- **THEN** exit code = 0
- **WHEN** infrastructure failure (spawn error, timeout, no artifact)
- **THEN** exit code ≠ 0

#### Scenario: orchestrator reads JSON for judgment
- **WHEN** orchestrator collects gate result
- **THEN** reads verdict JSON, ignores exit code for verdict
- **THEN** `verdict=FAIL` → findings routed to developer
- **THEN** `verdict=UNVERIFIABLE` → recorded with justification

#### Scenario: developer/test-engineer also read bundle
- **WHEN** developer or test-engineer invoked
- **THEN** reads bundle from path in message
- **THEN** no `OPENCODE_CONTEXT_BUNDLE` env var used