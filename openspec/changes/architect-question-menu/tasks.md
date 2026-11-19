# Tasks

## 1. Prompt

- [ ] 1.1 Replace the "Discovery questions" bullet in **both** occurrences of `opencode/agents/architect.md` — the current text is `- **Discovery questions**: Use natural conversation, NOT the `question` tool. List questions with numbered items and let the user answer in text. The `question` tool is ONLY for approval gates (yes/no decisions to proceed).` — with the menu rule: every question to the user, including open ones, is asked through the `question` tool in a single call, and never as a numbered list in the chat; the tool always offers a free-form answer. Verify both occurrences are identical and that the phrase `NOT the `question` tool` no longer appears.
- [ ] 1.2 Reconcile `.opencode/agents/architect.md` so it stays byte-identical to the source, and verify `diff` reports no difference.
- [ ] 1.3 Add the same rule to `AGENTS.md`, next to the existing approval-menu convention, so the project record states one channel for every question. Do not change the existing rules that there is a single design approval and no intermediate approvals during the loop.
- [ ] 1.4 Do not touch the eight subagent files: they already carry the delegation note ("report it to @architect, who will use the OpenCode selection menu"), which is the mechanism this change relies on, and the `agent-menu-instructions` capability forbids changing agent permissions.

## 2. Capability deltas

- [ ] 2.1 Ship the `multiagent-workflow` delta: the two-stage discovery requirement asks its material questions through the OpenCode question menu in a single call instead of "in natural conversation", with the two new scenarios. Keep the requirement text under 500 characters.
- [ ] 2.2 Ship the `agent-menu-instructions` delta with the new requirement "Toda pregunta al usuario usa el menú de selección" and its five scenarios.
- [ ] 2.3 Verify `openspec validate architect-question-menu --strict` passes and that the `multiagent-workflow` MODIFIED header matches the existing requirement exactly.

## 3. Documentation

- [ ] 3.1 Update `docs/guides/agent-workflow.md` so no statement asks for questions in prose or numbered lists, and the guide matches the prompt.
- [ ] 3.2 Add the Spanish six-section change note `docs/changes/2026-11-19-architect-question-menu.md`, link it from `docs/CHANGELOG.md`, and state that the user-level reinstall (`node scripts/install-agents.mjs --force`) is the migration that propagates the rule to other projects. Verify the note describes only what the prompt and the specs implement.

## 4. Regression coverage and integration validation

- [ ] 4.1 Add a contract regression to `tests/run.mjs` that reads both `opencode/agents/architect.md` and `.opencode/agents/architect.md` and asserts, for each occurrence: the menu rule for every question is present (the `question` tool, a single call, the free-form alternative), and the alternative instruction is gone (`natural conversation`, `NOT the `question` tool`, numbered items as the channel for questions). Use bounded regexes and keep each helper at 15 or fewer non-comment, non-blank lines.
- [ ] 4.2 Run `npm test`, `npm run check`, `openspec validate architect-question-menu --strict`, and `git diff --check`; verify the new regression fails against the previous prompt and passes after the change, that the byte-identity test still passes, and that no other agent's prompt or permissions changed.
