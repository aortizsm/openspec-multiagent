# Design

## Result Contract

- **status**: Ready for implementation approval.
- **executive_summary**: Add a copyable, non-active OpenCode JSONC example assigning MiMo-V2.6-Flash to the primary session and high-volume agents, and GLM-5.3-Flash to code and security review. Link it from existing docs and validate its syntax and mapping without changing current project or global settings.
- **artifacts**: `proposal.md`; new `specs/agent-model-routing/spec.md`; this `design.md`; `tasks.md`; new `opencode.models.example.jsonc`; updates to `tests/lib.test.mjs`, `README.md`, `docs/guides/agent-workflow.md`, `docs/changes/2026-11-13-add-agent-model-routing-template.md`, and `docs/CHANGELOG.md`.
- **risks**: The example could be mistaken for an active config or its Go model IDs could become unavailable. Keep the example filename non-loadable, document explicit copy/auth steps, and note that users must verify model availability and current Go limits.
- **next_recommended**: After approval, write a JSONC parsing test first, add the template and usage guidance, then run npm tests and strict OpenSpec validation.

## Context

See `proposal.md` for motivation. The repository installs nine agent prompts globally or per-project but has no model-routing configuration. The Go IDs and OpenCode V2 agent config shape are known; the target project currently has no `opencode.json` or `.opencode/opencode.jsonc`, and the source agent prompts contain no model fields.

## Goals / Non-Goals

**Goals:**
- Provide a ready-to-copy profile for the nine bundled roles using only the user's selected OpenCode Go models.
- Keep the template inert until copied to an OpenCode-recognized project config filename.
- Keep credentials outside the repository and explain that the Go allowance is model-scoped and Extra Usage can incur pay-as-you-go charges.
- Make the example's JSONC syntax and agent mapping testable without calling a provider.

**Non-Goals:**
- Create or modify an active `opencode.json(c)` for this repository or change global OpenCode settings.
- Install/configure provider credentials, enable Extra Usage, enforce a hard spend cap, or connect a provider.
- Change agent prompts, runtime/orchestration code, agent order, or quality gates.
- Add a model fallback, automatic risk routing, or provider API calls to the test suite.

## Decisions

- Store the sample at repository root as `opencode.models.example.jsonc`. OpenCode auto-discovers `opencode.json(c)` and `.opencode/opencode.json(c)`, not this example name; users explicitly copy it to one of those paths to activate it.
- Set root `model` to `opencode-go/mimo-v2.6-flash`, which is the default model for new primary sessions, including the user's normal `@architect` session. Assign MiMo-V2.6-Flash to `developer`, `test-engineer`, `verifier`, `ux-designer`, `repo-scout`, and `diff-summarizer`; assign `opencode-go/glm-5.3-flash` to `code-reviewer` and `security-reviewer`. `@architect` is represented by the root session model, not an agent override, because OpenCode keeps a primary session's selected model separately.
- Keep provider sign-in external: instructions direct users to `/connect` and note that configured model IDs must appear in the current `/models` catalog. Include no API keys or credential values.
- Add a single high-value test using the existing `readJsonc` helper to parse the example and assert the root model, exact bundled subagent mapping, and absence of credential fields. Do not make network calls or validate model quality through the test harness.
- Keep README as a short entry point; add copy/use details to `docs/guides/agent-workflow.md`, which is already an explicitly user-requested English guide. Add the usual Spanish change note and changelog link.
- After all gates, archive the OpenSpec change and have `@developer` create and push the user-requested commit containing all pending workspace changes. Prior completed changes retain their own archived records.

Alternative considered: write the actual project `opencode.jsonc` now. Rejected because that would silently set a provider/model for every session in this repository and could affect other contributors; the user asked for a reusable template for other projects.

## Risks / Trade-offs

- **[Risk] Users assume the example is already active** → Use a clearly non-loadable filename and document the explicit copy-to-config step.
- **[Risk] A Go model ID or per-model allowance changes** → Link to current OpenCode Go docs and require users to confirm the ID in `/models`; do not promise a global $60 limit.
- **[Risk] Template model mapping is mistaken for an API credential setup** → Keep secrets out of the file and document `/connect` separately.
- **[Trade-off] The example is not automatically included in another project** → Manual copying keeps this repository's own settings unchanged and makes the sample portable.

## Migration Plan

No migration is required. The template has no effect until copied into a target project's recognized OpenCode config path. Existing global agent prompts and provider connections remain unchanged.
