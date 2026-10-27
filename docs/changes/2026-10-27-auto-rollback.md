# Auto-rollback: checkpoint git antes de cada fase del pipeline

**Fecha:** 2026-10-27  
**Estado:** pendiente de archivo

## ¿Qué cambia?

Añade `scripts/rollback.mjs`, un script que crea un checkpoint de git (commit vacío con mensaje `rollback: checkpoint before <fase>`) antes de cada fase del pipeline y permite revertir el árbol de trabajo a ese checkpoint si la fase falla.

Integra el checkpoint en `scripts/orchestrate.mjs`: antes de ejecutar cada agente (desarrollador, test-engineer, revisor, verificador) se guarda un checkpoint; si el agente falla, se ejecuta rollback al checkpoint previo y el proceso termina con error.

Añade los comandos npm `rollback` y `rollback:save` a `package.json`.

## Escenarios de uso / Impacto

- `node scripts/rollback.mjs save desarrollador` crea un commit de checkpoint antes de la fase `desarrollador` y devuelve su hash.
- `node scripts/rollback.mjs rollback` restaura el árbol de trabajo al último checkpoint (`git reset --hard`).
- `npm run rollback` ejecuta el rollback; `npm run rollback:save <fase>` guarda un checkpoint.
- Si el script se ejecuta fuera de un repositorio git, imprime un error y sale con código 1.
- En `orchestrate.mjs`, cada fase se ejecuta tras `saveCheckpoint(agente)`; en caso de fallo, `rollbackToCheckpoint()` revierte los cambios parciales antes de salir con código 1.

## Detalles técnicos

**Archivos modificados:**

- `scripts/rollback.mjs` (nuevo): exporta `saveCheckpoint(phaseName)` y `rollbackToCheckpoint()`; punto de entrada CLI con subcomandos `save` y `rollback`. Solo usa built-ins de Node (`child_process`, `path`).
- `scripts/orchestrate.mjs` (modificado): importa `saveCheckpoint` y `rollbackToCheckpoint`; guarda checkpoint antes de cada fase y hace rollback en el bloque `catch`.
- `package.json` (modificado): añade los scripts `rollback` y `rollback:save`.

**Orden de operación en cada fase:**

1. `saveCheckpoint(agente)` — commit vacío `rollback: checkpoint before <agente>`.
2. Ejecución del agente (`runAgent`).
3. Si falla: `rollbackToCheckpoint()` → `git reset --hard` al checkpoint, luego `process.exit(1)`.

## Migración

No se requiere migración: es una funcionalidad nueva y autónoma sin usuarios previos. No afecta flujos ni agentes existentes.

## Evidencia

- `node --check scripts/rollback.mjs` — sintaxis válida.
- `node --check scripts/orchestrate.mjs` — sintaxis válida.
- `openspec validate auto-rollback` — cambio válido (exit 0).
- `node tests/run.mjs` — 33 tests pasan, 0 fallan (suite principal).
