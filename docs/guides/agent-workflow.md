# Agent workflow

This guide describes the standard OpenSpec workflow and the boundaries of the nine agent definitions maintained in `opencode/agents/`. Those prompts and the OpenSpec requirements are authoritative; this guide is an overview, not a replacement for them.

## Standard sequence

1. **`@architect` prepares the change.** It clarifies the request, creates the OpenSpec proposal, design, specs, and tasks, and presents the completed design for one explicit user approval. No delegated agent starts before that approval.
2. **Conditional UI design.** For a change with UI/UX requirements, `@architect` invokes `@ux-designer` before implementation. The designer reviews the requirements and provides design recommendations; it does not edit code.
3. **`@developer` implements in two internal stages.** In the functional stage, it keeps correctness and security active, uses conditional test-first for observable behavior when a practical, high-value deterministic black-box test exists, and reaches green applicable tests/checks. If no meaningful deterministic test applies, it records why and runs applicable checks. Only then does it perform a focused, behavior-preserving clean-code refinement against all 12 criteria, without speculative performance tuning unless a requirement or measured bottleneck justifies it. It reruns applicable tests/checks after refinement and hands off only when the criteria and checks pass. These internal stages do not add or reorder external agents.
4. **`@test-engineer` complements coverage.** After implementation, it compares existing tests—including developer-authored tests—with the OpenSpec scenarios. It reuses adequate coverage and adds only missing high-value scenario or edge-case tests. For a scenario without a meaningful deterministic test, it records that status with a rationale rather than forcing a test. After adding or changing a test, it runs the permitted test commands and reports the observed result with the added tests; if those commands cannot run in its environment, it declares the added tests as unexecuted and identifies them so `@architect` or `@verifier` validates them.
5. **Parallel reviews.** After the test-engineer finishes, `@code-reviewer` and `@security-reviewer` review in parallel. Neither can modify files; they return approval or actionable findings.
6. **`@verifier` independently checks the change.** Only after the test-engineer and both reviewers succeed, the verifier runs the project's permitted test/build/lint/typecheck commands and reports evidence per scenario.
7. **`@architect` validates and closes.** It handles findings through the required correction cycle, checks the final gates, and is the only agent that archives the OpenSpec change. A failed gate stops archive.

The standard quality sequence is `@developer → @test-engineer → [@code-reviewer + @security-reviewer] → @verifier`. `@architect` owns the design approval before it and validation/archive after it. A correction restarts the full quality sequence; no gate is skipped. The workflow permits at most three correction rounds.

## Agent responsibilities and boundaries

### Core workflow

| Agent | Phase and trigger | Responsibilities and output | Does not |
|---|---|---|---|
| **`@architect`** | Leads every change; starts after the request and obtains the one design approval before delegating. | Defines the OpenSpec artifacts and acceptance criteria, delegates each phase with context, consolidates review findings, enforces validation gates, and reports the outcome. It executes the project's own commands itself — its scripts, database clients, and analysis/build/verification tooling — and never delegates a command it can run to the user. It edits only the process record: `openspec/**`, `AGENTS.md`, `opencode/agents/*`, `.opencode/agents/*`, `README.md` and `docs/**`; shell is an execution channel, never an editing route. | Implement source changes. Tests, application source and scripts/** go to @developer via a tasks.md row. It alone archives, and only after the required quality, verification, and validation gates pass. |
| **`@developer`** | Implementation, after design approval and any conditional UI-design phase. | Implements the approved tasks, uses conditional RED/GREEN test-first for observable behavior where a practical high-value deterministic black-box test exists, runs applicable checks, and reports completion or the reason a test was not appropriate. | Add brittle tests of internals or exact prompt wording, or skip applicable checks. |
| **`@test-engineer`** | Sequential test phase after implementation and before both parallel reviews. | Inspects existing tests against every OpenSpec scenario, reuses adequate developer-authored tests, writes only missing high-value scenario/edge-case coverage, runs the permitted test commands after adding or changing a test, and reports the observed result; reports each scenario as adequately covered, covered by a useful new test, or not meaningfully testable with a rationale. | Duplicate adequate tests, force low-value tests, modify the implementation, or change the workflow order. |
| **`@code-reviewer`** | First parallel review, after `@test-engineer` succeeds. | Reviews the diff against the change, correctness, maintainability, and high-ROI test coverage; returns approval or severity-tagged, actionable change requests. It may run permitted test commands as a review sanity check. | Modify files, make implementation decisions outside the approved scope, or archive the change. |
| **`@security-reviewer`** | Runs in parallel with `@code-reviewer` after `@test-engineer` succeeds. | Evaluates the diff against the repository's 12 security criteria and returns approval or severity-tagged findings with locations. | Modify code, perform implementation, or archive the change. |
| **`@verifier`** | Independent verification after the test-engineer and both parallel reviews succeed. | Runs declared, permitted project checks and returns PASS/FAIL/UNVERIFIABLE evidence for each spec scenario and requirement. | Edit or create files, install dependencies, mutate shared state, or approve/archive on behalf of the architect. |

