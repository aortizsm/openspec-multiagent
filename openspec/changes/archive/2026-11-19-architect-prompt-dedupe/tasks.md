# Tasks

## 1. Consolidate the prompt

- [x] 1.1 In `opencode/agents/architect.md`, keep one copy of the six sections that appear verbatim twice — `A) Preflight`, `B) Project awareness`, `C) Discovery and alignment`, `## Aprobación del diseño y ejecución del change`, `## Memory (Engram)` and `## OpenSpec Guidance` (with its five subsections) — deleting the second copy of each and leaving the first occurrence in place.
- [x] 1.2 Delete the dead copy of the `permissions:` block that sits in the body (lines ~444-522) and the stray `---` that splits the file, so the file has exactly two delimiters: the frontmatter's.
- [x] 1.3 Preserve, byte for byte, the sections that exist in only one copy: `## Read-only Database Reviews` and `D) Subagent delegation — pass full context` (from the first copy), plus `D) Implementation and review loop` and `E) Close the spec (archive)` (from the second). Renumber the latter two to `E)` and `F)` so the sequence is `A`, `B`, `C`, `D`, `E`, `F` without collision, and leave `D) Subagent delegation` as `D)`.
- [x] 1.4 Before renumbering, search the prompt for cross-references to section letters (`D)`, `E)`, "section D") and report the result; adjust any reference that the renumbering invalidates.
- [x] 1.5 Reconcile `.opencode/agents/architect.md` so it is byte-identical to the source, and verify `diff` reports no difference.
- [x] 1.6 Change no instruction sentence: the diff must be deletions, the renumbering, and nothing else. Verify by comparing the section bodies before and after (see task 3.1) and by reading the diff.

## 2. Capability delta

- [x] 2.1 Ship the new `agent-definition-integrity` capability with its two requirements and five scenarios. Verify `openspec validate architect-prompt-dedupe --strict` passes and keep each requirement text under 500 characters.

## 3. Tests

- [x] 3.1 Add a section-inventory regression to `tests/run.mjs` that reads both copies of the prompt and asserts: exactly two `---` delimiters; each expected section heading present exactly once; no `permissions:` outside the frontmatter; and the unique sections (`## Read-only Database Reviews`, `D) Subagent delegation`, `E) Implementation and review loop`, `F) Close the spec (archive)`) present. Keep helpers at 15 or fewer non-comment, non-blank lines.
- [x] 3.2 Update the assertions that encode the current duplication so they require **one** occurrence instead of two: the writable-resources phrase, `Never use shell commands to edit files`, and each `edit` grant entry. This dependency was recorded when it was created; leaving it would make the suite fail for a legitimate reason.
- [x] 3.3 Run `npm test` and report the full output, confirming that no assertion was deleted and that the count updates are the only change to existing expectations.

## 4. Documentation and validation

- [x] 4.1 Add the Spanish six-section change note `docs/changes/2026-11-19-architect-prompt-dedupe.md`, link it from `docs/CHANGELOG.md`, and restate the user-level reinstall step. Verify the note describes only what the diff does.
- [x] 4.2 Run `npm test`, `npm run check`, `openspec validate architect-prompt-dedupe --strict`, and `git diff --check`; verify the new inventory regression fails against the pre-consolidation file and passes after it, and that the diff removes roughly 190 lines without touching instruction text.

## Review Findings

Correction round: 1 of 3

| ID | Source agent(s) | Severity | Linked criterion/scenario | File / location | Requested correction | Status | Closure evidence / rationale |
|---|---|---|---|---|---|---|---|
| RF-001 | architect (pre-review measurement), confirmed by code-reviewer | WARNING | Clean-code criteria 2 and 3 (function length, SRP) | `tests/run.mjs` (`assertSingleDefinition`) | The new helper measures 27 non-comment, non-blank lines and handles four distinct responsibilities (delimiters, heading uniqueness, `permissions:` in the body, unique sections). Split it into helpers of at most 15 lines without dropping any of the four assertions. | resolved | Split into `assertFrontmatterDelimiters`, `assertExpectedHeadingsUnique`, `assertNoBodyPermissions`, `assertUniqueSectionsPresent` (each ≤9 lines), plus `assertSingleDefinition` orchestrator (7 lines); all four original assertions preserved. |

