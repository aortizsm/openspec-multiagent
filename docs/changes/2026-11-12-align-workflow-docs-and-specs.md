# align-workflow-docs-and-specs

**Fecha:** 2026-11-12
**Estado:** implementado

## Contexto

Las guías, el README y las instrucciones del architect describían rutas de ejecución y gates distintos al flujo estándar actual. Además, las specs conservaban el modelo anterior de `execution-mode` por change y el repositorio aún incluía una definición de `@fast-architect`.

## Qué cambió

- README, guía de verificación, `AGENTS.md` e instrucciones del architect describen un solo flujo: una aprobación del diseño, implementación, fase paralela de `@test-engineer`, `@code-reviewer` y `@security-reviewer`, verificación independiente y archivo.
- `proposal.md` debe contener `## Intent`, `## Why` y `## What Changes` antes de ejecutar agentes; `## Intent` se mantiene como requisito local del repositorio.
- Se retiró el capability de `change-execution-mode`; las specs conservan los requisitos de la fase paralela de tres agentes y la espera del verifier.
- Se eliminó `opencode/agents/fast-architect.md`. El instalador copia las definiciones fuente, pero no borra archivos obsoletos de instalaciones anteriores.
- El registro histórico del 2026-11-09 se dejó intacto.

## Por qué

La documentación y las specs deben reflejar un flujo único con los gates completos, alineado con el comportamiento actual del orquestador. No se modificó `scripts/orchestrate.mjs` ni se cambió el orden de ejecución.

## Cómo se usa

En la ejecución estándar, `proposal.md` incluye las tres secciones requeridas y el diseño recibe una sola aprobación explícita. Tras aprobarlo, el pipeline de implementación y revisión comienza en `@developer`, corre los tres agentes de calidad en paralelo y continúa con `@verifier` antes de validar y archivar. Esta descripción no cubre `--from <agent>`, que actualmente permite reanudar en una etapa posterior sin comprobar que los gates previos requeridos se hayan ejecutado. El cambio de seguimiento aprobado secuenciará `@test-engineer` antes de los revisores y endurecerá `--from` para impedir el archivo cuando se hayan omitido gates.

Si una instalación previa conserva una copia de `fast-architect.md`, elimínala manualmente del directorio global `$XDG_CONFIG_HOME/opencode/agents/fast-architect.md` cuando `XDG_CONFIG_HOME` esté definido; de lo contrario, usa `~/.config/opencode/agents/fast-architect.md` (en Windows, `%APPDATA%\opencode\agents\fast-architect.md`). Las copias locales del proyecto están en `.opencode/agents/fast-architect.md`. La instalación o actualización normal no elimina automáticamente esos archivos.

## Impacto / Migración

No hay cambios de runtime ni de dependencias. Las instalaciones nuevas ya no reciben `fast-architect.md`; las copias existentes requieren eliminación manual. Las propuestas nuevas deben incluir `## Intent`, `## Why` y `## What Changes`; el campo `execution-mode` ya no forma parte del flujo.

## Evidencia

- `npm test`: pasó; `tests/run.mjs` reportó 55 pruebas y `tests/lib.test.mjs` reportó 38, sin fallos.
- `openspec validate align-workflow-docs-and-specs --strict`: válido.
- `openspec validate --all`: 24 elementos válidos, 0 fallos.
- `git diff --check`: pasó sin errores.
- `scripts/orchestrate.mjs` no se modificó; `docs/changes/2026-11-09-parallel-orchestrate.md` permanece sin cambios.
