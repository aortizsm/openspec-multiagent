# Changelog

Cambios archivados en orden cronológico inverso.

<!-- latest start -->

- **[2026-10-27] auto-rollback** — Automatic git checkpoint before each pipeline phase with rollback on failure. ([entrada](changes/2026-10-27-auto-rollback.md))
- **[2026-10-27] context-bundle** — Nuevo script `scripts/context-bundle.mjs` que genera un único bundle Markdown (propuesta, diseño, tareas, spec y `git diff`) de un cambio OpenSpec para entrega de contexto entre agentes; falla rápido (exit 1) si el cambio no existe. Añade los comandos npm `context-bundle` y `context`. ([entrada](changes/2026-10-27-context-bundle.md))
- **[2026-10-27] infra-stability** — El asistente de setup ya no se cuelga en entornos no-TTY o con stdin pipeado; añade `readInput()` primitiva unificada y hace que `ask`/`askText`/`askYesNo` deleguen en ella. ([entrada](changes/2026-10-27-infra-stability.md))
- **[2026-10-26] remove-zen-model-selection** — Elimina la selección de modelos Zen (OpenCode Go) de `npm run setup`: el asistente pasa de 10 a 9 pasos, ya no hay selector interactivo de modelos ni configuración automática del proveedor `opencode-go`. ([entrada](changes/2026-10-26-remove-zen-model-selection.md))
- **[2026-10-25] add-security-criteria** — Criterios de seguridad objetivos (12 reglas verificables) y agente `@security-reviewer` como gate obligatorio en el loop. ([entrada](changes/2026-10-25-add-security-criteria.md))
- **[2026-10-24] add-human-documentation** — Estructura de documentación humana: carpeta `docs/` con CHANGELOG, entradas por change archivado y guías por capacidad. Reglas de idioma (español en docs/, inglés en specs), fuentes de derivación y gate de documentación antes de archivar.
- **[2026-10-24] add-verifier-agent** — Nuevo agente de verificación independiente. Ejecuta los comandos reales del proyecto y devuelve un veredicto por escenario de la spec. ([entrada](changes/2026-10-24-add-verifier-agent.md)) · ([guía](guides/independent-verification.md))
- **[2026-10-24] harden-multiagent-workflow** — Gates de aprobación con menú, contrato de resultado, severidades de review, permisos de shell por segmento y nombres canónicos de herramientas. ([entrada](changes/2026-10-24-harden-multiagent-workflow.md))

<!-- latest end -->

## Cómo usar este fichero

Cada línea enlaza a la entrada completa (`docs/changes/`) y, si aplica, a la guía de uso (`docs/guides/`). La entrada contiene el *por qué*, las decisiones y cómo se usa.
