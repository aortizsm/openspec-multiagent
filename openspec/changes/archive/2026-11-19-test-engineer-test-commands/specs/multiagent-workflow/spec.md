# Spec Delta

## ADDED Requirements

### Requirement: Test engineer keeps a least-privilege shell boundary
`@test-engineer` MUST have shell access limited to read-only auxiliary commands and the project's test commands. It MUST NOT have unrestricted shell access, and it MUST NOT be granted build, check, deploy, or service-management commands.

#### Scenario: Test commands are permitted
- **WHEN** a maintainer inspects the `@test-engineer` agent permissions
- **THEN** the project's test command family is permitted, including the package-manager test scripts and the language-specific runners such as `phpunit`, `artisan test`, and `pytest`

#### Scenario: Unrestricted shell stays denied
- **WHEN** a maintainer inspects the `@test-engineer` agent permissions
- **THEN** `shell: "*"` is denied and only the auxiliary read-only commands plus the test command family are permitted

#### Scenario: Non-test commands stay out of the allowlist
- **WHEN** a maintainer inspects the `@test-engineer` agent permissions
- **THEN** the repository readiness, build, deploy, and service commands are not permitted for this agent

## MODIFIED Requirements

### Requirement: Test engineer complements developer-authored tests
After implementation, `@test-engineer` MUST inspect existing tests against the OpenSpec scenarios and add only missing high-value scenario or edge-case coverage. It MUST NOT duplicate tests that already provide adequate coverage, and MUST remain before the parallel code and security reviews. It MUST validate the tests it adds by running the project's permitted test commands, or report them as unexecuted when those commands cannot run.

#### Scenario: Developer tests already cover the scenario
- **WHEN** `@developer` has added a high-value test that adequately covers an OpenSpec scenario
- **THEN** `@test-engineer` reuses that coverage and does not add a duplicate test

#### Scenario: Scenario coverage is missing
- **WHEN** an OpenSpec scenario or valuable edge case lacks adequate test coverage
- **THEN** `@test-engineer` adds the smallest useful test for the uncovered behavior before code and security review begin

#### Scenario: Scenario has no meaningful deterministic test
- **WHEN** an OpenSpec scenario describes documentation, prompt guidance, or behavior without a practical deterministic test
- **THEN** `@test-engineer` records the scenario as not meaningfully testable with a reason and does not force a test

#### Scenario: Added tests are validated before the reviews start
- **WHEN** `@test-engineer` adds or changes a test and the project's permitted test commands can run
- **THEN** it executes them, reports the observed pass or fail result with the added tests, and fixes or reports a failure before the parallel code and security reviews begin

#### Scenario: Permitted test commands cannot run
- **WHEN** the permitted test commands cannot run in the test-engineer's environment
- **THEN** it declares the added tests as unexecuted and identifies them in its report so the architect or the verifier validates them, instead of implying they passed
