# Spec Delta: role-scoped-context-bundles

## ADDED Requirements

### Requirement: Role-scoped context bundles
Each agent invocation MUST receive a role-scoped bundle built by a dedicated builder for that role, and each bundle MUST be at most 60 KB. The bundle MUST be passed to the agent by path in the invocation message rather than embedded wholesale in the `OPENCODE_CONTEXT_BUNDLE` environment variable.

#### Scenario: developer bundle contains tasks, specs, design decisions, scout cache, previous findings
- **WHEN** `buildDeveloperBundle` runs
- **THEN** the bundle includes `tasks.md`, all `specs/*/spec.md`, `design.md` limited to `## executive_summary`, `## artifacts`, `## risks`, and `## next_recommended`, the scout cache, and previous findings from `.opencode/run/<change>/*-findings.json`
- **THEN** the bundle size is at most 60 KB

#### Scenario: test-engineer bundle contains scenarios, coverage map, test conventions
- **WHEN** `buildTestEngineerBundle` runs
- **THEN** the bundle includes spec scenarios (extracted `WHEN`/`THEN`), the developer's coverage map from `tasks.md` (parseable table), and project test conventions from the `@repo-scout` cache
- **THEN** the bundle size is at most 60 KB

#### Scenario: code-reviewer bundle contains diff, scenarios, clean-code criteria
- **WHEN** `buildCodeReviewerBundle` runs
- **THEN** the bundle includes the change diff (or a summary plus file list if it exceeds the budget), the spec scenarios, and the 12 clean-code criteria from the `clean-code-criteria` spec
- **THEN** the bundle size is at most 60 KB

#### Scenario: security-reviewer bundle contains diff, security criteria, relevant scenarios
- **WHEN** `buildSecurityReviewerBundle` runs
- **THEN** the bundle includes the change diff (or a summary), the 12 security criteria from the `security-criteria` spec, and the scenarios relevant to security (auth, input handling, file ops, secrets)
- **THEN** the bundle size is at most 60 KB

#### Scenario: verifier bundle contains scenarios, commands, diff-stat
- **WHEN** `buildVerifierBundle` runs
- **THEN** the bundle includes the spec scenarios, the project commands from the `@repo-scout` cache, and `git diff --stat`
- **THEN** the bundle size is at most 60 KB

#### Scenario: bundle passed by path in invocation message
- **WHEN** the orchestrator invokes an agent
- **THEN** the message is `"Change: <name>. Context bundle: <path>. Read it first."`
- **THEN** the `OPENCODE_CONTEXT_BUNDLE` environment variable is not set

#### Scenario: large diff triggers summarization
- **WHEN** the diff exceeds the 60 KB budget
- **THEN** a summary plus file list is produced and the full diff path is included in the bundle for on-demand reading
- **THEN** the bundle size remains at most 60 KB

### Requirement: Repo-scout cache
`@repo-scout` results MUST be cached per git HEAD under `.opencode/cache/scout-<HEAD>.md`, and the cache MUST be reused for subsequent agents in the same run. A HEAD change MUST invalidate the cache so `@repo-scout` runs again.

#### Scenario: scout cache written once per HEAD
- **WHEN** the first agent needs scout data
- **THEN** `@repo-scout` is invoked and its result is cached to `.opencode/cache/scout-<HEAD>.md`
- **WHEN** subsequent agents need scout data in the same run
- **THEN** the cache is reused and no additional `@repo-scout` invocation occurs

#### Scenario: cache invalidated on HEAD change
- **WHEN** `git rev-parse HEAD` differs from the cached HEAD
- **THEN** the cache is missed and `@repo-scout` is invoked again

### Requirement: Machine-readable verdict contract
Every agent invocation MUST write a verdict JSON artifact at `.opencode/run/<change>/<agent>-verdict.json`. An agent that produces the artifact MUST exit 0 regardless of the verdict value, while an infrastructure failure (spawn error, timeout, or missing artifact) MUST exit non-zero. The orchestrator MUST read the JSON artifact to determine the verdict, ignoring the exit code for verdict judgment.

#### Scenario: agents write verdict JSON
- **WHEN** an agent completes
- **THEN** it writes `.opencode/run/<change>/<agent>-verdict.json` with `agent`, `verdict` (`PASS`/`FAIL`/`UNVERIFIABLE`), `findings` (each with `id`, `severity`, `status`, `evidence`, and optional `file`/`line`), and `summary`

#### Scenario: exit code 0 on artifact production
- **WHEN** an agent produces verdict JSON (any verdict)
- **THEN** the exit code is 0
- **WHEN** an infrastructure failure occurs (spawn error, timeout, or no artifact)
- **THEN** the exit code is non-zero

#### Scenario: orchestrator reads JSON for judgment
- **WHEN** the orchestrator collects a gate result
- **THEN** it reads the verdict JSON and ignores the exit code for verdict judgment
- **THEN** `verdict=FAIL` routes findings to the developer
- **THEN** `verdict=UNVERIFIABLE` is recorded with justification

#### Scenario: developer/test-engineer also read bundle
- **WHEN** the developer or test-engineer is invoked
- **THEN** it reads the bundle from the path in the message
- **THEN** no `OPENCODE_CONTEXT_BUNDLE` environment variable is used
