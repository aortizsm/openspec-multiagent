## Status
Draft

## Executive Summary
Modificar `scripts/orchestrate.mjs` para ejecutar `code-reviewer` y `security-reviewer` en paralelo después de `test-engineer`, reduciendo el tiempo total de ejecución del loop.

## Artifacts
- `openspec/changes/parallel-orchestrate/proposal.md`
- `openspec/changes/parallel-orchestrate/design.md`
- `openspec/changes/parallel-orchestrate/tasks.md`
- `scripts/orchestrate.mjs` (modificar función runAgents)

## Risks
- Si ambos revisores fallan al mismo tiempo, el manejo de errores se vuelve más complejo
- `saveCheckpoint`/`rollbackToCheckpoint` debe manejarse correctamente para ambos
- No hay estado compartido entre code-reviewer y security-reviewer (leen el mismo diff pero no escriben archivos comunes)

## Next Recommended
Implementar el cambio en scripts/orchestrate.mjs.
