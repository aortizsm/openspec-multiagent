# Spec Delta

## MODIFIED Requirements

### Requirement: Code-reviewer y security-reviewer en paralelo
El `architect` MUST ejecutar `@code-reviewer` y `@security-reviewer` en paralelo después de que `@developer` complete la implementación y `@test-engineer` termine de generar las pruebas.

#### Scenario: Ejecución paralela
- **WHEN** `@developer` completa la implementación y `@test-engineer` termina correctamente
- **THEN** el `architect` inicia `@code-reviewer` y `@security-reviewer` al mismo tiempo y espera a ambos

#### Scenario: Verifier follows successful reviews
- **WHEN** `@test-engineer` y ambos revisores terminan correctamente
- **THEN** el `architect` inicia `@verifier`; si falla cualquier fase de calidad, `@verifier` no se ejecuta

## ADDED Requirements

### Requirement: Test engineer runs before parallel reviews
El `architect` MUST ejecutar `@test-engineer` después de `@developer` y completar esa fase antes de iniciar las revisiones paralelas.

#### Scenario: Test engineering precedes review
- **WHEN** `@developer` completa la implementación
- **THEN** `@test-engineer` genera pruebas basadas en la spec antes de que empiecen los revisores

#### Scenario: Test engineer failure blocks reviews
- **WHEN** `@test-engineer` falla
- **THEN** `@code-reviewer`, `@security-reviewer` y `@verifier` no se ejecutan

## REMOVED Requirements

### Requirement: Test engineer joins the parallel quality phase
**Reason**: Generar tests en paralelo con revisiones puede hacer que los revisores evalúen el cambio antes de que existan los tests finales.
**Migration**: Ejecutar y completar `@test-engineer` primero; después ejecutar `@code-reviewer` y `@security-reviewer` en paralelo.
