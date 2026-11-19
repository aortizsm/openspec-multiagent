# Spec Delta

## REMOVED Requirements

### Requirement: Single correction attempt for future changes
**Reason**: It contradicted the per-change allowance (three numbers were in force at once: this one said one attempt, the allowance requirement defaulted to one for a different consumer, and the prose said three), it was implemented nowhere, and clamping the cycle to a single attempt is what forced hand-authorised extra rounds when the open findings were cosmetic.
**Migration**: Use the declared per-change allowance with its default of three rounds, and let round consumption follow acceptance. Non-convergence stops the cycle earlier than any allowance would.

## MODIFIED Requirements

### Requirement: Correction allowance is declared per change
The correction allowance for a change MUST be resolved from the change's own OpenSpec configuration, accepting both `correction_rounds` and the extension spelling `x-correction_rounds` in `openspec/changes/<name>/.openspec.yaml`, and MUST NOT be keyed on a change name. The architect-led cycle consumes the allowance and defaults to three rounds when the change declares none. A declared value that is not a positive integer MUST fail closed with a clear error before any agent runs.

#### Scenario: Declared allowance is used
- **WHEN** a change declares a valid `correction_rounds` value and acceptance-blocking findings require correction
- **THEN** the cycle runs correction bundles and quality reruns up to the declared allowance before stopping

#### Scenario: Change declares no allowance
- **WHEN** a change has no `correction_rounds` in its configuration
- **THEN** the cycle allows three correction rounds

#### Scenario: Declared allowance is invalid
- **WHEN** the configuration declares a value that is not a positive integer
- **THEN** the cycle fails closed with a clear error before reading change files or starting an agent

#### Scenario: Extension spelling is accepted
- **WHEN** a change declares its allowance with the OpenSpec extension spelling `x-correction_rounds`
- **THEN** the cycle honours it exactly as it honours the unprefixed key

## ADDED Requirements

### Requirement: Round consumption follows acceptance
A correction round MUST be consumed only by findings that block acceptance: a `CRITICAL`, or a `WARNING` linked to an acceptance criterion or scenario. Any other finding — a `SUGGESTION`, a documentation or ledger bookkeeping correction, or a pre-existing issue outside the change's scope — MUST be recorded with its disposition and MUST NOT consume a round or block archive.

#### Scenario: Only acceptance-blocking findings consume a round
- **WHEN** a quality phase or the verifier reports findings and none of them blocks acceptance
- **THEN** the architect records each disposition and continues to verification and archive without starting a correction round

#### Scenario: Acceptance-blocking finding consumes a round
- **WHEN** a `CRITICAL` or a `WARNING` linked to an acceptance criterion is open
- **THEN** it consumes one correction round and blocks archive until it is resolved

### Requirement: Correction cycle stops on non-convergence
The cycle MUST stop and report the ledger to the user, without archiving, when the same finding is submitted again after being resolved or when the developer and a reviewer cannot agree on the same finding, unless new evidence is presented. This stop applies whatever the remaining allowance.

#### Scenario: Resolved finding returns without new evidence
- **WHEN** a finding already marked resolved is reported again without new evidence
- **THEN** the architect stops the cycle, reports the ledger, and does not archive, whatever the allowance

#### Scenario: Developer and reviewer disagree
- **WHEN** the developer and a reviewer hold incompatible positions on the same finding after one correction
- **THEN** the architect stops and reports the disagreement to the user instead of sending another bundle

#### Scenario: Reviewer classification stands without new evidence
- **WHEN** a reviewer classifies a finding as linked to an acceptance criterion and the architect would classify it as non-blocking
- **THEN** the reviewer's classification stands unless new evidence is recorded, and a reviewer who insists without new evidence triggers the non-convergence stop

### Requirement: Re-verification is proportional to the correction
A correction that changes no behaviour — comments, documentation, or ledger evidence — MUST be confirmed with the finding's source agent and the affected checks instead of restarting the full quality sequence. A correction that changes behaviour, tests or specifications MUST restart the complete quality sequence before verification.

#### Scenario: Behaviour-preserving correction
- **WHEN** a correction touches only comments, documentation or ledger evidence
- **THEN** the finding's source agent confirms closure and the affected checks are re-run, without restarting the full sequence

#### Scenario: Behaviour-changing correction
- **WHEN** a correction changes behaviour, tests or specifications
- **THEN** the complete quality sequence runs again before the verifier
