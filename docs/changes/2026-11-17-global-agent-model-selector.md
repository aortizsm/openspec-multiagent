# Selector global de modelos de agentes

## Contexto

Antes, `init` y el instalador independiente copiaban el plugin TUI `/agent-models` al directorio `.opencode/plugins/` de cada proyecto. Esto requería instalarlo repetidamente, aunque el selector ya resolvía el catálogo y la configuración según el proyecto activo.

## Qué cambió

- El instalador coloca el plugin en el directorio global de plugins de OpenCode del usuario, respetando `XDG_CONFIG_HOME`; usa el directorio de configuración de OpenCode por defecto si la variable no está definida.
- `init` instala el mismo plugin global e idempotente. La instalación no edita `opencode.json` ni `cli.json` globales y no crea nuevas copias del plugin en proyectos.
- El selector continúa guardando las asignaciones en la configuración reconocida efectiva del proyecto activo; si no existe, crea `.opencode/opencode.jsonc`.
- La guía explica `--dry-run`, `--force` y cómo retirar manualmente una copia local antigua solo después de comprobar que no contiene personalizaciones.

## Por qué

OpenCode V2 descubre plugins desde el directorio global del usuario. Esto habilita el selector entre proyectos sin trasladar las asignaciones de modelos fuera del proyecto donde se eligen.

## Cómo se usa

Inicializa un proyecto con `npx openspec-multiagent init` para instalar el plugin global. Para instalarlo manualmente, ejecútalo desde cualquier proyecto:

```bash
npx --yes --package=github:aortizsm/openspec-multiagent openspec-multiagent-install-agent-models --dry-run
npx --yes --package=github:aortizsm/openspec-multiagent openspec-multiagent-install-agent-models
npx --yes --package=github:aortizsm/openspec-multiagent openspec-multiagent-install-agent-models --force
```

Después, ejecuta `/agent-models` en OpenCode. La selección actualiza el proyecto activo, no la configuración global del usuario.

## Impacto / Migración

Las nuevas instalaciones ya no necesitan una copia de `.opencode/plugins/agent-models/` por proyecto. Las copias antiguas no se eliminan automáticamente. Solo se deben borrar manualmente después de confirmar que son copias del toolkit sin cambios personalizados. Las asignaciones de modelos existentes permanecen en las configuraciones de sus proyectos y no requieren migración. No se requiere editar la configuración global de OpenCode.

## Evidencia

Las pruebas de `tests/agent-model-plugin.test.mjs` comprueban el destino global aislado por XDG, la repetición de instalación, `--dry-run`, `--force`, ausencia de escrituras de configuración global, inicialización en proyectos distintos, aislamiento de asignaciones y fallos seguros. La verificación del repositorio se ejecuta con `npm test`, `npm run check`, `openspec validate global-agent-model-selector --strict` y `git diff --check`.
