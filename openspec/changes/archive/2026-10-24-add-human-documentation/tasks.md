# Tasks

## 1. Estructura documental

- [x] 1.1 Crear `docs/README.md` explicando la estructura (`CHANGELOG.md`, `changes/`, `guides/`), el idioma (español) y qué fuentes se usan para escribir una entrada. Verificado: el fichero existe y cubre las tres rutas, la regla de idioma (español en `docs/`, inglés en specs y `README.md`) y las fuentes (`proposal.md`, `design.md`, `tasks.md`, diff y reporte del `@verifier`).
- [x] 1.2 Crear `docs/CHANGELOG.md` como índice cronológico con una línea por change archivado. Incluir una línea por cada change ya archivado en `openspec/changes/archive/`. Verificado: están los siete changes archivados, cada uno con enlace a su `proposal.md`; se añaden además las dos entradas de ejemplo con su estado.
- [x] 1.3 Crear `docs/changes/` y `docs/guides/` con un `.gitkeep` o el primer fichero real, para que las carpetas existan. Verificado: ambas carpetas existen con su primer fichero real (dos entradas en `docs/changes/` y `docs/guides/independent-verification.md`), así que no hace falta `.gitkeep`.

## 2. Entradas de ejemplo

- [x] 2.1 Escribir `docs/changes/2026-10-24-add-verifier-agent.md` con las seis secciones: contexto, qué cambió, por qué, cómo se usa, impacto/migración, evidencia. Derivada de `openspec/changes/add-verifier-agent/`. Verificado: las seis secciones están, y rutas, comandos y resultados se comprobaron contra el repo y el `tasks.md` del change.
- [x] 2.2 Escribir `docs/changes/2026-10-24-harden-multiagent-workflow.md` con las mismas seis secciones, derivada de `openspec/changes/harden-multiagent-workflow/`. Verificado: las seis secciones están; las secciones citadas (`Approval gate`, `Phase gate — Result Contract`, `Validation gate`, severidades y checklists) existen en los ficheros enlazados.
- [x] 2.3 Escribir `docs/guides/independent-verification.md`: cuándo se invoca al `@verifier`, qué comandos ejecuta, cómo se lee su reporte y qué hacer con un `FAIL` frente a un `UNVERIFIABLE`. Verificado: la guía reproduce la allowlist, el contrato de salida y las prohibiciones de `opencode/agents/verifier.md`, y distingue el tratamiento de `FAIL` y `UNVERIFIABLE`.

## 3. Reglas en los agentes

- [x] 3.1 En `opencode/agents/developer.md`, sustituir la regla de documentación opcional por: cuando el change altera comportamiento, configuración o uso, escribir la entrada de `docs/changes/` y actualizar `docs/guides/` como parte de la misma task. Mantener la prohibición de relleno: la doc se deriva de proposal, design, tasks, diff y reporte del verifier. Verificado: la sección `Documentation (mandatory when the change is visible)` sustituye la regla anterior y conserva la nota de comentarios sin relleno.
- [x] 3.2 En `opencode/agents/code-reviewer.md`, añadir el criterio de exactitud documental: comparar nombres, comandos, rutas y comportamiento contra el diff; desajuste que rompe el uso = `CRITICAL`, imprecisión menor = `WARNING`. Sin juicios de estilo. Verificado: el paso 6 de `How to review` lo recoge y declara que estilo, tono, redacción y ortografía no se revisan.
- [x] 3.3 En `AGENTS.md`, añadir la regla de documentación y un check de cierre: no archivar un change visible sin entrada de changelog y guía actualizada. Verificado: nueva sección `Documentación para humanos` y check 6 en el `Checklist de cierre`.

## 4. Verificación del cambio

- [x] 4.1 `openspec validate add-human-documentation --strict`: PASSED ("Change 'add-human-documentation' is valid").
- [x] 4.2 `npm test`: 24/24 passed (0 failed).
- [x] 4.3 docs/changes/ entries cite real files — verified: `opencode/agents/architect.md`, `opencode/agents/code-reviewer.md`, `opencode/agents/verifier.md`, `AGENTS.md` all exist at the cited paths.
- [x] 4.4 docs/ is in Spanish, openspec/specs/ is in English — verified by reading file contents.