### Conditional UI phase

| Agent | Phase and trigger | Responsibilities and output | Does not |
|---|---|---|---|
| **`@ux-designer`** | Before implementation only when the change has UI/UX requirements. | Reviews UX completeness, consistency, and accessibility; provides ASCII wireframes, design tokens, component specifications, and/or review findings as relevant. | Edit code or run unrestricted shell commands; it is not a mandatory stage for non-UI changes. |

### Optional support agents

These read-only agents can be called when useful. They are not required pipeline stages and do not replace any quality gate.

| Agent | Phase and trigger | Responsibilities and output | Does not |
|---|---|---|---|
| **`@repo-scout`** | Optional discovery when the repository or its conventions are unfamiliar. | Reports the detected stack, repository conventions, commands, structure, and relevant open questions from repository evidence. | Modify files, install dependencies, use network access, or recommend speculative changes. |
| **`@diff-summarizer`** | Optional orientation when a change set or diff is large or hard to scan. | Reads the actual diff and returns a terse per-file/group summary with risk hotspots or signs of incompleteness. | Modify files, propose fixes, or conduct a style review. |

## Findings and corrections

After a quality phase, `@architect` sends one consolidated, traceable correction bundle to `@developer` and maintains the findings ledger in the change's `tasks.md`. Each correction round repeats `@test-engineer`, then both parallel reviewers; the verifier runs only after all quality agents succeed. A verifier failure is included in a later correction bundle when a round remains. After three rounds, unresolved required findings or a verifier failure stop the workflow; the change is not archived.

## Source of truth

The installed prompts in `opencode/agents/`, the current OpenSpec change, `AGENTS.md`, and the applicable OpenSpec specs define exact permissions and gates. When this overview and those sources differ, follow the authoritative prompt and spec. The broader project documentation is Spanish by default; this guide is in English at the user's explicit request for this individual document.

## Optional per-project model routing

### Interactive model selector

`npx openspec-multiagent init` installs the TUI plugin once under the user's global OpenCode plugin directory: `$XDG_CONFIG_HOME/opencode/plugins/agent-models/`, or the default OpenCode config directory (`~/.config/opencode` on macOS/Linux, `%APPDATA%/opencode` on Windows). Re-running initialization skips an existing global copy. OpenCode discovers this plugin across projects, so initialization does not create a project-local `.opencode/plugins/agent-models/` copy. This toolkit checkout also uses the global selector and does not include a project-local copy.

The standalone installer uses the same destination. Run these commands from any project to preview, install, or explicitly refresh the global copy:

```bash
npx --yes --package=github:aortizsm/openspec-multiagent openspec-multiagent-install-agent-models --dry-run
npx --yes --package=github:aortizsm/openspec-multiagent openspec-multiagent-install-agent-models
npx --yes --package=github:aortizsm/openspec-multiagent openspec-multiagent-install-agent-models --force
```

The installer does not edit the user's global `opencode.json` or `cli.json`, and intentionally leaves older project-local copies untouched. Removing the duplicate from this toolkit checkout does not remove copies in other target projects; those remain user-managed. If `.opencode/plugins/agent-models/` in a target project is known to be a toolkit-managed copy, inspect it and remove it manually only after confirming it contains no custom files or edits:

