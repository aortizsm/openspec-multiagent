# parallel-orchestrate

**Fecha:** 2026-11-09  
**Estado:** implementado

## Contexto

El orquestrador (`scripts/orchestrate.mjs`) ejecuta a los cinco agentes uno tras otro de forma secuencial. `code-reviewer` y `security-reviewer` son independientes entre sí (uno revisa código limpio, el otro seguridad), por lo que no hay razón para esperar a que uno termine para empezar el otro. Ejecutarlos en paralelo reduce el tiempo total de ejecución del cambio.

## Qué cambió

- **`scripts/orchestrate.mjs`:** la función `runAgents` ahora ejecuta `code-reviewer` y `security-reviewer` en paralelo usando `Promise.all`, después de `test-engineer` y antes de `verifier`. Se agregó `runAgentAsync` (uso de `spawn` asíncrono) para lanzar ambos revisores concurrentemente, y se dividió `runAgents` en helpers (`isReviewerGroupStart`, `runParallelReviewers`, `runSequentialAgent`) para respetar el límite de 30 líneas por función. `main` se volvió `async` y hace `await` de `runAgents`.
- **`openspec/changes/parallel-orchestrate/tasks.md`:** items marcados como completados.
- **`docs/changes/2026-11-09-parallel-orchestrate.md`:** nueva entrada de documentación con las seis secciones requeridas.
- **`docs/CHANGELOG.md`:** se añade una línea de entrada para este change.

## Por qué

| Mejora | Razón |
|--------|-------|
| Ejecución paralela de revisores | `code-reviewer` y `security-reviewer` no comparten estado ni escriben archivos comunes; no hay dependencia entre ellos. |
| Reducir tiempo total | Ejecutar ambos en paralelo acorta el loop del change en aproximadamente el tiempo del revisor más lento, en lugar de la suma de ambos. |

## Cómo se usa

El flujo de orquestación queda:

```
developer → test-engineer → [code-reviewer + security-reviewer] → verifier
```

- `developer`, `test-engineer` y `verifier` siguen ejecutándose secuencialmente.
- `saveCheckpoint` se invoca antes de cada agente y antes del grupo de revisores.
- Si cualquiera de los dos revisores falla, `Promise.all` rechaza, se hace `rollbackToCheckpoint` y el proceso sale con código 1; `verifier` no se ejecuta.
- `openspec validate` y `openspec archive` solo se ejecutan si todos los agentes pasan.

## Impacto / Migración

- **No es breaking change:** la interfaz CLI de `scripts/orchestrate.mjs` no cambia (mismos argumentos, opciones `--from` y `--dry-run`).
- **Orden de ejecución modificado:** `code-reviewer` y `security-reviewer` ya no se ejecutan uno tras otro; se inician al mismo tiempo.
- **Sin dependencias nuevas:** solo se usa `node:child_process` (`spawn`, ya disponible en Node.js built-in).

## Evidencia

- `openspec validate parallel-orchestrate`: pasa (exit 0).
- `node --check scripts/orchestrate.mjs`: pasa.
- `npm test` (tests/run.mjs): 42 passed, 0 failed.
- Diff acotado a `scripts/orchestrate.mjs`, `openspec/changes/parallel-orchestrate/tasks.md`, `docs/changes/2026-11-09-parallel-orchestrate.md` y `docs/CHANGELOG.md`.
