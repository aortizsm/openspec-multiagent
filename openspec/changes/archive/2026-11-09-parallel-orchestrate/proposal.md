## Why
El orquestrador (`scripts/orchestrate.mjs`) ejecuta a los cinco agentes uno tras otro de forma secuencial. `code-reviewer` y `security-reviewer` son independientes entre sí (uno revisa código limpio, el otro seguridad), por lo que no hay razón para esperar a que uno termine para empezar el otro. Ejecutarlos en paralelo reduce el tiempo total de ejecución del cambio.

## What Changes
Modificar `scripts/orchestrate.mjs` para que `code-reviewer` y `security-reviewer` se ejecuten en paralelo después de `test-engineer`, usando `Promise.all`. `verifier` sigue ejecutándose después de que ambos terminan.

## Scope
- `scripts/orchestrate.mjs` (modificar función `runAgents` para paralelizar revisores)

## Success Criteria
- `code-reviewer` y `security-reviewer` se ejecutan en paralelo
- `verifier` ejecuta después de que ambos revisores completen
- El flujo sigue siendo secuencial para: developer → test-engineer → [code-reviewer + security-reviewer] → verifier
