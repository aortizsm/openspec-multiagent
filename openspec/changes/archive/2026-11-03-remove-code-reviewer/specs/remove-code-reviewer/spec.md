# remove-code-reviewer Specification

## Purpose

Quitar @code-reviewer del flujo normal de revisión del @architect, dejando solo a @security-reviewer como revisor único de seguridad y spec compliance antes de @verifier.

## ADDED Requirements

### Requirement: Un solo revisor de seguridad

El `architect` MUST invocar solo a @security-reviewer después de que @developer complete la implementación, en lugar de invocar a @code-reviewer y @security-reviewer en paralelo.

#### Scenario: Un solo revisor
- **WHEN** @developer reporta completitud de un cambio
- **THEN** el `architect` invoca a @security-reviewer (no a @code-reviewer)
- **THEN** el `architect` espera a que @security-reviewer reporte antes de continuar

### Requirement: @security-reviewer debe aprobar antes de @verifier

El `architect` MUST requerir aprobación de @security-reviewer antes de pasar a @verifier.

#### Scenario: Aprobación de seguridad antes de verifier
- **WHEN** @security-reviewer ha sido invocado
- **THEN** el `architect` no invoca a @verifier hasta que @security-reviewer haya aprobado
- **THEN** si @security-reviewer solicita cambios, el `architect` los envía a @developer y repite el ciclo

### Requirement: Sección E de archivo actualizada

El `architect` MUST requerir solo la aprobación de @security-reviewer (no de ambos revisores) para archivar un cambio.

#### Scenario: Archivo con un solo revisor
- **WHEN** el `architect` verifica las condiciones de archivo
- **THEN** la condición de aprobación de @code-reviewer se elimina
- **THEN** solo se requiere aprobación de @security-reviewer