# architect-edit-boundary

## Contexto

El prompt de `opencode/agents/architect.md` tiene dos reglas de edición contradictorias: una nota (`## File Editing Permissions`) dice que el architect edite cualquier archivo fuera de sus rutas permitidas con comandos de shell (`sed`, `echo`, redirección), mientras que otro párrafo restringe sus recursos escribibles a solo `openspec/**`, `AGENTS.md` y `opencode/agents/*`. Además, la allowlist de `edit` no cubre `.opencode/agents/*`, el espejo instalado que este repo versiona y que un test exige byte-idéntico a la fuente, por lo que sincronizarlo no tenía vía sancionada.

El usuario decidió: el architect edita el registro del proceso y delega todo lo que cambia comportamiento verificable en `@developer`.

## Qué cambió

- Se extendió la allowlist de `edit` de `opencode/agents/architect.md` (frontmatter efectivo y la copia muerta del cuerpo, idénticas en ambas) con `.opencode/agents/*`, `README.md` y `docs/**`, manteniendo `openspec/**`, `AGENTS.md`, `opencode/agents/*` y el `deny` de `resource: "*"`.
- Se eliminó la sección `## File Editing Permissions` (título + párrafo) en ambas ocurrencias, de modo que no queda instrucción que presente shell como vía de edición.
- Se alineó el párrafo de recursos escribibles en ambas ocurrencias: `openspec/**`, `AGENTS.md`, `opencode/agents/*`, `.opencode/agents/*`, `README.md` y `docs/**`; tests, código fuente y `scripts/**` van a `@developer` mediante una fila de `tasks.md`, porque cambian comportamiento verificable. Nunca usar comandos de shell para editar archivos.
- Se hizo byte-idéntica la copia `.opencode/agents/architect.md` a `opencode/agents/architect.md`.
- No se tocó la sección "D) Implementation and review loop" ni el resto de la segunda copia del prompt.
- Se añadió un grupo de contrato en `tests/run.mjs` que lee ambos prompts y verifica los seis recursos, la regla de delegación, la ausencia de instrucción de edición por shell, la allowlist con el `deny` de `*` y que `tests/*` y `scripts/**` no son editables por el architect.
- Se actualizaron `README.md`, `docs/guides/agent-workflow.md` y `docs/CHANGELOG.md`.

## Por qué

Shell no es una vía de edición para el architect: sus recursos escribibles se declaran en el prompt y se aplican con la allowlist de `edit`. Unir el registro del proceso a una sola frontera, comprobable en el prompt y en la allowlist, evita que el architect edite por sí mismo archivos que cambian comportamiento verificable (tests, fuente, `scripts/**`), que deben pasar por `@developer` y las revisiones.

## Cómo se usa

El architect edita únicamente `openspec/**`, `AGENTS.md`, `opencode/agents/*`, `.opencode/agents/*`, `README.md` y `docs/**`. Para tests, código fuente o `scripts/**`, delega en `@developer` a través de una fila de `tasks.md` del change. Nunca usa comandos de shell para editar archivos; `shell` sigue siendo un canal de ejecución de comandos del proyecto, no de edición.

## Impacto / Migración

- `opencode/agents/architect.md`: allowlist de `edit`, eliminación de la nota de edición por shell y párrafo de recursos escribibles (ambas ocurrencias).
- `.opencode/agents/architect.md`: byte-idéntico a la fuente.
- `openspec/changes/architect-edit-boundary/specs/architect-shell-editing/spec.md`: delta del capability (ya presente).
- `README.md`, `docs/guides/agent-workflow.md`, `docs/changes/2026-11-19-architect-edit-boundary.md`, `docs/CHANGELOG.md`.
- `tests/run.mjs`: regresión de contrato sobre ambos prompts.

La corrección entra en vigor en este repo inmediatamente (OpenCode lee la definición local). En los demás proyectos del usuario aplica cuando se reinstalan los agentes de usuario con `node scripts/install-agents.mjs --force` (o `npm run reinstall`), que sobrescribe los ficheros existentes; sin `--force`, `install-agents.mjs` salta los ficheros que ya existen y el límite no llega a los demás proyectos. Este repo no reinstala automáticamente agentes de otros proyectos.

## Evidencia

- `diff opencode/agents/architect.md .opencode/agents/architect.md` no reporta diferencias (byte-idénticos).
- Las tres ubicaciones del allowlist de `edit` (frontmatter, copia del cuerpo y `.opencode/agents/architect.md`) coinciden y conceden `edit` sobre los seis recursos, manteniendo el `deny` de `*`.
- No queda ninguna instrucción que presente shell como vía de edición (`## File Editing Permissions` ni `redirection` ligadas a edición) en `opencode/agents/architect.md`.
- `npm test`, `npm run check`, `openspec validate architect-edit-boundary --strict` y `git diff --check` finalizan correctamente.
- La regresión de `tests/run.mjs` falla con el prompt previo (persiste la instrucción de edición por shell y falta el `deny` sobre los nuevos recursos en la allowlist) y pasa tras el cambio.
