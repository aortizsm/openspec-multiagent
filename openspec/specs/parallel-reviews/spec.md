# parallel-reviews Specification

## Purpose
Paralelizar las revisiones de code-reviewer y security-reviewer en el flujo del @architect, reduciendo el tiempo de espera sin perder cobertura de revisión.

## Requirements

### Requirement: Code-reviewer y security-reviewer en paralelo
El `architect` MUST ejecutar `@code-reviewer` y `@security-reviewer` en paralelo después de que `@developer` complete la implementación y `@test-engineer` termine de generar las pruebas.

#### Scenario: Ejecución paralela
- **WHEN** `@developer` completa la implementación y `@test-engineer` termina correctamente
- **THEN** el `architect` inicia `@code-reviewer` y `@security-reviewer` al mismo tiempo y espera a ambos

#### Scenario: Verifier follows successful reviews
- **WHEN** `@test-engineer` y ambos revisores terminan correctamente
- **THEN** el `architect` inicia `@verifier`; si falla cualquier fase de calidad, `@verifier` no se ejecuta

### Requirement: Ambos deben aprobar

El `architect` MUST requerir aprobación de ambos agentes antes de pasar a @verifier.

#### Scenario: Ambas aprobaciones requeridas
- **WHEN** @code-reviewer y @security-reviewer han sido invocados
- **THEN** el `architect` no invoca a @verifier hasta que ambos hayan aprobado
- **THEN** si cualquiera solicita cambios, el `architect` los envía a @developer y repite el ciclo

### Requirement: @verifier después de ambas aprobaciones

El `architect` MUST invocar a @verifier solo después de que @code-reviewer y @security-reviewer hayan aprobado.

#### Scenario: Verifier después de revisiones
- **WHEN** @code-reviewer y @security-reviewer han aprobado
- **THEN** el `architect` invoca a @verifier para verificación independiente de escenarios de la spec

### Requirement: Verifier waits for the complete quality phase
In a standard full `@architect` run, the orchestrator MUST NOT run `@verifier` until all three quality agents complete successfully.

#### Scenario: All quality agents pass
- **WHEN** `@test-engineer`, `@code-reviewer`, and `@security-reviewer` complete successfully
- **THEN** the orchestrator continues to `@verifier`

#### Scenario: A quality agent fails
- **WHEN** any of the three quality agents fails
- **THEN** the orchestrator does not run `@verifier` and returns control for correction

### Requirement: Test engineer runs before parallel reviews
El `architect` MUST ejecutar `@test-engineer` después de `@developer` y completar esa fase antes de iniciar las revisiones paralelas.

#### Scenario: Test engineering precedes review
- **WHEN** `@developer` completa la implementación
- **THEN** `@test-engineer` genera pruebas basadas en la spec antes de que empiecen los revisores

#### Scenario: Test engineer failure blocks reviews
- **WHEN** `@test-engineer` falla
- **THEN** `@code-reviewer`, `@security-reviewer` y `@verifier` no se ejecutan
