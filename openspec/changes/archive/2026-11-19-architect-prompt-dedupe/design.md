# Design

## status

Design ready for user approval.

## executive_summary

`opencode/agents/architect.md` is a bad merge of two versions of the same prompt: six sections appear verbatim twice, a dead copy of the frontmatter permissions block sits in the body, and a stray `---` splits the file — while each copy also holds sections the other lacks. Consolidate it into one definition, preserving every unique section, renumbering the two former section `D)`s, updating the tests that assert the duplication, and writing down the "one definition per agent file" property in a new capability so it can be checked.

## artifacts

- `proposal.md` — intent, evidence, and scope.
- `specs/agent-definition-integrity/spec.md` — the new capability.
- `design.md` — the consolidation plan, section by section, and its invariants.
- `tasks.md` — implementation and validation checklist.

## Context

Measured structure of the file before this change (714 lines):

| Range | Content |
|---|---|
| 1-83 | Effective frontmatter: `description`, `mode`, `permissions` |
| 85-121 | `## Read-only Database Reviews` — **unique to this copy** |
| 122-143 | `A) Preflight` |
| 144-155 | `B) Project awareness` |
| 156-159 | `## Aprobación del diseño y ejecución del change` |
| 160-161 | `C) Discovery and alignment` |
| 162-190 | `## Memory (Engram)` |
| 191-246 | `## OpenSpec Guidance` and its five subsections |
| 247-443 | `D) Subagent delegation — pass full context` — **unique to this copy**, 275 lines |
| 444-522 | Dead copy of the frontmatter `permissions:` block |
| 523 | Stray `---` |
| 524-714 | Second copy: the same six sections verbatim, then `D) Implementation and review loop` and `E) Close the spec (archive)` — **unique to this copy** |

The six repeated sections were compared line by line and are identical. The two copies were produced by concatenating two versions of the same document: one where section `D)` is the subagent delegation guidance, and one where it is the implementation and review loop.

## Goals / Non-Goals

**Goals:**

- One definition, read once by the agent: no duplicated section, no inert permissions copy, no orphan delimiter.
- Zero content loss: every unique section survives byte for byte.
- The duplication cannot come back silently: the single-definition property is written down as a requirement and asserted in the tests.

**Non-Goals:**

- Change any instruction: this is a structural change, so no sentence of guidance may be reworded beyond the renumbering of the two sections.
- Change permissions: the effective frontmatter is preserved as is.
- De-duplicate the eight subagent files or any other agent definition, unless the measurements show the same defect (out of scope unless found).
- Implement the general guard that would check every agent file mechanically; that belongs to `enforcement-guards`.

## Decisions

1. **Consolidate by keeping one copy of every section, not by choosing a version.** Both copies carry unique material, so the result is the union, ordered as the document already reads: frontmatter, `## Read-only Database Reviews`, `A`, `B`, `## Aprobación`, `C`, `## Memory (Engram)`, `## OpenSpec Guidance`, `D) Subagent delegation`, `E) Implementation and review loop`, `F) Close the spec (archive)`.
2. **Renumber the two former `D)` sections.** The delegation guidance keeps `D)`; the implementation and review loop and the archive section move to `E)` and `F)`. Renumbering is the only textual change beyond deletion, and the tests assert the new letters so the sequence cannot silently collide again.
3. **Delete the dead permissions block and the stray delimiter.** The block is what forced this batch to keep two copies of the edit allowlist aligned; deleting it removes the third source of truth the reviewer asked to eliminate.
4. **Preserve unique sections byte for byte.** The consolidation is verified by a section inventory before and after: the same headings, the same bodies, minus the documented removals. This is the change's central invariant, and it is stated as a requirement rather than left to review.
5. **Update the duplication-dependent assertions in the same change.** `tests/run.mjs` currently requires exactly two occurrences of the writable-resources phrase, of `Never use shell commands to edit files`, and of each `edit` grant. Once the duplicate copy is gone those counts must become one, or the suite fails for a legitimate reason. This dependency was recorded when it was created.
6. **Write the property down as a capability.** The requirement "one definition per agent file" is what makes this structural defect checkable in the future, and it is the natural home for the guard that `enforcement-guards` will implement.

## risks

- [Content loss during consolidation] → The section inventory is compared before and after, and a test asserts that every expected section heading and each unique section's body is present. Any deliberate removal must be documented with its reason.
- [Hidden duplication inside a section] → The comparison is per section body, not per heading; identical duplicate sections were identified by comparing their full text, not their titles.
- [The tests fail for a legitimate reason after the deletion] → That is the known dependency recorded in the previous change; updating those counts is an explicit task here, not an afterthought.
- [Renumbering could break a reference to a section letter elsewhere] → The prompt's own cross-references are searched for `D)` references before the renumbering, and the grep result is reported.
- [The file is the most load-bearing prompt in the repository] → No instruction text is reworded; the diff is deletions, one renumbering, and the test updates, so the change is auditable line by line.

## Migration Plan

No data or runtime migration. The consolidated prompt applies in this repository immediately, because OpenCode reads the project-local definition. Other projects pick it up with the single user-level reinstall (`node scripts/install-agents.mjs --force`) that closes this batch.

## next_recommended

Obtain user approval, then consolidate the file, reconcile the installed copy, ship the capability delta, update the duplication-dependent assertions, add the single-definition assertions, update the documentation, and run `npm test`, `npm run check`, and strict OpenSpec validation.
