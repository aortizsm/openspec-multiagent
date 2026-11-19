# Proposal

## Intent

Make every question to the user go through the OpenCode question menu, for every agent, with no exceptions: the architect asks directly, subagents relay through the architect, and no agent presents a question as a numbered list in the chat.

## Why

The architect prompt forbids the menu for anything except the final approval:

> **Discovery questions**: Use natural conversation, NOT the `question` tool. List questions with numbered items and let the user answer in text. The `question` tool is ONLY for approval gates (yes/no decisions to proceed). — `opencode/agents/architect.md`, both occurrences

A user working in another project received nine numbered design questions in plain chat where eight of them had two or three concrete options. That is the prompt being obeyed, and it is not an isolated case: the same instruction produces the same outcome every time.

Two written rules disagree with it. `AGENTS.md` requires the `question` tool with selectable options, and the `agent-menu-instructions` capability already states that user decisions delegate to `@architect`, who uses the OpenCode selection menu. The `multiagent-workflow` discovery requirement compounds it by requiring the architect to ask "in natural conversation".

The objection to using the menu for open questions does not hold: the tool always offers a free-form answer alongside the options, so a menu never prevents a different reply.

## What Changes

- Replace the "Discovery questions" bullet in both `opencode/agents/architect.md` occurrences with the rule: every question to the user uses the `question` tool with selectable options, in a single call, including open questions.
- Align the `multiagent-workflow` discovery requirement: material questions are asked through the menu, not "in natural conversation"; the per-turn cap is replaced by asking them together in one call.
- Extend the `agent-menu-instructions` capability so it covers the architect's own questions, not only the delegation note in the subagent files.
- Record the rule in `AGENTS.md` alongside the existing approval-menu convention.
- Add a contract regression over both prompt copies, and update the workflow guide, the change note and the changelog.

## Capabilities

### Modified Capabilities

- `multiagent-workflow`: the two-stage discovery requirement asks its questions through the OpenCode question menu instead of natural conversation, in one call rather than two per turn.
- `agent-menu-instructions`: adds the requirement that every question to the user reaches them through the menu, asked by the architect and relayed by subagents.

## Impact

- `opencode/agents/architect.md` — both occurrences of the discovery-questions bullet (the other eight agent files already carry the delegation note and need no change).
- `.opencode/agents/architect.md` — reconciled to the source, byte-identical.
- `openspec/specs/multiagent-workflow/spec.md` and `openspec/specs/agent-menu-instructions/spec.md` via the change delta.
- `AGENTS.md`, `docs/guides/agent-workflow.md`, `docs/changes/2026-11-19-architect-question-menu.md`, `docs/CHANGELOG.md`.
- `tests/run.mjs` — contract regression over both prompt copies.
- No runtime code, no new dependency, no permission change. The user-level reinstall propagates the rule to other projects, as with the previous changes in this batch.
