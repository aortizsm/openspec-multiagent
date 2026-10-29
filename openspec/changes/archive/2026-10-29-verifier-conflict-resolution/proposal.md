# Proposal

## Why

El `@verifier` ahora hace spec-compliance review y marca cada requerimiento como `implementado`, `parcialmente implementado` o `no implementado`. Puede haber desacuerdos entre el `@verifier` y el `@architect` sobre el estado de un requerimiento. Sin una regla explícita de resolución, esos desacuerdos no tienen mecanismo de decisión.

## What Changes

- **Regla de escalación en `@verifier`**: cuando hay un desacuerdo entre el `@verifier` y el `@architect` sobre el estado de un requerimiento, el `@architect` tiene la última palabra y decide si se corrige el código o se ajusta la spec.
- **Rol del `@verifier` reafirmado**: solo reporta, no decide.

## Capabilities

### New Capabilities

<!-- Ninguna: esta es una regla de proceso, no una capability nueva. -->

### Modified Capabilities

- `independent-verification` (capa existente): se agrega regla de resolución de conflictos en la sección Escalation.

## Impact

- `opencode/agents/verifier.md`: se agrega una regla a la sección `## Escalation` para resolución de desacuerdos entre @verifier y @architect.
- Sin cambios en otros agentes.
- Sin dependencias nuevas.
