# harden-orchestrator-gates

## Contexto

El orquestrador (`scripts/orchestrate.mjs`) ejecutaba todas las puertas de agente en cada invocación, sin omitir puertas ya aprobadas, sin distinguir fallos de transporte de veredictos FAIL, y con revisores y verificador en paralelo que podían matarse entre sí. No había huella dactilar para invalidar puertas, ni puerta de libro de registro (ledger) que bloqueara el archivo ante hallazgos abiertos, ni contadores de intentos persistidos.

## Qué cambió

- **`scripts/lib.mjs`**: añade `appendRunTelemetry`, `readRunTelemetry`, `captureTokenStats`, `getBaseRef`/`setBaseRef`, `computeChangeDiff`, `persistChangeDiff`, `computeFingerprint`, `loadGates`/`saveGate`, `validateAllGatesPass`, `getAttemptCount`/`incrementAttemptCount`, `getFixCycles`/`incrementFixCycles`, `getGitHeadSync`, `findSpecMarkdownFiles`.
- **`scripts/orchestrate.mjs`**: `runTelemetry` al inicio, `base_ref` capturado en primera ejecución, diff persistido, huella por puerta con omisión (`skipped: true`), `checkLedgerGate` cableado antes de `validate`/`archive`, política de reintentos (1 reintento en fallo de transporte; sin reintento en veredicto FAIL), `runParallelGroupNoKill` (no mata hermanos, `Promise.allSettled`, hallazgos consolidados), tiempo de espera por agente (15 min por defecto), ciclo de corrección máximo 3 con escalada, contadores persistidos en `.run.json`.
- **`scripts/rollback.mjs`**: `saveImplementationCheckpoint`/`rollbackImplementation` para developer y test-engineer; `noopCheckpoint`/`noopRollback` para revisores y verificador (puertas de solo lectura no revierten código).
- **`tests/orchestrator-gates.test.mjs`**: 10 pruebas determinísticas (huella, omisión, diff, ledger, grupo paralelo, timeout, telemetría, validación de puertas).
- **`AGENTS.md`**: sección "Puertas del orquestrador" con semántica de huella, ledger gate, política de reintentos, DAG paralelo y reversión.
- **`docs/guides/agent-workflow.md`**: secuencia actualizada a `@developer → @test-engineer → [@code-reviewer ∥ @security-reviewer ∥ @verifier] → join → ledger gate → validate → archive`.
- **`docs/guides/independent-verification.md`**: documentación de puertas (huella, ledger, validación) y política de reintentos/ciclos de corrección.
- **`docs/changes/2026-11-21-harden-orchestrator-gates.md`**: esta entrada.
- **`docs/CHANGELOG.md`**: nueva línea de índice para este change.

## Por qué

Hacer el orquestrador incremental (omitir puertas ya aprobadas con huella igual), auditable (telemetría por invocación con intentos, wall_ms, exit_code, veredicto, huella, tokens), y fiable (no matar hermanos en paralelo, distinguir transporte de veredicto, persistir contadores, bloquear archivo con ledger abierto).

## Cómo se usa

Ejecutar el orquestrador para un cambio:

```bash
node scripts/orchestrate.mjs <change-name>
```

Variables de entorno:
- `ORCHESTRATOR_TIMEOUT_MS`: tiempo de espera por agente en milisegundos (default `900000` = 15 min).

Artefactos generados:
- `openspec/changes/<change>/.run.json`: telemetría por invocación (invocación, perfil, timestamp, puertas con intentos, wall_ms, exit_code, veredicto, huella, skipped, bundle_bytes, tokens).
- `openspec/changes/<change>/.gates.json`: `base_ref` y veredictos de puerta con huella.
- `.opencode/run/<change>/change.diff`: diff del cambio (incluye staged y untracked).
- `.opencode/run/<change>/<agent>-verdict.json`: veredicto por agente.
- `.opencode/run/<change>/<agent>-findings.json`: hallazgos cuando el veredicto es FAIL.

## Impacto / Migración

Ninguno breaking. Las puertas ya aprobadas con huella idéntica se omiten en re-ejecuciones. El campo `status` es obligatorio en el encabezado de la tabla de `## Review Findings` de `tasks.md`; las filas sin columna `status` se tratan como `open`. Los contadores de intentos y ciclos de corrección se leen de `.run.json` (no de memoria), por lo que sobreviven reinicios del orquestador.

## Evidencia

- `node tests/orchestrator-gates.test.mjs`: 10 passed, 0 failed.
- `node tests/lib.test.mjs`: 39 passed, 0 failed.
- `node tests/run.mjs`: 107 passed, 0 failed.
- `node scripts/check.mjs`: status READY (Node 22.23.5, openspec 1.14.3, skills ok).
