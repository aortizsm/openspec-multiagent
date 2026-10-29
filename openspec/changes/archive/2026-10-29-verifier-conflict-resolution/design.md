# Design

## Context

El `@verifier` reporta estados de implementación de requerimientos (`implementado`, `parcialmente implementado`, `no implementado`). El `@architect` revisa estos reportes y puede estar en desacuerdo con el veredicto del verifier. Sin una regla explícita, no hay autoridad de último recurso definida.

## Goals / Non-Goals

**Goals:**
- Que exista una autoridad de último recurso para desacuerdos sobre estados de requerimiento.
- Que el `@verifier` mantenga su rol de solo reportar, sin poder de decisión.

**Non-Goals:**
- Automatizar la resolución de conflictos.
- Permitir que el `@verifier` decida o modifique código.

## Decisions

### D1. @architect tiene la última palabra

El architect es quien archiva cambios y conoce el contexto completo del proyecto. Es la autoridad natural para decidir si un requerimiento está implementado o no.

### D2. @verifier solo reporta

Mantener la separación autor/verificador. El verifier nunca debe tener poder de decisión sobre si un cambio se archiva o no.

## Risks / Trade-offs

- **Cuello de botella en @architect**: cada desacuerdo requiere intervención del architect. Mitigación: los desacuerdos deberían ser raros si la spec está bien redactada.
- **Subjetividad residual**: el architect puede interpretar diferente al verifier. Mitigación: el architect documenta su decisión en el reporte de archivo.
