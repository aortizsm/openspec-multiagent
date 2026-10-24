# Proposal

## Why

Dos desajustes entre lo documentado y lo implementado en el paso opcional de MCP servers:

1. **`git` no existe en el instalador.** La spec, el `README` y `check.mjs` esperan tres servidores (filesystem, git, github), pero `setup.mjs` solo ofrece dos. `git` no se puede configurar nunca, así que `check.mjs` lo reporta siempre como `none` y el usuario persigue un servidor que el instalador no instala.
2. **Los defaults están invertidos.** Spec y `README` dicen que cada pregunta tiene default **"no"**; el código pasa `defaultYes: true`. Además, `askYesNo` devuelve el default cuando no hay TTY, así que en CI el instalador **escribe** entradas MCP en lugar de saltarse el paso, que es lo que la spec exige.

## What Changes

- Se retira `git` de la lista de MCP servers: de la spec, del `README` y de `check.mjs`. Se mantienen `filesystem` y `github`.
- Las preguntas de MCP pasan a tener default **"no"** en `setup.mjs`, con lo que un entorno no interactivo salta el paso en vez de escribir configuración.
- Sin cambios en el formato de las entradas, en el flujo del token de GitHub, ni en la regla de no sobrescribir.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `configure-mcp-servers`: la lista de servidores ofrecidos y comprobados baja a `filesystem` y `github`; el orden de preguntas pasa a ser filesystem → github. El default "no" ya era requisito, no cambia.

## Impact

- `scripts/setup.mjs`: default de las preguntas MCP.
- `scripts/check.mjs`: lista de servidores esperados.
- `README.md`: descripción del paso, orden de preguntas y ejemplo de configuración.
- `tests/run.mjs`: un test que fija que `git` ya no se reporta.
- Sin cambios en agentes, en la política de memoria ni en instaladores de Engram/Context7.
