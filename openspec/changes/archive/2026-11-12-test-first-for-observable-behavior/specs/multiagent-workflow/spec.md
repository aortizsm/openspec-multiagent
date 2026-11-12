# Spec Delta

## MODIFIED Requirements

### Requirement: Developer uses test-first for observable behavior
When observable implementation behavior has a practical, high-value deterministic black-box test, `@developer` MUST create or update the test before implementing that behavior, observe the expected failure, then implement until the test passes. When no such test is appropriate, `@developer` MUST explain why and run applicable checks.

#### Scenario: Behavior has a deterministic test
- **WHEN** a change requests observable behavior with a clear expected outcome and an applicable deterministic test
- **THEN** `@developer` writes or updates a high-value black-box test first, observes the missing behavior fail, implements the behavior, and verifies the test passes

#### Scenario: Behavior has no meaningful test
- **WHEN** a change is documentation- or prompt-only, or no practical deterministic test can establish the requested outcome
- **THEN** `@developer` does not force a test, records the reason in the completion report, and runs applicable checks

### Requirement: Test engineer complements developer-authored tests
After implementation, `@test-engineer` MUST inspect existing tests against the OpenSpec scenarios and add only missing high-value scenario or edge-case coverage. It MUST NOT duplicate tests that already provide adequate coverage, and MUST remain before the parallel code and security reviews.

#### Scenario: Developer tests already cover the scenario
- **WHEN** `@developer` has added a high-value test that adequately covers an OpenSpec scenario
- **THEN** `@test-engineer` reuses that coverage and does not add a duplicate test

#### Scenario: Scenario coverage is missing
- **WHEN** an OpenSpec scenario or valuable edge case lacks adequate test coverage
- **THEN** `@test-engineer` adds the smallest useful test for the uncovered behavior before code and security review begin

#### Scenario: Scenario has no meaningful deterministic test
- **WHEN** an OpenSpec scenario describes documentation, prompt guidance, or behavior without a practical deterministic test
- **THEN** `@test-engineer` records the scenario as not meaningfully testable with a reason and does not force a test for it
