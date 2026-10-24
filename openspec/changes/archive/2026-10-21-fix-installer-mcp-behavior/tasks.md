# Tasks

## 1. Código

- [x] 1.1 En `scripts/setup.mjs`, cambiar el default de las preguntas de MCP servers a `false` (la llamada a `askYesNo` con `defaultYes: true`). Verificar que con stdin no interactivo el paso no escribe configuración y reporta los servidores como omitidos.
- [x] 1.2 En `scripts/check.mjs`, reducir `mcpServerNames` a `["filesystem", "github"]` y actualizar el comentario de la sección, que hoy menciona git.

## 2. Documentación

- [x] 2.1 En `README.md`, quitar `git` de la lista de servidores (línea 182), del orden de preguntas (línea 185) y del ejemplo de configuración (líneas 197-199); cambiar "three OpenCode MCP servers" por "two".
- [x] 2.2 Revisar el resto del `README.md` por si queda alguna otra referencia a un MCP de `git` que no sea el comando `git` de shell o `git diff`.

## 3. Tests

- [x] 3.1 En `tests/run.mjs`, añadir un test que ejecute `node scripts/check.mjs --json` y verifique que ningún resultado se llama `git`. El test MUST NOT modificar la configuración real del usuario (usar `XDG_CONFIG_HOME` temporal como los tests existentes).

## 4. Verificación

- [x] 4.1 Ejecutar `npm test` sin pipe y confirmar que pasa, incluido el test nuevo.
- [x] 4.2 Ejecutar `node scripts/check.mjs` sin pipe y confirmar `status: READY` y que no aparece ningún `git`.
- [x] 4.3 Ejecutar `openspec validate fix-installer-mcp-behavior --strict` y confirmar que la delta es válida (dos `MODIFIED` con todos sus escenarios previos).
- [x] 4.4 Checklist manual: en `node scripts/setup.mjs` interactivo, pulsar Enter en cada pregunta de MCP y confirmar que no se escribe ninguna entrada.