```bash
# From the target project, only after confirming this copy has no custom files or edits:
rm -rf .opencode/plugins/agent-models
```

Never remove an uncertain or customized directory.

In any project, run `/agent-models` in OpenCode to view the bundled roles and their current assignments, including configured model IDs that are not currently available.

The selector refreshes OpenCode's model catalog for the active project location and offers only models available to `/models`. For a subagent, it also offers the model's available variants and `Default (no variant)`. `@architect` offers models without variants because the root project `model` setting does not persist one.

For safety, project config is limited to 1 MiB and 64 nesting levels; catalogs are limited to 2,000 models and each model to 256 variants. Exceeding a limit displays an error and leaves the assignment unchanged.

Subagent assignments are written to `agents.<id>.model`. Existing OpenCode model selectors in string or object form are displayed; a replacement is saved as a validated `provider/model[#variant]` string. Selecting `@architect` requires explicit confirmation and sets the project root `model`, which applies to all primary agents in newly created sessions; an already-open session keeps its selected model. The globally installed selector reads the model catalog at the active project location and writes only that project's effective recognized configuration, preserving unrelated JSONC settings/comments. If no recognized config exists, it creates `.opencode/opencode.jsonc`. Assignments are never stored in user-level configuration, so projects remain independent. Escape or cancel at any point before saving leaves configuration unchanged. An empty or unavailable catalog, invalid config, or write failure is reported without a success message or partial config write.

If multiple recognized configs exist, the selector updates the project file OpenCode merges last: `.opencode/` configs override project-root configs; within `.opencode/`, `opencode.jsonc` follows `opencode.json`, while at project root `opencode.json` follows `opencode.jsonc`.

The GitHub package source works without publishing or changing the package's `private` setting. Existing global plugin copies are skipped unless `--force` is supplied; `--dry-run` shows the global target without writing.

Race-resistant plugin installation and model persistence use Linux `/proc/self/fd` descriptor-relative operations. On platforms without this facility, installation fails without copying the global plugin, and selection fails without changing project configuration.

The repository-root file `opencode.models.example.jsonc` is a copyable example, not an active OpenCode config. OpenCode discovers project configuration under `opencode.json`/`opencode.jsonc` or `.opencode/opencode.json`/`.opencode/opencode.jsonc`; it does not load the example filename. From the repository root, copy it into the target project using either supported path:

```bash
cp opencode.models.example.jsonc /path/to/target-project/opencode.jsonc
# Or:
mkdir -p /path/to/target-project/.opencode
cp opencode.models.example.jsonc /path/to/target-project/.opencode/opencode.jsonc
```

The template's root `model` is the default for new primary sessions. It uses `opencode-go/mimo-v2.6-flash`, so a new primary `@architect` session starts with MiMo unless the session already has a model selected. Root defaults do not replace a model already selected for an existing session.

The eight subagent overrides are:

| Agent IDs | Model |
|---|---|
| `developer`, `test-engineer`, `verifier`, `ux-designer`, `repo-scout`, `diff-summarizer` | `opencode-go/mimo-v2.6-flash` |
| `code-reviewer`, `security-reviewer` | `opencode-go/glm-5.3-flash` |

The `agents.<id>.model` entries add model overrides to the installed agents. They do not replace globally installed prompt text or permissions. The `@architect` role is the primary session, not a subagent entry; set or select its model with the root default/session selection.

Connect provider access separately in OpenCode with `/connect`, choose OpenCode Go, and use `/models` to confirm the model IDs are available. The example contains no provider credentials. OpenCode Go usage limits are tracked per model, and included limits vary by model rather than forming a shared global cap. Enabling Extra Usage may permit additional pay-as-you-go charges after included limits are reached; this template imposes no global spending cap. Check the [current Go usage and billing terms](https://opencode.ai/docs/console/go/) before enabling Extra Usage.

For configuration discovery and model merging, see OpenCode's [configuration](https://opencode.ai/docs/config/), [agents](https://opencode.ai/docs/agents/), [models](https://opencode.ai/docs/models/), and [provider connection](https://opencode.ai/docs/providers/) documentation.
