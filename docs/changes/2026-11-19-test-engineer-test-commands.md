# test-engineer-test-commands

## Contexto

`@test-engineer` es el único agente que escribe tests y, hasta ahora, el único que no podía ejecutarlos. El `@verifier` (independiente) ya tenía los comandos de test en su allowlist, pero su ejecución ocurre solo después de las revisiones paralelas, por lo que un test roto añadido por el test-engineer costaba una ronda completa de corrección. La ronda 4 del change `project-agent-model-menu` (2026-11-19) lo demostró: uno de los dos tests añadidos comparaba JSON pretty-printed contra una cadena de una línea y solo se detectó porque el architect ejecutó la suite por iniciativa propia.

## Qué cambió

- `opencode/agents/test-engineer.md`: se añade al frontmatter la familia de comandos de test (copiada del bloque `# --- tests ---` de `opencode/agents/verifier.md`: `npm test*`, `npm run test*`, `pnpm`/`yarn`/`bun test*`, `composer test*`, `composer run-script test*`, `vendor/bin/phpunit*`, `php artisan test*`, `pytest*`, `python -m pytest*`, `python3 -m pytest*`, `go test*`, `cargo test*`, `dotnet test*`, `mvn test*`, `./mvnw test*`, `./gradlew test*`, `make test*`). Se mantiene `shell: "*"` con `effect: deny` y las entradas de lectura existentes (`echo`, `cat`, `ls`, `pwd`, `openspec show/list`, subagents, skills, read, glob, grep). No se conceden `npm run check*` ni comandos de build, lint, typecheck, deploy o instalación.
- `opencode/agents/test-engineer.md` (cuerpo del prompt): se reemplaza la regla "Do not execute tests" por la obligación de ejecutar los comandos de test permitidos tras añadir o cambiar un test, reportar el resultado observado con los tests añadidos, no entregar un test que falle a las revisiones paralelas, y declarar los tests como no ejecutados (identificándolos) cuando los comandos no puedan correr en el entorno, para que `@architect` o `@verifier` los validen. En `## Output format` se añade la sección `### Test run` con el resultado observado (`- \`npm test\` → 66 passed / 0 failed (or: not executed — <reason>)`).
- `README.md`: fila `**@test-engineer**` de la tabla de permisos ahora incluye los comandos de test en "Allowed" y la descripción del rol menciona que valida los tests que escribe y reporta el resultado. La columna "Denied" no cambia.
- `docs/guides/agent-workflow.md`: el punto 4 de la secuencia ya no dice "It does not execute tests" y describe el nuevo comportamiento de ejecutar los comandos permitidos y reportar el resultado; en la tabla por agente, la fila de `@test-engineer` añade la ejecución y reporte de tests en "Responsibilities" y quita `execute tests` de "Does not".
- `tests/run.mjs`: se añade un grupo de regresión de contrato del agente que verifica que la familia de comandos de test está permitida, que ningún permiso shell con `resource: "*"` tiene `effect: allow`, que el prompt exige reportar el resultado observado y declarar tests no ejecutados, y que la regla antigua "Do not execute tests" ya no está presente.
- `docs/changes/2026-11-19-test-engineer-test-commands.md` y `docs/CHANGELOG.md`: entrada de change y línea en el bloque `<!-- latest start -->`.

No se tocó `scripts/orchestrate.mjs`, ningún otro `opencode/agents/*.md`, ni la configuración de usuario (`~/.config/opencode/opencode.json`). No hay código de runtime, ni nuevas dependencias, ni cambio en el orden de fases (`@developer → @test-engineer → revisiones paralelas → @verifier`).

## Por qué

Eliminar la asimetría de privilegios: el autor de los tests debía poder validarlos con la mínima ampliación de permisos (solo comandos de test, nunca shell sin restricción), para que los tests rotos se detecten antes de que `@code-reviewer` y `@security-reviewer` inicien sus revisiones paralelas, evitando rondas de corrección innecesarias. `@verifier` sigue siendo el ejecutor independiente y re-ejecuta la suite desde su propio entorno como gate de archivo.

## Cómo se usa

`@test-engineer` escribe los tests del change, ejecuta `npm test` (o el comando de test declarado del proyecto) tras añadirlos o modificarlos, e incluye en su reporte la sección `### Test run` con el resultado observado (por ejemplo, `- \`npm test\` → 66 passed / 0 failed`). Si en su entorno no pueden ejecutarse los comandos permitidos, declara los tests añadidos como "not executed" con el motivo y los identifica para que `@architect` o `@verifier` los validen.

## Impacto / Migración

- Impacto observable: el reporte del test-engineer ahora incluye el resultado de ejecución de sus tests; los tests rotos se detectan antes de las revisiones paralelas.
- No hay migración de datos ni de runtime. Los permisos y el prompt actualizados entran en vigor al reinstalar los agentes con el flujo de instalación existente.
- Se añade una entrada de documentación en español y una línea al CHANGELOG.

## Evidencia

- El test de regresión en `tests/run.mjs` falla con los permisos y el prompt previos al cambio (shell sin test commands, regla "Do not execute tests" presente) y pasa tras el cambio.
- `npm test`, `npm run check`, `openspec validate test-engineer-test-commands --strict` y `git diff --check` finalizan correctamente tras el cambio.
- Ningún otro agente de `opencode/agents/` cambió sus permisos ni se modificó `scripts/orchestrate.mjs`.

## Referencias

- `openspec/changes/test-engineer-test-commands/proposal.md` — intención y alcance del change.
- `openspec/changes/test-engineer-test-commands/design.md` — decisión de reusar el allowlist del verifier y excluir `npm run check*`.
- `openspec/changes/test-engineer-test-commands/specs/multiagent-workflow/spec.md` — scenarios "Test commands are permitted", "Unrestricted shell stays denied", "Non-test commands stay out of the allowlist" y "Added tests are validated before the reviews start".
- `opencode/agents/verifier.md` — bloque `# --- tests ---` fuente de la allowlist copiada.
- `docs/changes/2026-11-18-remove-duplicate-agent-model-plugin.md` — formato de referencia de la entrada de change.
