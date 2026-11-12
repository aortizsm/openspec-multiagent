# consolidate-review-feedback

## Contexto

La retroalimentación de los agentes de calidad y del verifier podía llegar fragmentada, dificultando distinguir hallazgos duplicados de causas distintas y conservar evidencia entre correcciones.

## Qué cambió

Se exige un único bundle de corrección con hallazgos trazables en `## Review Findings` del `tasks.md` del change. El ledger registra origen, severidad, criterio, ubicación, corrección, estado y evidencia o justificación. Solo se fusionan hallazgos con la misma causa raíz; los `FAIL` del verifier se incorporan al bundle siguiente. Las correcciones se limitan a tres rondas.

## Por qué

El registro persistente y el bundle consolidado reducen omisiones y repetición de trabajo sin eliminar hallazgos distintos ni relajar los requisitos de calidad, seguridad o verificación.

## Cómo se usa

Después de recibir los resultados de `@test-engineer` y los revisores paralelos, `@architect` actualiza el ledger y envía un solo bundle a `@developer`. Tras cada corrección, vuelve a ejecutar la secuencia completa de calidad y, si todos tienen éxito, el verifier. Si quedan hallazgos `CRITICAL` o `WARNING` tras tres rondas, se detiene, informa el ledger al usuario y no archiva. Si `@verifier` informa `FAIL` tras la tercera ronda, `@architect` registra y reporta el escenario fallido y su evidencia, no inicia una cuarta ronda y no archiva. Una `SUGGESTION` declinada conserva su justificación y no bloquea el archivo.

## Impacto / Migración

No hay cambios de runtime, dependencias ni migración de datos. El flujo de instrucciones para futuros changes agrega el ledger y el límite de correcciones; todos los gates existentes siguen vigentes.

## Evidencia

El contrato y los escenarios se especifican en `openspec/changes/consolidate-review-feedback/specs/multiagent-workflow/spec.md`. Comprobaciones ejecutadas: `npm test` (98 pruebas pasaron, 0 fallaron), `openspec validate consolidate-review-feedback --strict` (válido), `openspec validate --all` (23 aprobados, 0 fallidos) y `git diff --check` (sin errores).
