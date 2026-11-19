# Design

## status

Design ready for user approval.

## executive_summary

Make the OpenCode question menu the only channel for questions to the user: the architect asks directly, subagents relay through it, and plain numbered question lists are removed as a practice. Today the architect prompt forbids the tool for everything except the final approval, which is why the user receives design questions as prose in the chat even when every question offers two or three concrete options. The menu always offers a free-form answer, so this does not restrict what the user can reply. No runtime code, no permission change.

## artifacts

- `proposal.md` — intent, evidence, and scope.
- `specs/multiagent-workflow/spec.md` — delta aligning the discovery requirement with the menu.
- `specs/agent-menu-instructions/spec.md` — delta covering every agent's questions.
- `design.md` — the rule, its rationale, and risks.
- `tasks.md` — implementation and validation checklist.

## Context

Three written rules govern this today and two of them disagree with the one the architect follows:

- `opencode/agents/architect.md` (both occurrences): discovery questions use natural conversation and numbered items, and the `question` tool is reserved for approval gates.
- `AGENTS.md`: the single design approval uses the `question` tool with selectable options, never asking the user to type a specific word.
- `openspec/specs/multiagent-workflow/spec.md`: the architect asks unresolved material questions "in natural conversation, at most two per turn".
- `openspec/specs/agent-menu-instructions/spec.md`: every agent file carries a note that user decisions delegate to `@architect`, who uses the OpenCode selection menu. The eight subagent files already carry that note; the architect is the one that asks.

## Goals / Non-Goals

**Goals:**

- One channel for every question to the user, with no exceptions by question type.
- The architect asks all of a round's questions in a single menu call, so the user answers in one place instead of writing prose for each.
- The frequency rules stay as they are: one design approval, no intermediate approvals during the loop.

**Non-Goals:**

- Change when the architect asks: the single design approval and the "no intermediate approvals" rule are untouched.
- Change any agent's permissions or capabilities, which the `agent-menu-instructions` capability already forbids.
- Change how subagents reach the user: they cannot invoke the tool and keep reporting to the architect.
- De-duplicate the malformed architect prompt, which is a separate change in this batch.

## Decisions

1. **The rule is about the channel, not about the question type.** Options are added where they exist; open questions go through the menu anyway, because the tool always offers a free-form answer. Splitting "discrete decisions use the menu, open questions use text" would recreate the ambiguity that produced this behaviour ruling.
2. **One call per round of questions.** The menu accepts several questions in one call, which replaces the per-turn cap as the way to bound interruption while letting the user answer everything in one pass.
3. **The architect is the channel for subagents.** The delegation note already in all eight subagent files is the mechanism; nothing in those files needs to change, so the prohibition on permission changes holds.
4. **Fix the requirement that sanctions the wrong behaviour.** The discovery requirement says "in natural conversation", which is why the prompt bullet looked correct in the first place. Both are corrected together, so the prompt and the spec agree.
5. **Keep the menu mandatory rather than recommended.** A recommendation is what the guidance effectively was, and it lost to the more specific instruction. The prompt states the rule as a prohibition on the alternative channel ("never as plain numbered text").
6. **The approval gate is already correct.** It uses selectable options and accepts a natural answer; the change only extends the same mechanism to every other question, so the two rules merge into one.

## risks

- [A menu could hide the reasoning behind a question] → The question text carries the context, and the menu's free-form option lets the user answer beyond the offered choices.
- [Asking many questions in one call could overwhelm] → The alternative today is the same number of questions as numbered prose, which is strictly worse to answer; the call is bounded to the material questions of the round.
- [The rule could be read as requiring a menu for purely informational messages] → The requirement covers questions; a status report or a design summary stays prose, and the tests assert the prohibition on the question-shaped alternative only.
- [Subagents could start asking the user directly] → They cannot invoke the tool; their existing delegation note is unchanged and is asserted by the `agent-menu-instructions` scenarios.
- [Prompt-only enforcement can drift again] → Two contract regressions over both copies assert the menu rule is present and that the natural-conversation instruction is gone.

## Migration Plan

No data or runtime migration. The corrected prompt applies in this repository immediately, because OpenCode reads the project-local definition. Other projects pick it up with the single user-level reinstall (`node scripts/install-agents.mjs --force`) that closes this batch.

## next_recommended

Obtain user approval, then update both prompt occurrences, AGENTS.md, the two capability deltas, the contract regression and the documentation, and run `npm test`, `npm run check`, and strict OpenSpec validation.
