# role-scoped-context-bundles

## Contexto

El orquestrador inyectaba un único bundle `OPENCODE_CONTEXT_BUNDLE` (propuesta, diseño, tareas, specs, diff completo) a todos los agentes vía variable de entorno. Pero **ningún agente lo leía** (confirmado por grep). Cada agente re-leía archivos o dependía del prompt del architect — duplicando I/O y tokens. Un bundle para todos = 50-70% tokens desperdiciados.

## Qué cambió

- **`scripts/lib.mjs`**: añade `writeRoleBundle`, `readScoutCache`/`writeScoutCache`, `summarizeDiff`, `buildDeveloperBundle`, `buildTestEngineerBundle`, `buildCodeReviewerBundle`, `buildSecurityReviewerBundle`, `buildVerifierBundle`, `buildAgentBundle`, `writeVerdict`/`readVerdict`, `agentBundlePath`, `agentVerdictPath`, `agentFindingsPath`.
- **`scripts/orchestrate.mjs`**: escribe bundle por rol en `.opencode/run/<change>/<agent>-bundle.md`, pasa ruta vía stdin (`Change: <name>. Context bundle: <path>. Read it first.`), elimina `OPENCODE_CONTEXT_BUNDLE` env var. Parsea verdict JSON tras ejecución (exit 0 = artifact producido). En `verdict=FAIL` → hallazgos a `<agent>-findings.json` → ruta a developer.
- **`opencode/agents/*.md`** (5 agentes): prompts actualizados para leer bundle desde path en mensaje, escribir verdict JSON. Sin `OPENCODE_CONTEXT_BUNDLE`.
- **`scripts/lib.mjs`**: `summarizeDiff` para diff > 60 KB (file list + stats + primeros 500 líneas; diff completo en path). `readScoutCache`/`writeScoutCache` en `.opencode/cache/scout-<HEAD>.md` (1× por HEAD).
- **Tests**: `tests/context-bundles.test.mjs` (10 tests: bundles por rol, size ≤ 60 KB, diff summarization, verdict JSON, scout cache 1× por HEAD).

## Por qué

Reducir 50-70% tokens y wall-time: cada agente recibe solo lo que necesita. Scout cache evita 5 invocaciones de `@repo-scout` por run. Contrato verdict JSON permite juicio machine-first sin parsing de texto libre.

## Cómo se usa

El orquestrador gestiona todo automáticamente. Variables de entorno relevantes:
- `ORCHESTRATOR_TIMEOUT_MS`: timeout por agente (default 15 min).

Artefactos generados:
- `.opencode/run/<change>/<agent>-bundle.md`: bundle por rol
- `.opencode/run/<change>/<agent>-verdict.json`: veredicto JSON
- `.opencode/run/<change>/<agent>-findings.json`: hallazgos si verdict=FAIL
- `.opencode/cache/scout-<HEAD>.md`: cache de repo-scout por HEAD

## Impacto / Migración

Ninguno breaking. `OPENCODE_CONTEXT_BUNDLE` ya no se inyecta (no se usaba). Agentes leen bundle desde path en stdin. Prompts actualizados en `opencode/agents/*.md` y `.opencode/agents/*.md`.

## Evidencia

- `node tests/context-bundles.test.mjs`: 10 passed, 0 failed (roles, size ≤ 60 KB, diff summarization, verdict JSON, scout cache 1×/HEAD).
- `node tests/lib.test.mjs`: 39 passed, 0 failed.
- `npm test`: 105/107 passed (2 fallos pre-existentes fake opencode/npx).