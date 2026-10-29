# verifier-conflict-resolution

**Fecha:** 2026-10-29  
**Estado:** archivado

## Contexto

El `@verifier` ahora hace spec-compliance review y marca cada requerimiento como `implementado`, `parcialmente implementado` o `no implementado`. Puede haber desacuerdos entre el `@verifier` y el `@architect` sobre el estado de un requerimiento. Sin una regla explícita de resolución, esos desacuerdos no tienen mecanismo de decisión.

## Qué cambió

- **Regla de escalación en `@verifier`:** cuando hay un desacuerdo entre el `@verifier` y el `@architect` sobre el estado de un requerimiento, el `@architect` tiene la última palabra y decide si se corrige el código o se ajusta la spec.
- **Rol del `@verifier` reafirmado:** solo reporta, no decide.

## Por qué

| Mejora | Fallo observado |
|--------|----------------|
| Autoridad de último recurso | Sin regla, los desacuerdos sobre estados de requerimiento no tenían resolución |
| Rol claro del verifier | El verifier podía interpretarse como tomador de decisiones |

## Cómo se usa

Si el `@verifier` marca un requerimiento como `no implementado` y el `@architect` discrepa, el `@architect` decide si se corrige el código o se ajusta la spec. El `@verifier` mantiene su rol de solo reportar.

## Impacto / Migración

- **No es breaking change:** solo agrega una regla de escalación al agente verifier.
- **Requiere reinstalación:** `npm run install-agents` + reinicio de OpenCode.

## Evidencia

- `openspec validate verifier-conflict-resolution --strict`: válido.
- `openspec archive verifier-conflict-resolution --yes`: archivado como `2026-10-29-verifier-conflict-resolution`.
- Diff acotado a `opencode/agents/verifier.md`.
