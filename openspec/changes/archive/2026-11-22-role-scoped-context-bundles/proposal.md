# Proposal

## Intent

Replace the single monolithic `OPENCODE_CONTEXT_BUNDLE` (injected via env var but unread by any agent) with role-scoped context bundles written to files, passed by path in the invocation message. Each agent receives only what it needs, bounded by a 60 KB budget, with machine-first JSON verdicts replacing free-text output parsing.

## Why

1. **Bundle is invisible**: `OPENCODE_CONTEXT_BUNDLE` is injected but no agent prompt reads it. Agents re-read files from disk or rely on the architect's task description — duplicating I/O and tokens.
2. **One size fits none**: Developer needs tasks+specs+design decisions; test-engineer needs scenarios+coverage map; code-reviewer needs diff+clean-code criteria; security-reviewer needs diff+security criteria; verifier needs scenarios+commands+diff-stat. Sending everything to everyone wastes 50-70% tokens.
3. **No output contract**: Reviewers and verifier emit free text. Orchestrator parses exit codes only, losing structured findings, severity, evidence. No machine-readable consolidation.
4. **No diff budgeting**: Large diffs blow context window. No summarization fallback.
5. **Repo-scout repeated**: Each agent could call `@repo-scout` independently. Should cache once per HEAD.

## What Changes

### 2.1 Role-Scoped Bundles on Disk
- Eliminate `OPENCODE_CONTEXT_BUNDLE` env var (confirmed unread).
- Write `.opencode/run/<change>/<agent>-bundle.md` per role:
  - **developer**: tasks + specs + design (decisions only) + scout cache + previous findings
  - **test-engineer**: spec scenarios + developer's coverage map + test conventions
  - **code-reviewer**: diff + scenarios + clean-code criteria (12 rules)
  - **security-reviewer**: diff + security criteria (12 rules) + relevant scenarios
  - **verifier**: scenarios + project commands + diff --stat
- Pass bundle PATH in invocation message: `"Change: <name>. Context bundle: <path>. Read it first."`
- Budget: 60 KB per bundle. If diff exceeds: `@diff-summarizer` summary + file list; full diff as path for on-demand read.

### 2.2 Repo-Scout Cache
- `.opencode/cache/scout-<HEAD>.md` — cached once per HEAD.
- Reused across all gates in a run; invalidated only when HEAD changes.

### 2.3 Machine-First Verdict Contract
- Reviewers and verifier write `.opencode/run/<change>/<agent>-verdict.json`:
  ```json
  {
    "agent": "code-reviewer",
    "verdict": "PASS|FAIL|UNVERIFIABLE",
    "findings": [
      {"id": "RF-001", "severity": "CRITICAL|WARNING|SUGGESTION", "status": "open", "evidence": "...", "file": "src/x.ts", "line": 42}
    ],
    "summary": "≤5 lines"
  }
  ```
- Exit code 0 whenever verdict artifact is produced (even if `verdict=FAIL`); ≠0 only for infrastructure failure (spawn error, timeout).
- Orchestrator reads JSON for judgment, not exit code.
- Update prompts for all 5 agents + developer/test-engineer to read their bundle file first.
- Prompts assume NO prompt caching; work identically with local and cloud models.

## Acceptance Criteria

- Each bundle contains only its role's content (test per role); none exceeds 60 KB budget.
- Verdict JSON parseable gates the pipeline; `FAIL` routes to developer, no blind retry.
- `@repo-scout` invoked 1× per HEAD across 5 gates.
- Large diff triggers summarization; full diff available on-demand.