# Spec: Configurar MCP servers en el instalador

## Purpose

Permitir que el instalador del proyecto (`setup.mjs`) pregunte al usuario si quiere configurar los MCP servers de filesystem, git y github, y escriba las entradas aceptadas en la configuración de OpenCode.

## Requirements

### R1 — Paso opcional en setup.mjs
El instalador `setup.mjs` DEBE incluir un paso opcional para configurar MCP servers. Este paso NO se ejecuta por defecto; el usuario debe aceptarlo explícitamente para cada servidor. En entornos no interactivos (CI), el paso se salta.

### R2 — Preguntar por cada MCP individualmente
El instalador DEBE preguntar por separado si el usuario quiere configurar:
- **filesystem** (lectura/escritura de archivos del proyecto)
- **git** (diffs, log, blame, ramas)
- **github** (PRs, issues, releases)

### R3 — Token de GitHub
Si el usuario acepta configurar github, el instalador DEBE pedir el `GITHUB_TOKEN` (Personal Access Token) y escribirlo en la entrada MCP bajo `env.GITHUB_TOKEN`.

### R4 — Escritura en opencode.json
Cada entrada MCP aceptada DEBE escribirse en `~/.config/opencode/opencode.json` bajo `mcp.servers.<nombre>`, forma V2 (`type: local`, `command: [...]`).

### R5 — No sobrescribir existentes
Si un MCP ya tiene una entrada en el config, el instalador DEBE mostrar que ya está configurado y NO sobrescribir.

### R6 — Bandera --no-mcp
El instalador DEBE soportar `--no-mcp` para omitir completamente este paso.

## Acceptance Criteria

- [x] `setup.mjs` incluye un paso opcional de MCP servers que pregunta al usuario.
- [x] Se pregunta por filesystem, git y github individualmente.
- [x] Si se acepta github, se pide el GITHUB_TOKEN.
- [x] Las entradas aceptadas se escriben en `opencode.json` forma V2.
- [x] Si un MCP ya está configurado, se muestra mensaje y no se sobrescribe.
- [x] `check.mjs` puede verificar que los MCP están configurados.
- [x] No se rompen los pasos existentes del instalador.

## Delta Spec

## ADDED
- `scripts/lib.mjs`: helpers `hasMcpEntry`, `writeMcpEntry`, `mcpConfigFile`
- `scripts/setup.mjs`: paso opcional "Configurar MCP servers", bandera `--no-mcp`
- `scripts/check.mjs`: detección y reporte de MCP servers
- `tests/run.mjs`: 5 tests nuevos para helpers MCP
- `README.md`: documentación de la feature MCP

## MODIFIED
- `scripts/lib.mjs`: imports adicionales (readJsonc, writeConfig, opencodeConfigDir)
- `scripts/setup.mjs`: nuevos flags `--no-mcp`, paso MCP entre Engram y preflight

## REMOVED
(none)

## RENAMED
(none)