| RF-002 | code-reviewer | SUGGESTION | Scenario 2 ("Ninguna sección de guía duplicada"); the change's own claim that duplication cannot return silently | `tests/run.mjs:1136-1142` | The check iterates `EXPECTED_HEADINGS`, so a **new** duplicated heading passes silently. Extract every heading (`/^#{1,6} .+$/gm` plus the `^[A-F]\) ` lines) and assert that none repeats, instead of only walking the expected list. | resolved | Added `allHeadings` (markdown `^#{1,6} ` plus lettered `^[A-F]\) ` headings) and `assertNoRepeatedHeadings`, which asserts every heading in the file appears exactly once; mutation with a duplicated heading outside `EXPECTED_HEADINGS` fails the suite. |
| RF-003 | code-reviewer | SUGGESTION | Scenarios 4 and 5 (content preservation) verification record | `docs/changes/2026-11-19-architect-prompt-dedupe.md` | The reviewer accepts that content preservation is verified by the diff against the previous revision rather than by a permanent test, but the change note should say so explicitly, so the verification basis is on record. | resolved | Evidence section records that scenarios 4 and 5 were verified by comparing the consolidated file with `git show HEAD:opencode/agents/architect.md` (714 → 482 lines, 2 added, 234 deleted, byte-identical sections), not by a permanent test, since consolidation is a one-off operation. |

### Accepted review positions

- The reviewer accepted the 2→1 assertion changes as still significant, and confirmed by reading the code that reintroducing the dead block or a duplicated prose section would fail the suite.
- The reviewer accepted that scenarios 4 and 5 are not permanently testable from a single file, so the spec does not need reformulating; only the verification basis needs to be recorded (RF-003).

### Declined suggestions and their destination

| ID | Source | Suggestion | Disposition |
|---|---|---|---|
| RF-004 | code-reviewer | `allHeadings` matches `^[A-F]\) `, so a duplicated heading outside A-F (for example `G) Foo`) would pass; widening the range to `[A-Z]` closes it. | Not adopted here: the case requires someone to add a **duplicated** heading outside the letters the prompt uses, while the gate already catches the historical duplication and any new duplicate in the real forms. Carried to `enforcement-guards`, where the general agent-definition integrity check belongs. |
| RF-005 | code-reviewer | Rename `assertNoBodyPermissions` and `assertNoRepeatedHeadings` to positive forms (criterion 12). | Not adopted: assertion-helper naming only, with no effect on coverage, and the reviewer rated it low priority. |
| RF-006 | code-reviewer | Extract `assertEachOccursOnce` to remove the four-line overlap between `assertExpectedHeadingsUnique` and `assertUniqueSectionsPresent`. | Not adopted: below the criterion-4 threshold of five lines, and the explicit loop documents the change's preservation invariant. |
| RF-007 | code-reviewer | `countOccurrences(prompt, heading)` counts a heading anywhere in the text, so prose that cited an expected heading literally would make the test fail spuriously; anchoring to `^...$` with the `m` flag would be exact. | Not adopted: no such citation exists, and the shared counter is also used for phrases where substring counting is intended. Carried to `enforcement-guards` with RF-004, since the general check should anchor headings to line start. |

### Deviation found during the architect's pre-archive verification

| ID | Source | Observation | Disposition |
|---|---|---|---|
| RO-001 | architect | The implementation created `openspec/specs/agent-definition-integrity/spec.md` ahead of time, with a purpose and requirements the change never asked for. That file is created by `openspec archive` from the delta, so keeping it would have produced a duplicated requirement with a slightly different title ("Una definición por archivo de agente" against the delta's "Una sola definición por archivo de agente"). | Removed before the commit; the archive creates the spec from the delta. The purpose is written by the architect at the archive step, as in the two previous changes. |
