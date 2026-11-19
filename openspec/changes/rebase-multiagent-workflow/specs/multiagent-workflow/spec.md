# Spec Delta

## REMOVED Requirements

### Requirement: Automatic mode preserves conditional UX review
**Reason**: The automatic orchestration mode with conditional UX review was designed but never implemented. The current workflow uses an architect-led manual cycle with explicit approval gates, not an automatic mode with conditional UX.

### Requirement: Automatic findings reconcile with the actual ledger
**Reason**: No automatic reconciliation of findings with the ledger exists. The architect manually consolidates findings and the verifier checks them. No automatic reconciliation exists.

### Requirement: Automatic reviewer dispositions remain explicit
**Reason**: No automatic reviewer disposition system exists. Reviewer findings are recorded in the ledger by the architect during the review phase. No automatic disposition system exists.

### Requirement: Automatic verifier coverage matches the change specs
**Reason**: The verifier runs tests and checks spec compliance, but there is no automatic mapping of verifier results to change spec scenarios. The verifier reports PASS/FAIL/UNVERIFIABLE per scenario, but this is done by the verifier agent, not an automatic system.

### Requirement: Automatic process cancellation is bounded
**Reason**: No automatic process cancellation mechanism exists. The orchestrator does not implement automatic cancellation; processes are managed manually or via the architect's commands.

### Requirement: Automatic agent output preserves UTF-8 boundaries
**Reason**: Agent output handling is managed by the OpenCode framework, not by an automatic system in this toolkit. No special UTF-8 preservation mechanism exists beyond what the terminal/shell provides.

### Requirement: Automatic change names have bounded length
**Reason**: Change name validation IS implemented (via `validateChangeName` in `scripts/orchestrate.mjs` which enforces 128-character limit and valid characters), but it is not "automatic" in the sense of an automatic orchestration mode. The validation is a manual gate in the orchestrator, not an automatic system. The requirement is renamed/kept without "Automatic" prefix.

### Requirement: Single correction attempt for future changes
**Reason**: Superseded by the `correction-round-governance` change, which established a per-change correction allowance (default three rounds, declared per change) consumed only by acceptance-blocking findings. The "single correction attempt" rule contradicted the new rule and was never implemented (the orchestrator never enforced it).

### Requirement: Structured outcomes gate automatic orchestration
**Reason**: No automatic orchestration mode exists. The orchestrator runs agents sequentially without a structured outcomes gate. The architect controls the flow manually.

### Requirement: Orchestration integration audit before approval
**Reason**: No automatic orchestration exists to audit. The architect manually reviews the plan before delegating.

### Requirement: Review content is treated as untrusted data
**Reason**: This is already enforced by the `correction-round-governance` rules (reviewer content treated as untrusted, parameter binding required for queries, no interpolation of untrusted values). The requirement is redundant.

### Requirement: Review ledger input is bounded
**Reason**: Ledger input bounds are enforced by the `correction-round-governance` rules (1 MiB limit, 64 nesting levels, 2000 model limit, 256 variants). This requirement is redundant.

## MODIFIED Requirements

### Requirement: Correction allowance is declared per change
The correction allowance for a change MUST be declared in its own OpenSpec configuration, accepting both `correction_rounds` and the OpenSpec extension spelling `x-correction_rounds` in `openspec/changes/<name>/.openspec.yaml`, and MUST NOT be keyed on a change name. The architect-led cycle consumes the allowance and defaults to three rounds when the change declares none. A declared value that is not a positive integer MUST fail closed with a clear error before reading change files or starting any agent.

#### Scenario: Declared allowance is used
- **WHEN** a change declares a valid `correction_rounds` value and acceptance-blocking findings require correction
- **THEN** the architect-led cycle runs correction bundles and quality reruns up to the declared allowance before stopping

#### Scenario: Change declares no allowance
- **WHEN** a change has no `correction_rounds` in its configuration
- **THEN** the architect-led cycle allows three correction rounds

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

### Requirement: Re-verification is proportional to the correction
A correction that changes no behaviour — comments, documentation, or ledger evidence — MUST be confirmed with the finding's source agent and the affected checks re-run, without restarting the full quality sequence. A correction that changes behaviour, tests or specifications MUST restart the complete quality sequence before verification.

#### Scenario: Behaviour-preserving correction
- **WHEN** a correction touches only comments, documentation, or ledger evidence
- **THEN** the finding's source agent confirms closure and the affected checks are re-run

#### Scenario: Behaviour-changing correction
- **WHEN** a correction changes behaviour, tests or specifications
- **THEN** the complete quality sequence runs again before verification