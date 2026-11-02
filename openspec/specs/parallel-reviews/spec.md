# parallel-reviews Specification

## Purpose
Paralelizar las revisiones de code-reviewer y security-reviewer en el flujo del @architect, reduciendo el tiempo de espera sin perder cobertura de revisión.

## Requirements

### Requirement: Code-reviewer y security-reviewer en paralelo

El `architect` MUST invocar a @code-reviewer y @security-reviewer en paralelo después de que @developer complete la implementación.

#### Scenario: Ejecución paralela
- **WHEN** @developer reporta completitud de un cambio
- **THEN** el `architect` invoca a @code-reviewer y @security-reviewer al mismo tiempo
- **THEN** el `architect` espera a que ambos reporten antes de continuar

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
