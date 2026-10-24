# Proposal

## Why

Hoy nadie es responsable de la documentación para humanos. La evidencia está en los propios prompts:

- `developer.md` dice: *"Update documentation/comments only when it materially helps correctness/maintainability; avoid filler"* — la documentación es opcional y colateral.
- `code-reviewer.md` revisa corrección, seguridad y tests; no tiene criterio de documentación.
- El checklist de cierre valida spec, diff, verificación y `## Purpose`; no menciona docs humanas.

El resultado es que el conocimiento del proyecto queda en tres sitios que no sirven para leer:

1. `openspec/specs/` — requisitos normativos en inglés (`MUST`, `WHEN/THEN`), sin explicación de uso.
2. `openspec/changes/archive/` — propuesta y diseño con el *por qué* y las alternativas descartadas, pero escrito para el loop y enterrado en el archivo.
3. `README.md` — instalación y uso del instalador, no del sistema resultante.

Un cambio archivado explica perfectamente qué se decidió y por qué, pero nadie puede leerlo para entender cómo usar la funcionalidad. Y no existe changelog: saber qué cambió entre dos versiones exige leer `git log`.

## What Changes

- **Estructura `docs/` fija**: `docs/CHANGELOG.md` (índice), `docs/changes/YYYY-MM-DD-<change>.md` (una entrada por cambio archivado) y `docs/guides/<capability>.md` (manual de uso por capacidad).
- **Responsable: `@developer`**. La documentación es una task más del change, escrita junto al código y revisada en el mismo diff. Sin agente nuevo.
- **Derivación, no invención**: la entrada se construye desde `proposal.md` (por qué), `design.md` (decisiones y alternativas), `tasks.md` (qué se tocó), el diff y el reporte del `@verifier` (evidencia).
- **Criterio de review**: el `@code-reviewer` verifica que la documentación coincide con el diff; no evalúa estilo ni redacción.
- **Gate de cierre**: archivar exige entrada de changelog y guía actualizada cuando el cambio altera comportamiento o uso.
- **Idioma**: `docs/` en español (consumidor humano del equipo); specs y `README.md` siguen en inglés por convención del repo.
- **Alcance condicional**: un cambio que no altera comportamiento ni uso (refactor interno, corrección de typo en un prompt) no exige entrada, pero sí una línea en el changelog si es visible para el usuario.

## Capabilities

### New Capabilities

- `project-documentation`: qué documentación humana produce el workflow, con qué estructura, a partir de qué fuentes, quién la escribe, quién la revisa y qué condición la hace obligatoria antes de archivar.

### Modified Capabilities

<!-- Ninguna: multiagent-workflow e independent-verification definen gates y verificación;
     esta capability añade el artefacto documental y su control de calidad. -->

## Impact

- `docs/` (nuevo): `README.md`, `CHANGELOG.md`, `changes/` y `guides/`.
- `opencode/agents/developer.md`: la documentación pasa de opcional a task obligatoria cuando el cambio altera comportamiento o uso.
- `opencode/agents/code-reviewer.md`: nuevo criterio de revisión — la doc debe coincidir con el diff.
- `AGENTS.md`: regla de documentación y check de cierre.
- Sin código ejecutable ni dependencias nuevas. El `architect` no escribe `docs/`: su permiso de edición sigue limitado a `openspec/**`, `AGENTS.md` y `opencode/agents/*`, lo que fuerza a que la documentación la produzca el `@developer`.
