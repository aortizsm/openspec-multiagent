# adaptive-pipeline-profiles

## Contexto

El orquestrador ejecutaba el mismo pipeline `standard` para todos los changes: docs pagaban test-engineer + 3 reviewers + verifier, y cambios de riesgo no escalaban. No había detección automática de riesgo ni gap-filler real.

## Qué cambió

- **`scripts/lib.mjs`**: `DEFAULT_RISK_GLOBS`, `matchRiskGlobs`, `getEffectiveProfile`, `parseCoverageMap`, `findSpecMarkdownFiles`.
- **`scripts/orchestrate.mjs`**: `getAgentDAG(profile)` (lite/standard/strict con DAG adaptativo), `checkCoverageMap` (gap-filler para `standard`), `getEffectiveProfile` (escalación hard a `strict` si diff toca risk globs; `lite` en risk → hard error). `main()` usa DAG dinámico según `effectiveProfile`.
- **`.openspec.yaml` por change**: `pipeline: lite|standard|strict` (default `standard`), `risk_globs` opcional (sobrescribe defaults).
- **Tests**: `tests/adaptive-pipeline-profiles.test.mjs` (pendiente: risk escalation, gap-filler skip, DAG composition, quality invariance).

## Por qué

Un pipeline para todo es ineficiente: docs pagan test-engineer + 3 reviewers; riesgos no escalan. Perfiles adaptativos con escalación automática y gap-filler real reducen tokens/wall-time manteniendo umbral de calidad idéntico.

## Cómo se usa

En `.openspec.yaml` del change:

```yaml
pipeline: standard
# risk_globs: ["**/custom/**"]  # opcional, sobrescribe defaults
```

Perfiles:
- **lite**: docs/prompts/refactor interno → dev → code-reviewer(unified) → verifier
- **standard**: dev → test-engineer(gap-filler) → [cr ∥ sr ∥ verifier] (gap-filler salta test-engineer si coverage completo)
- **strict**: standard + test-engineer FULL + verifier suite completa

**Escalación automática**: si diff toca `DEFAULT_RISK_GLOBS` (auth, migrations, SQL, public API, secrets, *.sql, database) → fuerza `strict`. `lite` en risk → hard error.

**Gap-filler**: developer llena tabla en `tasks.md`:

```markdown
| Scenario | Test File | Test Case | Status |
|----------|-----------|-----------|--------|
| user can login | src/auth.test.ts | valid credentials | covered |
| login fails | src/auth.test.ts | invalid credentials | covered |
| password reset | N/A | N/A | no-deterministic-test (architect approved) |
```

Si `allCovered=true` → salta test-engineer (telemetry: `test_engineer_skipped: true`).

**Umbral calidad INVARIANTE**: 1) verifier PASS en todos scenarios, 2) cero CRITICAL/WARNING abiertos, 3) `openspec validate --strict` PASS, 4) todos gates PASS vigentes (fingerprint-matched).

## Impacto / Migración

Ninguno breaking. Changes existentes sin `.openspec.yaml` o sin `pipeline` usan `standard`. Risk globs defaults conservadores. Tests de orchestrator-gates y context-bundles cubren lógica base.

## Evidencia

- `node scripts/orchestrate.mjs harden-orchestrator-gates --dry-run`: muestra perfil `strict` y DAG adaptativo.
- `npm test`: 105/107 passed (2 fallos pre-existentes fake opencode).
- `tests/orchestrator-gates.test.mjs`: 10/10 passed.
- `tests/context-bundles.test.mjs`: 10/10 passed.