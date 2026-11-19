# remove-duplicate-agent-model-plugin

## Contexto

Este repositorio contenía una copia de ejecución de `/agent-models` en `.opencode/plugins/agent-models/`, además de la fuente empaquetada en `opencode/plugins/agent-models/` y la instalación global del usuario. La disponibilidad global del selector ya está definida por la spec `agent-model-routing`.

## Qué cambió

Se eliminaron los ocho archivos rastreados de `.opencode/plugins/agent-models/`. Se conserva `opencode/plugins/agent-models/` como fuente canónica y también se conservan las partes TUI y Server del paquete: son integraciones de superficies distintas, no copias redundantes entre este checkout y la instalación global.

## Por qué

Al abrir este toolkit, la copia local y la global podían cargar el mismo plugin. El selector instalado globalmente ya está disponible entre proyectos, por lo que este checkout no necesita mantener otra copia de ejecución.

## Cómo se usa

Instala el selector una vez de forma global con `npx openspec-multiagent init` o con el instalador independiente descrito en la [guía de flujo de agentes](../guides/agent-workflow.md). Después, ejecuta `/agent-models` en OpenCode. No se requiere una copia del plugin dentro de cada proyecto.

## Impacto / Migración

El cambio solo limpia este checkout. No modifica el plugin global, `opencode.json`, `cli.json`, las asignaciones ni el comportamiento del instalador. Las copias locales antiguas en proyectos de destino siguen bajo gestión del usuario; el instalador no las elimina. Tras actualizar este checkout, recarga OpenCode. Para revertir la limpieza, restaura los archivos eliminados desde el control de versiones.

## Evidencia

- La spec existente `agent-model-routing`, requisito «Global selector availability», exige disponibilidad tras una instalación global sin requerir copias por proyecto.
- Los únicos archivos de ejecución eliminados son los ocho rastreados bajo `.opencode/plugins/agent-models/`; la fuente canónica no tiene cambios y coincide con la instalación global.
- `npm test`, `npm run check`, `openspec validate remove-duplicate-agent-model-plugin --strict` y `git diff --check` finalizaron correctamente.
