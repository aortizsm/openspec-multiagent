# Tasks

## 1. Remove the repository-local duplicate

- [x] 1.1 Delete the tracked `.opencode/plugins/agent-models/` copy; verify the directory is absent while `opencode/plugins/agent-models/` and the installed user-global plugin remain unchanged.

## 2. Document the cleanup

- [x] 2.1 Clarify in `docs/guides/agent-workflow.md` that this toolkit checkout uses the global selector and that older project-local copies in target projects remain user-managed; verify the guidance preserves the installer's non-destructive behavior.
- [x] 2.2 Add a Spanish six-section change note and link it from `docs/CHANGELOG.md`; verify the note accurately distinguishes the expected TUI/Server plugin parts from the removed local-vs-global duplicate.

## 3. Integration validation

- [x] 3.1 Run `npm test`, `npm run check`, `openspec validate remove-duplicate-agent-model-plugin --strict`, and `git diff --check`; verify canonical plugin sources and user-global files are untouched and the only removed runtime files are the tracked local duplicate.

## Review Findings

Correction round: 1 of 3

| ID | Source agent(s) | Severity | Linked criterion/scenario | File / location | Requested correction | Status | Closure evidence / rationale |
|---|---|---|---|---|---|---|---|
| RF-001 | code-reviewer | WARNING | Task 3.1 — integration validation; exact `npm run check` evidence | `tasks.md:14` | Run `npm run check` and record its complete output and exit status in the task evidence so the review gate has verifiable command evidence. | resolved | `npm run check` passed; complete output and exit status are recorded below. |

### RF-001 closure evidence

Command: `npm run check`

```text
> openspec-multiagent@1.1.0 check
> node scripts/check.mjs

node: ok (22.23.5)
openspec: ok (1.14.3)
skills: ok (4 found)
context7: ok (/home/noesis/.config/opencode/opencode.json)
engram: ok (configured (1) and installed)
filesystem: ok (configurado en MCP)
github: ok (configurado en MCP)
---
status: READY
config: /home/noesis/.config/opencode/opencode.json

EXIT STATUS: 0
```

## Workflow follow-up

- Archive this change after all review, security, and verification gates pass.
