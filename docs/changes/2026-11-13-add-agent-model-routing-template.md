# Plantilla de asignación de modelos a agentes

## Contexto

El repositorio instala definiciones de agentes, pero no ofrecía un ejemplo copiable para elegir los modelos por proyecto. La plantilla deja esa elección en manos de cada usuario y no modifica la configuración activa de este repositorio.

## Qué cambió

Se añadió `opencode.models.example.jsonc`, un ejemplo no activo con MiMo-V2.6-Flash como default de la sesión primaria y para `developer`, `test-engineer`, `verifier`, `ux-designer`, `repo-scout` y `diff-summarizer`. `code-reviewer` y `security-reviewer` usan GLM-5.3-Flash. También se añadió una prueba determinista de sintaxis y asignaciones, y se actualizaron el README y la guía de agentes.

## Por qué

El nombre de ejemplo no es reconocido como configuración por OpenCode; requiere copiarlo explícitamente a un nombre admitido. Así se ofrece un mapeo reutilizable sin activar ajustes para los colaboradores de este repositorio ni incluir credenciales.

## Cómo se usa

Desde la raíz del repositorio, copia `opencode.models.example.jsonc` al proyecto de destino como `opencode.jsonc` o `.opencode/opencode.jsonc`. Después, conecta OpenCode Go por separado con `/connect` y comprueba los modelos disponibles con `/models`. El modelo raíz establece el default de nuevas sesiones primarias; los modelos bajo `agents` son overrides de los subagentes y no reemplazan sus prompts o permisos instalados. Los límites de Go son por modelo, no un tope global compartido; Extra Usage puede permitir cargos adicionales de pago por uso. La plantilla no impone un límite de gasto global.

## Impacto / Migración

No hay migración ni cambio de comportamiento en este repositorio: el archivo permanece inactivo mientras conserve su nombre de ejemplo. No se modifican configuración activa, agentes instalados, runtime, instalador ni dependencias.

## Evidencia

La prueba de `tests/lib.test.mjs` falló antes de crear el archivo (`ENOENT`) y pasó después. `npm test` pasó (60 pruebas de integración y 39 de biblioteca); `openspec validate add-agent-model-routing-template --strict`, `openspec validate --all` (23 PASS, 0 FAIL) y `git diff --check` también pasaron. Las comprobaciones de espacios en blanco de los archivos nuevos no emitieron diagnósticos; `git diff --no-index` terminó con el código 1 esperado porque compara archivos añadidos. El reporte final de `@verifier` obtuvo 5 PASS, 0 FAIL y 0 UNVERIFIABLE: asignación y prueba exactas, estructura sin credenciales, rutas de copia y documentación de combinación solo de modelos, conexión `/connect` y límites por modelo/Extra Usage confirmados con documentación oficial actual, y plantilla inactiva. Este último PASS se basa en la documentación oficial de nombres de configuración reconocidos y en que el repositorio no contiene una ruta de configuración de proyecto reconocida. Es evidencia estática/documental: no se ejecutó un descubrimiento de configuración en vivo de OpenCode.
