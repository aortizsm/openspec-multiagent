# Proposal

## Intent

Turn the architect prompt into one coherent definition: it is currently a bad merge of two different versions of the same document, so the agent reads duplicated sections, a dead copy of its own permissions, and a stray delimiter.

## Why

`opencode/agents/architect.md` is 714 lines, of which roughly 190 are duplicative or inert:

- Six sections appear **verbatim twice**: `A) Preflight`, `B) Project awareness`, `C) Discovery and alignment`, `## Aprobación del diseño y ejecución del change`, `## Memory (Engram)` and `## OpenSpec Guidance`. Verified by comparing both copies section by section; they are byte-identical.
- A **dead copy of the frontmatter `permissions:` block** sits in the body (lines ~444-522). It is inert for permissions, because OpenCode parses only the leading frontmatter, but it is read as guidance, so a stale or contradictory permission list there is a trap — it has already forced this batch to keep two copies of the edit allowlist in sync.
- A stray `---` at line 523 splits the file, and the second copy carries the sections the first one lacks (`D) Implementation and review loop`, `E) Close the spec (archive)`), while the first carries what the second lacks (`## Read-only Database Reviews`, `D) Subagent delegation — pass full context`, 275 lines of delegation guidance).

The consequence is not cosmetic: the agent reads the same instructions twice, the duplicated block created a real trap reviewed twice in this batch, and any future edit has to be applied in two places or the file drifts further. A reviewer of two earlier changes conditioned this batch on deleting that block "so the file does not keep a third source of truth".

## What Changes

- Consolidate the file into one definition: keep the effective frontmatter, then `## Read-only Database Reviews`, `A) Preflight`, `B) Project awareness`, `## Aprobación del diseño y ejecución del change`, `C) Discovery and alignment`, `## Memory (Engram)`, `## OpenSpec Guidance`, `D) Subagent delegation — pass full context`, `E) Implementation and review loop` and `F) Close the spec (archive)`, each exactly once, with the two former `D)` sections renumbered.
- Delete the dead body copy of the `permissions:` block and the stray `---`.
- Preserve every unique section byte for byte; the consolidation removes duplicates, not content.
- Update the regression tests whose assertions encode the current duplication: the counts that require exactly two occurrences must require exactly one once the duplicate copy is gone.
- Add a capability for agent-definition integrity, so the property "one definition per agent file" is written down and checkable, and record the consolidation's content-preservation invariant.

## Capabilities

### New Capabilities

- `agent-definition-integrity`: each agent definition under `opencode/agents/` contains exactly one definition — a single frontmatter block, one copy of each guidance section, no permissions block in the body, and no orphan delimiter — and consolidation preserves every unique section.

## Impact

- `opencode/agents/architect.md` — the consolidation; roughly 190 lines removed, no unique content lost.
- `.opencode/agents/architect.md` — reconciled byte-identical to the source.
- `tests/run.mjs` — the duplicated-occurrence counts drop to one, plus new assertions for the single-definition property.
- New capability spec, `docs/guides/agent-workflow.md` if it describes the prompt structure, change note and changelog.
- No runtime code, no permission change, and no behaviour change: the consolidation removes text the agent already reads twice and a block that has no effect on permissions.
