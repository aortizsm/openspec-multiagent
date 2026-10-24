# Feature: Preguntar al usuario si quiere configurar MCP servers en el instalador

## Why

Hoy el instalador del proyecto solo configura OpenSpec y Context7 de forma automática. Los MCP de filesystem, git y github son muy útiles para desarrollo agentizado pero el usuario debe agregarlos manualmente en `~/.config/opencode/opencode.json`. Que el instalador los pregunte y los configure reduce fricción en el onboarding.

## What Changes

El instalador (`setup.mjs`) incluirá un nuevo paso opcional "Configurar MCP servers" que:

1. Pregunte si quiere configurar **filesystem** (lectura/escritura de archivos del proyecto).
2. Pregunte si quiere configurar **git** (ver diffs, log, blame, ramas).
3. Pregunte si quiere configurar **github** (crear PRs, revisar issues, listar releases).
4. Para **github**, si el usuario acepta, pida el `GITHUB_TOKEN` (Personal Access Token).
5. Escriba cada entrada aceptada en `~/.config/opencode/opencode.json` bajo `mcp.servers.<nombre>`, forma V2.
6. Si el MCP ya existe en el config, mostrar que ya está configurado y no sobrescribir.

## Alternatives Considered

- **Estado actual (configuración manual):** el usuario debe editar el JSON a mano. Más pasos, más fricción.
- **Configurar todos sin preguntar:** innecesario para quien no usa alguno de ellos; github requiere token, no se puede instalar sin interacción.
- **Preguntar solo en `init.mjs` (wizard de un comando):** `setup.mjs` es el instalador principal y el que usa `check.mjs` para verificar; el paso debe estar ahí.

## Impact

- [x] Breaking changes — no
- [x] Database migrations — no
- [x] API changes — no
