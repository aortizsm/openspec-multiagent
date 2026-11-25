# version-opencode-configs

## Contexto

La configuración de OpenCode del usuario —los proveedores, los modelos, el enrutamiento por agente y los servidores MCP— vive hoy fuera del control de versiones: el fichero global `~/.config/opencode/opencode.json` es de nivel de usuario y el fichero del proyecto `.opencode/opencode.jsonc` está ignorado por `.gitignore`. Al cambiar de equipo se pierden las definiciones de proveedor, el enrutamiento de modelos y la configuración MCP, obligando a reconstruirlas manualmente.

## Qué cambió

- Se añade al repositorio la configuración global como fichero de proyecto reconocido: `opencode.json` en la raíz, con el valor literal de `mcp.servers.github.env.GITHUB_TOKEN` reemplazado por la sustitución `{env:GITHUB_TOKEN}` para que no se comprometa ninguna credencial. Se requiere la variable de entorno `GITHUB_TOKEN`.
- Se deja de ignorar `.opencode/opencode.jsonc` y se commitea, por lo que el enrutamiento de modelo por agente queda versionado.
- Se versióna la configuración de `.opencode/`: su `opencode.jsonc` de enrutamiento de modelo por agente (junto con los ya versionados `agents/`, `commands/` y `skills/`), mientras que `.opencode/run/` y `.opencode/cache/` permanecen ignorados porque son artefactos de tiempo de ejecución del orquestador regenerados en cada corrida que no deben publicarse en este repositorio público.
- Se añade la entrada de documentación y se enlaza desde el changelog.

## Por qué

Tanto el fichero global como el del proyecto están fuera de version control hoy; cambiar de PC obliga a reconstruir manualmente proveedores, modelos y MCP. Versionarlos dentro del repositorio hace que sobrevivan a un cambio de máquina. El token de GitHub nunca se almacena en claro: se referencia mediante sustitución de entorno (`{env:GITHUB_TOKEN}`), y el token previamente almacenado debe rotarse.

## Cómo se usa

- Copiar `opencode.json` como configuración de proyecto (`opencode.json` en la raíz del repositorio).
- Definir la variable de entorno `GITHUB_TOKEN` antes de usar OpenCode con el servidor MCP de GitHub.
- El enrutamiento de modelos por agente se lee desde `.opencode/opencode.jsonc` (modelo por defecto `cline-pass/cline-pass/deepseek-v4.1-flash` y asignaciones por agente para `developer`, `test-engineer`, `verifier`, `ux-designer`, `repo-scout`, `diff-summarizer`, `code-reviewer` y `security-reviewer`).
- Los valores específicos de cada máquina deben ajustarse en otro equipo: la ruta absoluta de `mcp.servers.filesystem.command` (`/home/noesis/Desarrollos/MISC/opencode-openspec-multiagent`) y `providers.llamacpp.settings.baseURL` (`http://localhost:9931/v1`).
- `.opencode/run/` y `.opencode/cache/` permanecen ignorados: son artefactos de tiempo de ejecución del orquestador que se regeneran en cada corrida, por lo que no ensucian el árbol de trabajo y su contenido (diffs, bundles, veredictos, telemetría) nunca se comitea.

## Impacto / Migración

- Nuevo fichero versionado: `opencode.json` (configuración de proyecto).
- `.gitignore`: solo se elimina la regla de ignorado de `.opencode/opencode.jsonc` (su enrutamiento de modelo se versiona); `.opencode/run/` y `.opencode/cache/` permanecen ignorados.
- Máquina diferente: ajustar la ruta absoluta del sistema de archivos y la URL base de `llamacpp`; configurar `GITHUB_TOKEN`.
- Seguridad: rotar el token de GitHub previamente almacenado en claro, ya que quedó expuesto antes de este cambio.
- Sin cambios de comportamiento en el runtime: sólo se versionan ficheros de configuración y documentación.

## Evidencia

- `npm test`: exit 0, 246 passed, 0 failed, 0 skipped (todas las suites de `tests/`).
- `openspec validate version-opencode-configs --strict`: exit 0, "Change 'version-opencode-configs' is valid" (`skip_specs` activado, cero deltas aceptados).
- Repositorio: 0 ocurrencias del valor literal del token de GitHub en el árbol de trabajo y en el contenido staged (verificación ad hoc, el valor nunca se imprime ni se almacena en el repositorio).
