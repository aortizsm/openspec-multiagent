# Selector de modelos por agente en cada proyecto

## Contexto

La plantilla `opencode.models.example.jsonc` permite definir modelos manualmente, pero no ofrece una selección interactiva por rol y no es una configuración activa. `/models` cambia el modelo de la sesión actual; no configura directamente el modelo de cada subagente.

## Qué cambió

`npx openspec-multiagent init` instala el plugin TUI del proyecto en `.opencode/plugins/agent-models/`, junto con los agentes incluidos en `.opencode/agents/`. El comando `/agent-models` muestra los roles y sus asignaciones actuales y consulta el catálogo disponible en la ubicación actual del proyecto.

Las asignaciones de subagentes se guardan en `agents.<id>.model`, con variantes disponibles o `Default (no variant)`. Para `@architect`, el selector solo ofrece modelos y, tras una confirmación, guarda el modelo predeterminado del proyecto. Ese valor se aplica a todos los agentes primarios en sesiones nuevas; no cambia una sesión ya abierta.

El selector actualiza solamente el archivo de configuración reconocido de mayor precedencia dentro del proyecto. Conserva comentarios JSONC y ajustes no relacionados; no modifica la configuración de usuario. Reconoce selectores de modelo en formato string u objeto de OpenCode; al guardar, usa una referencia string validada. Si el catálogo está vacío o no se puede cargar, se cancela la selección, o la configuración no puede actualizarse sin riesgo, no guarda la asignación y muestra un estado textual.

El procesamiento está acotado: cada archivo de configuración puede tener hasta 1 MiB y 64 niveles de anidamiento; el catálogo admite hasta 2.000 modelos y 256 variantes por modelo. Al superar esos límites, informa del problema y no guarda cambios.

## Por qué

El plugin utiliza los diálogos TUI nativos de OpenCode y el catálogo de modelos de la ubicación actual, evitando una lista fija de proveedores/modelos. El valor predeterminado de proyecto no conserva una variante; por eso `@architect` no ofrece esa opción. La plantilla estática existente sigue disponible como alternativa manual.

## Cómo se usa

Inicializa el proyecto objetivo:

```bash
npx openspec-multiagent init
```

Inicia OpenCode en ese proyecto y ejecuta `/agent-models`. El selector permite elegir un rol y un modelo disponible para `/models`. Para subagentes también permite elegir una variante o el valor predeterminado. Al seleccionar `@architect`, revisa la confirmación: el modelo afecta a todos los agentes primarios en sesiones nuevas, no a la sesión abierta.

Desde el proyecto objetivo, previsualiza una instalación manual con `npx --yes --package=github:aortizsm/openspec-multiagent openspec-multiagent-install-agent-models --dry-run`; ejecuta el mismo comando sin `--dry-run` para instalar el plugin. La fuente GitHub funciona sin publicar el paquete ni cambiar `private`. Una copia existente se conserva; añade `--force` para sobrescribirla.

La instalación y persistencia usan operaciones de directorio ancladas disponibles con Linux `/proc/self/fd`. En plataformas sin ese mecanismo, el instalador y el selector fallan cerrados y no escriben archivos.

## Impacto / Migración

No requiere migración. La plantilla `opencode.models.example.jsonc` mantiene su comportamiento y no se activa automáticamente. El instalador del plugin solo escribe bajo `.opencode/plugins/` del proyecto objetivo; el selector persiste asignaciones en la configuración reconocida del mismo proyecto.

## Evidencia

- `npm test`: 66 pruebas de `tests/run.mjs`, 39 de `tests/lib.test.mjs` y 49 de `tests/agent-model-plugin.test.mjs` pasaron.
- `openspec validate project-agent-model-menu --strict`: válido.
- La verificación independiente de `@verifier` corresponde a la siguiente fase del flujo.
