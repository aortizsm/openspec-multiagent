# Tasks

## 1. Version the configuration files

- [x] 1.1 Add `opencode.json` at the repository root with the current global configuration, replacing the literal value of `mcp.servers.github.env.GITHUB_TOKEN` with `{env:GITHUB_TOKEN}`; verify no literal token remains with a repository-wide search for the previous value.
- [x] 1.2 Remove the ignore rule for `.opencode/opencode.jsonc` so its model routing is versioned, and commit that file unchanged; keep `.opencode/run/` and `.opencode/cache/` ignored because they hold regenerated orchestrator runtime artifacts (security review RF-002); verify `git status --ignored` reports only those two runtime directories as ignored and the routing content is byte-identical to the previous working copy.

## 2. Guidance and documentation

- [x] 2.1 Update `AGENTS.md` so versioned project configuration is allowed and only the global user config stays prohibited for agents; verify the text matches the new rule.
- [x] 2.2 Add the Spanish change entry and changelog link describing the versioned `.opencode/` folder, the required local adjustments and the regenerated runtime artifacts; verify both files reference the change correctly.

## 3. Verification

- [x] 3.1 Run `npm test` and `openspec validate version-opencode-configs --strict`; verify they pass and that the committed configuration contains no credential.

## Review Findings

Correction round: 1 of 3 (change declares no `x-correction_rounds`; default allowance)

| ID | Source agent(s) | Severity | Linked criterion/scenario | File/location | Requested correction | Status | Closure evidence/rationale |
|---|---|---|---|---|---|---|---|
| RF-001 | security-reviewer | CRITICAL | Criterion 1 (no hardcoded secrets); declared linked by the reviewer | `opencode.json:31`; historical location `~/.config/opencode/opencode.json` (outside the repo) | Treat the previously cleartext GitHub token as exposed: revoke it, issue a new PAT, set it as the `GITHUB_TOKEN` environment variable and never reuse the old value. | resolved | The reporting reviewer reclassified this finding on re-check, with new evidence recorded here: criterion 1 evaluates repository content, and the staged content satisfies it — zero literal token occurrences in the staged diff, in `opencode.json` and in tracked files, with `opencode.json:31` using `{env:GITHUB_TOKEN}`. The historical exposure lives in the user's global config outside this repository, so rotation is an external user prerequisite documented in the change entry, not a repo defect. Reviewers' re-check: RF-002 resolved, no new findings. |
| RF-002 | security-reviewer | WARNING | Data-leakage hygiene; declared NOT linked to an acceptance criterion | `.gitignore:15`; `.opencode/run/`, `.opencode/cache/` | Re-add ignore rules for `.opencode/run/` and `.opencode/cache/`, keeping only `.opencode/opencode.jsonc` versioned, because those directories hold per-change diffs, context bundles, verdicts, telemetry and the scout cache that could be pushed to this public repository. | resolved | Rules re-added with their explanatory comment; `git check-ignore -v` confirms `.opencode/run/` and `.opencode/cache/` are ignored while `.opencode/opencode.jsonc` is not. Change entry and changelog corrected so they no longer claim the whole `.opencode/` folder is versioned. `openspec validate --strict` passes, `npm test` 246 passed, and zero literal token occurrences in the working tree and staged content. |
| RF-003 | security-reviewer | SUGGESTION | Portability; declared NOT linked to an acceptance criterion | `opencode.json:40,46,67` | Keep the per-machine adjustment documented and confirm the intent of the `market` MCP command, which points outside the repository. | resolved | Kept documented: the change entry lists the per-machine values to adjust and the intent of the external `market` path was surfaced to the user. No credential involved; non-blocking suggestion. |

