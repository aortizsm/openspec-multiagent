# Spec Delta

## ADDED Requirements

### Requirement: Architect consolidates actionable findings
After each quality phase, the `@architect` MUST send `@developer` one correction bundle that includes every distinct actionable finding and maps each to its source, severity, acceptance criterion, location, requested change, and closure evidence.

#### Scenario: Duplicate findings share a root cause
- **WHEN** multiple quality agents report the same underlying issue
- **THEN** the architect merges it into one bundle entry, lists every source, and preserves the highest severity

#### Scenario: Distinct findings remain separate
- **WHEN** findings concern different root causes or acceptance criteria
- **THEN** the architect keeps separate bundle entries and does not discard or silently merge them

#### Scenario: Verifier failure becomes actionable feedback
- **WHEN** `@verifier` reports a `FAIL` before the third correction round is complete
- **THEN** the architect adds the failed scenario and its evidence to the next correction bundle

### Requirement: Review findings stay traceable across rounds
The `@architect` MUST keep a review findings ledger in the change's `tasks.md`; each entry MUST have a stable ID, source agent(s), severity, linked acceptance criterion or scenario, file/location, requested correction, status (`open`, `resolved`, or `not adopted`), and closure evidence or rationale. Resolved findings MUST NOT reopen without new evidence; a declined `SUGGESTION` MUST retain its rationale and MUST NOT block archive.

#### Scenario: Finding is resolved with evidence
- **WHEN** the developer supplies the requested correction and evidence
- **THEN** the architect marks that finding resolved and carries its status into the next review round

#### Scenario: Resolved finding has no new evidence
- **WHEN** a reviewer repeats a resolved finding without new evidence
- **THEN** the architect does not reopen it

#### Scenario: Optional suggestion is declined
- **WHEN** the developer declines a `SUGGESTION`
- **THEN** the architect records the rationale without treating it as a blocking finding

### Requirement: Correction rounds are bounded
The `@architect` MUST allow at most three correction rounds per change. Each round MUST include one consolidated bundle, a developer correction, a full quality rerun (`@test-engineer`, then parallel code/security reviewers), and independent verification after all quality agents succeed. After round three, required findings still open or a verifier `FAIL` MUST be reported and MUST prevent archive; the architect MUST NOT start a fourth correction round.

#### Scenario: Corrected change passes the full gates
- **WHEN** the developer addresses the consolidated bundle and the full quality sequence and verifier pass
- **THEN** the architect closes the round and may proceed to the final archive gate

#### Scenario: Required findings remain after three rounds
- **WHEN** a `CRITICAL` or `WARNING` finding remains open after three correction rounds
- **THEN** the architect stops, reports the unresolved findings, and does not archive

#### Scenario: Verifier fails after the third correction round
- **WHEN** `@verifier` reports a `FAIL` after the third correction round
- **THEN** the architect records and reports the failed scenario and evidence, does not start a fourth correction round, and does not archive
