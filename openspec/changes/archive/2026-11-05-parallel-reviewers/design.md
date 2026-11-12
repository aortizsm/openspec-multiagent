## Status
Draft

## Executive Summary
Cambiar el orden del loop de revisión en `AGENTS.md` para ejecutar `@code-reviewer` y `@security-reviewer` en paralelo después de `@developer`, reduciendo ciclos de ida y vuelta entre agentes.

## Artifacts
- `openspec/changes/parallel-reviewers/proposal.md`
- `openspec/changes/parallel-reviewers/design.md`
- `openspec/changes/parallel-reviewers/tasks.md`
- `AGENTS.md` (modificar orden del loop)

## Risks
- Si ambos revisores devuelven cambios sobre el mismo archivo, el `@developer` debe resolver conflictos entre ambos reportes
- Se pierde la secuencia estricta de "code-reviewer antes de security-reviewer"

## Next Recommended
Implementar el cambio en AGENTS.md.
