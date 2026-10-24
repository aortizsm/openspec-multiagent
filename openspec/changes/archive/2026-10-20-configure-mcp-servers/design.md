# Design: Preguntar al usuario si quiere configurar MCP servers en el instalador

## Alcance

Preguntar individualmente por filesystem, git y github. Solo se escriben las entradas que el usuario acepta. GitHub requiere token de acceso personal.

## Flujo de instalación

```
setup.mjs
├─ Paso 1: Check Node.js
├─ Paso 2: Instalar OpenSpec CLI
├─ Paso 3: Configurar Context7
├─ Paso 4: Instalar agentes
├─ Paso 5: Engram (opcional)  ← cambio anterior
├─ Paso 6: MCP servers (opcional) ◄── NUEVO
│    ├─ Preguntar filesystem (default: no)
│    ├─ Preguntar git (default: no)
│    └─ Preguntar github (default: no)
│         └─ Si sí: pedir GITHUB_TOKEN
│    └─ Escribir entradas aceptadas en opencode.json
└─ Paso 7: Preflight check
```

## Cambios por archivo

### scripts/lib.mjs

Agregar helpers:

- `writeMcpEntry(serverName, entry)`: lee `opencode.json`, agrega/actualiza `mcp.servers.<serverName>`, escribe de vuelta. Respeta JSONC (no destruir comentarios).
- `hasMcpEntry(serverName)`: verifica si ya existe una entrada para ese servidor.

### scripts/setup.mjs

Agregar paso opcional entre Engram y preflight:

- Para cada MCP (filesystem, git, github): `askYesNo(..., { defaultYes: false })`.
- En CI/non-interactivo: todas las respuestas son `false` (default), se salta.
- Si github aceptado: `askText("GITHUB_TOKEN: ")` para obtener el token.
- Escribir entradas en `~/.config/opencode/opencode.json`.
- Nueva bandera `--no-mcp` para omitir completamente.

### scripts/init.mjs

Verificar si necesita cambios. Probablemente no, ya que `setup.mjs` es el instalador principal.

### README.md

Documentar las nuevas preguntas opcionales de MCP y la bandera `--no-mcp`.

## Detalles técnicos

- Filesystem: ruta del proyecto (`/home/noesis/Desarrollos/MISC/opencode-openspec-multiagent`) hardcodeada o detectada desde `REPO_DIR`.
- Git: misma ruta del proyecto.
- GitHub: requiere `GITHUB_TOKEN` de usuario.
- Forma V2: `mcp.servers.<name> = { type: local, command: [...] }`.
- Para github: agregar `env: { GITHUB_TOKEN: <token> }`.

## Suposiciones

- El usuario tiene `npx` disponible para descargar los servidores MCP de `@modelcontextprotocol/server-*`.
- El token de GitHub tiene scopes `repo` y `read:user`.
- No se valida el token (se escribe tal cual); OpenCode fallará al conectar si es inválido.
