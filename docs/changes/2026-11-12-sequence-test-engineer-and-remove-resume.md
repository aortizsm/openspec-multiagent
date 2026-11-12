# sequence-test-engineer-and-remove-resume

## Contexto

El orquestador iniciaba la generación de pruebas junto con las revisiones, por lo que los revisores podían comenzar antes de que existieran las pruebas finales. Además, `--from` permitía saltar a una fase posterior sin evidencia de que los gates anteriores se hubieran ejecutado.

## Qué cambió

El flujo ahora espera a que `@test-engineer` termine después de `@developer`; luego ejecuta `@code-reviewer` y `@security-reviewer` en paralelo y continúa a `@verifier` solo si todos completan correctamente. El modo `--dry-run` muestra esas fases. El orquestador rechaza `--from <agent>` y `--from=<agent>` antes de ejecutar agentes.

## Por qué

Completar las pruebas antes de revisar reduce retrabajo y da a ambos revisores el mismo resultado completo. Se elimina `--from` en lugar de persistir evidencia de gates, evitando estados de fase obsoletos; una nueva ejecución vuelve al comienzo del pipeline.

## Cómo se usa

Ejecutar `node scripts/orchestrate.mjs <change-name>` para recorrer el pipeline completo. `node scripts/orchestrate.mjs <change-name> --dry-run` muestra el orden sin iniciar agentes. Si se corrige una falla, volver a ejecutar el comando completo; no hay reanudación por agente.

## Impacto / Migración

La eliminación de `--from` es un cambio incompatible para quienes usaban esa opción. Quitarla y ejecutar el pipeline desde `@developer` después de aplicar las correcciones.

## Evidencia

`npm test` continúa pasando (60 pruebas en `tests/run.mjs` y 38 en `tests/lib.test.mjs`). `openspec validate sequence-test-engineer-and-remove-resume --strict` sigue validando el change; `openspec validate --all` sigue pasando 23 de 23 elementos; `git diff --check` terminó sin errores. El reporte de `@verifier` es 7 PASS, 0 FAIL y 0 UNVERIFIABLE.
